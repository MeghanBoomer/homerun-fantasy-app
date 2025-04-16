import { NextResponse } from "next/server"
import { adminDb } from "../../../lib/firebase-admin"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("mlb-current-stats")

// This endpoint provides current MLB stats for the application
export async function GET() {
  try {
    // Check if we've already fetched data recently to implement rate limiting
    const cacheDoc = await adminDb.collection("mlb-cache").doc("latest").get()
    const cacheData = cacheDoc.exists ? cacheDoc.data() : null
    const lastFetchTime = cacheData?.fetchedAt?.toDate() || new Date(0)
    const now = new Date()

    // If we've fetched within the last 12 hours, use cached data
    const twelveHoursMs = 12 * 60 * 60 * 1000
    if (cacheData && now.getTime() - lastFetchTime.getTime() < twelveHoursMs) {
      logger.info("Using cached MLB data to avoid rate limits")
      return NextResponse.json({
        players: cacheData.players,
        lastUpdated: lastFetchTime.toISOString(),
        source: cacheData.source || "MLB API (Cached)",
        isCached: true,
      })
    }

    logger.info("Fetching fresh MLB data from API")

    // Fetch from MLB API - explicitly for 2025 season
    const currentYear = 2025
    const mlbApiUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=500&sportId=1`

    logger.info(`Fetching MLB data from: ${mlbApiUrl}`)

    const mlbResponse = await fetch(mlbApiUrl, {
      headers: {
        "User-Agent": "Homerun-Fantasy-App/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 0 }, // Don't cache
    })

    if (!mlbResponse.ok) {
      throw new Error(`MLB API responded with status: ${mlbResponse.status}`)
    }

    const mlbData = await mlbResponse.json()
    logger.info("MLB API data fetched successfully")

    // Process the MLB data
    let players = []
    if (mlbData.leagueLeaders && mlbData.leagueLeaders.length > 0 && mlbData.leagueLeaders[0].leaders) {
      players = mlbData.leagueLeaders[0].leaders.map((leader) => ({
        id: `p${leader.person.id}`,
        name: leader.person.fullName,
        team: leader.team?.abbreviation || leader.team?.name || "Unknown",
        hr2025: leader.value, // Explicitly use hr2025 for the 2025 season
        position: leader.position?.abbreviation || "Unknown",
      }))
    } else {
      throw new Error("No player data found in MLB API response")
    }

    // Store this data in Firestore for caching
    await adminDb
      .collection("mlb-cache")
      .doc("latest")
      .set({
        players,
        fetchedAt: new Date(),
        source: `MLB API (${currentYear} Season Data)`,
      })

    return NextResponse.json({
      players,
      lastUpdated: now.toISOString(),
      source: `MLB API (${currentYear} Season Data)`,
      isCached: false,
    })
  } catch (error) {
    logger.error("Error fetching MLB data:", error)
    throw error // Rethrow the error - no fallback to mock data
  }
}

// Update the code to explicitly use 2025 season
// function generateMlbData() {
//   return [
//     // Tier 1 players
//     { id: "p592450", name: "Aaron Judge", team: "NYY", hr2025: 15, position: "RF" },
//     { id: "p660271", name: "Shohei Ohtani", team: "LAD", hr2025: 16, position: "DH" },
//     { id: "p624413", name: "Pete Alonso", team: "NYM", hr2025: 10, position: "1B" },
//     { id: "p656941", name: "Kyle Schwarber", team: "PHI", hr2025: 9, position: "LF" },
//     { id: "p621566", name: "Matt Olson", team: "ATL", hr2025: 7, position: "1B" },
//     { id: "p670541", name: "Yordan Alvarez", team: "HOU", hr2025: 8, position: "DH" },

//     // Tier 2 players
//     { id: "p545361", name: "Mike Trout", team: "LAA", hr2025: 11, position: "CF" },
//     { id: "p665489", name: "Vladimir Guerrero Jr.", team: "TOR", hr2025: 8, position: "1B" },
//     { id: "p665742", name: "Juan Soto", team: "NYY", hr2025: 9, position: "RF" },
//     { id: "p666969", name: "Adolis García", team: "TEX", hr2025: 7, position: "RF" },
//     { id: "p605141", name: "Mookie Betts", team: "LAD", hr2025: 5, position: "RF" },
//     { id: "p547180", name: "Bryce Harper", team: "PHI", hr2025: 6, position: "1B" },

//     // Tier 3 players
//     { id: "p646240", name: "Rafael Devers", team: "BOS", hr2025: 9, position: "3B" },
//     { id: "p606192", name: "Teoscar Hernández", team: "LAD", hr2025: 8, position: "RF" },
//     { id: "p519317", name: "Giancarlo Stanton", team: "NYY", hr2025: 7, position: "DH" },
//     { id: "p677776", name: "Bobby Witt Jr.", team: "KC", hr2025: 9, position: "SS" },
//     { id: "p542303", name: "Marcell Ozuna", team: "ATL", hr2025: 10, position: "DH" },
//     { id: "p669477", name: "Gunnar Henderson", team: "BAL", hr2025: 8, position: "SS" },

//     // Wildcard players
//     { id: "p665742", name: "Ronald Acuña Jr.", team: "ATL", hr2025: 5, position: "RF" },
//     { id: "p665487", name: "Fernando Tatis Jr.", team: "SD", hr2025: 6, position: "RF" },
//     { id: "p700022", name: "Julio Rodríguez", team: "SEA", hr2025: 7, position: "CF" },
//     { id: "p682998", name: "Corbin Carroll", team: "ARI", hr2025: 5, position: "LF" },
//     { id: "p666023", name: "Christopher Morel", team: "CHC", hr2025: 6, position: "3B" },
//     { id: "p656349", name: "Brent Rooker", team: "OAK", hr2025: 8, position: "DH" },
//     { id: "p673357", name: "Luis Robert Jr.", team: "CWS", hr2025: 8, position: "CF" },
//     { id: "p641355", name: "Cody Bellinger", team: "CHC", hr2025: 6, position: "CF" },
//     { id: "p518692", name: "Freddie Freeman", team: "LAD", hr2025: 6, position: "1B" },
//     { id: "p542432", name: "José Ramírez", team: "CLE", hr2025: 8, position: "3B" },
//     { id: "p592518", name: "Manny Machado", team: "SD", hr2025: 8, position: "3B" },
//     { id: "p663586", name: "Austin Riley", team: "ATL", hr2025: 7, position: "3B" },
//     { id: "p571448", name: "Nolan Arenado", team: "STL", hr2025: 5, position: "3B" },
//     { id: "p642715", name: "Willy Adames", team: "MIL", hr2025: 7, position: "SS" },
//     { id: "p596019", name: "Francisco Lindor", team: "NYM", hr2025: 10, position: "SS" },
//     { id: "p608369", name: "Corey Seager", team: "TEX", hr2025: 11, position: "SS" },
//     { id: "p571771", name: "Enrique (Kike) Hernandez", team: "LAD", hr2025: 4, position: "2B/OF" },
//   ]
// }

// Make sure we're using hr2025 when processing player stats
const currentYear = 2025 // Explicitly set to 2025
