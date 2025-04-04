import { NextResponse } from "next/server"
import { db } from "../../../lib/firebase"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"

// This endpoint provides current MLB stats for the application
export async function GET() {
  try {
    // Check if we've already fetched data recently to implement rate limiting
    const cacheDoc = await getDoc(doc(db, "mlb-cache", "latest"))
    const cacheData = cacheDoc.exists() ? cacheDoc.data() : null
    const lastFetchTime = cacheData?.fetchedAt?.toDate() || new Date(0)
    const now = new Date()

    // If we've fetched within the last 12 hours, use cached data
    const twelveHoursMs = 12 * 60 * 60 * 1000
    if (cacheData && now.getTime() - lastFetchTime.getTime() < twelveHoursMs) {
      console.log("Using cached MLB data to avoid rate limits")
      return NextResponse.json({
        players: cacheData.players,
        lastUpdated: lastFetchTime.toISOString(),
        source: cacheData.source || "MLB API (Cached)",
        isCached: true,
      })
    }

    console.log("Fetching fresh MLB data from API")

    // Current season year
    const currentYear = new Date().getFullYear()

    // Fetch home run leaders from MLB Stats API
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=100&sportId=1`,
      {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 0 }, // Don't cache at the Next.js level
      },
    )

    if (!response.ok) {
      throw new Error(`MLB API responded with status: ${response.status}`)
    }

    const data = await response.json()

    // Extract and format the player data
    let players = []

    if (data.leagueLeaders && data.leagueLeaders.length > 0 && data.leagueLeaders[0].leaders) {
      players = data.leagueLeaders[0].leaders.map((leader) => ({
        id: `p${leader.person.id}`,
        name: leader.person.fullName,
        team: leader.team?.abbreviation || leader.team?.name || "Unknown",
        hr2025: leader.value, // Using the current year's data
        position: leader.position?.abbreviation || "Unknown",
      }))
    } else {
      console.warn("Unexpected MLB API response format:", JSON.stringify(data).substring(0, 200))
      throw new Error("MLB API returned unexpected data format")
    }

    // Store this data in Firestore for caching
    await setDoc(doc(db, "mlb-cache", "latest"), {
      players,
      fetchedAt: serverTimestamp(),
      source: `MLB API (${currentYear} Season)`,
    })

    return NextResponse.json({
      players,
      lastUpdated: now.toISOString(),
      source: `MLB API (${currentYear} Season)`,
      isCached: false,
    })
  } catch (error) {
    console.error("Error fetching MLB data:", error)

    // Try to get cached data as fallback
    try {
      const cacheDoc = await getDoc(doc(db, "mlb-cache", "latest"))
      if (cacheDoc.exists()) {
        const cacheData = cacheDoc.data()
        console.log("Falling back to cached data due to API error")
        return NextResponse.json({
          players: cacheData.players,
          lastUpdated: cacheData.fetchedAt.toDate().toISOString(),
          source: "MLB API (Cached - Fallback)",
          isCached: true,
          error: "Failed to fetch fresh data, using cached data",
        })
      }
    } catch (cacheError) {
      console.error("Error fetching cached data:", cacheError)
    }

    // If no cached data or cache fetch fails, use the placeholder data
    console.log("No cached data available, using placeholder data")

    // Generate placeholder data
    const placeholderPlayers = generatePlaceholderData()

    return NextResponse.json({
      players: placeholderPlayers,
      lastUpdated: new Date().toISOString(),
      source: "MLB API (Placeholder - API Error)",
      isPlaceholder: true,
      error: error.message || "Failed to fetch MLB data",
    })
  }
}

// Generate placeholder data as a fallback
function generatePlaceholderData() {
  // This is the same placeholder data you had before
  return [
    // Tier 1 players
    { id: "p592450", name: "Aaron Judge", team: "NYY", hr2025: 12, position: "RF" },
    { id: "p660271", name: "Shohei Ohtani", team: "LAD", hr2025: 14, position: "DH" },
    { id: "p624413", name: "Pete Alonso", team: "NYM", hr2025: 11, position: "1B" },
    { id: "p656941", name: "Kyle Schwarber", team: "PHI", hr2025: 13, position: "LF" },
    { id: "p621566", name: "Matt Olson", team: "ATL", hr2025: 15, position: "1B" },
    { id: "p670541", name: "Yordan Alvarez", team: "HOU", hr2025: 10, position: "DH" },
    // Add more placeholder players as needed
    // ...
  ]
}

