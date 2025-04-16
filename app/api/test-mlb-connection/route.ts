import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Testing MLB API connection...")

    // Current season year
    const currentYear = new Date().getFullYear()

    // Log the full URL we're trying to access
    const apiUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=10&sportId=1`
    console.log("Attempting to fetch from:", apiUrl)

    // Fetch home run leaders with more detailed error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
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
      if (!data.leagueLeaders || !data.leagueLeaders[0] || !data.leagueLeaders[0].leaders) {
        return NextResponse.json({
          success: false,
          error: "Unexpected data structure from MLB API",
          data: data,
        })
      }

      // Return the top 10 HR leaders
      return NextResponse.json({
        success: true,
        message: "Successfully connected to MLB API",
        leaders: data.leagueLeaders[0].leaders.slice(0, 10).map((leader) => ({
          name: leader.person?.fullName,
          team: leader.team?.abbreviation || leader.team?.name,
          homeRuns: leader.value,
          playerId: leader.person?.id,
          position: leader.position?.abbreviation || "Unknown",
        })),
      })
    } catch (fetchError) {
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
  } catch (error) {
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
