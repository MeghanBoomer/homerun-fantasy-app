import { NextResponse } from "next/server"

// MLB Stats API base URL
const MLB_API_BASE_URL = "https://statsapi.mlb.com/api/v1"

export async function GET() {
  try {
    console.log("Testing MLB API connection...")

    // Current season
    const currentYear = new Date().getFullYear()

    // Log the full URL we're trying to access
    const apiUrl = `${MLB_API_BASE_URL}/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=10&sportId=1`
    console.log("Attempting to fetch from:", apiUrl)

    // Fetch home run leaders with more detailed error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        next: { revalidate: 0 }, // Don't cache
      })

      clearTimeout(timeoutId)

      console.log("MLB API response status:", response.status)

      if (!response.ok) {
        throw new Error(`MLB API responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Log the response structure
      console.log("MLB API Response Structure:", JSON.stringify(data, null, 2).substring(0, 500) + "...")

      // Check if we have the expected data structure
      const homeRunLeaders = data.leagueLeaders?.find((leaderboard: any) => leaderboard.leaderCategory === "homeRuns")

      if (!homeRunLeaders || !homeRunLeaders.leaders) {
        return NextResponse.json({
          success: false,
          error: "Could not find home run leaders in the MLB API response",
          data: data,
        })
      }

      // Return the top 10 HR leaders
      return NextResponse.json({
        success: true,
        message: "Successfully connected to MLB API",
        leaders: homeRunLeaders.leaders.slice(0, 10).map((leader: any) => ({
          name: leader.person?.fullName,
          team: leader.team?.abbreviation || leader.team?.name,
          homeRuns: leader.value,
          playerId: leader.person?.id,
        })),
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        console.error("MLB API request timed out after 15 seconds")
        return NextResponse.json(
          {
            success: false,
            error: "Request to MLB API timed out after 15 seconds",
          },
          { status: 408 },
        )
      }

      throw fetchError
    }
  } catch (error: any) {
    console.error("Error testing MLB API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
