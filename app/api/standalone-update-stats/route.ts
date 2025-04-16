import { NextResponse } from "next/server"
import { createLogger } from "../../../lib/logger"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase"

const logger = createLogger("standalone-update-stats")

// This endpoint allows for manual triggering of stats updates
export async function GET() {
  try {
    logger.info("Manual stats update triggered - using real MLB data only")

    // Fetch real MLB data from the API - explicitly for 2025 season
    const currentYear = 2025
    let players = []
    let dataSource = ""

    // Fetch from MLB API
    try {
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

      if (mlbData.leagueLeaders && mlbData.leagueLeaders.length > 0 && mlbData.leagueLeaders[0].leaders) {
        players = mlbData.leagueLeaders[0].leaders.map((leader) => ({
          id: `p${leader.person.id}`,
          name: leader.person.fullName,
          team: leader.team?.abbreviation || leader.team?.name || "Unknown",
          hr2025: leader.value,
          position: leader.position?.abbreviation || "Unknown",
        }))
        dataSource = "MLB API (Real Data)"
        logger.info(`Processed ${players.length} players from MLB API`)
      } else {
        throw new Error("No player data found in MLB API response")
      }
    } catch (error) {
      logger.error("Error fetching from MLB API:", error)
      throw new Error(`Failed to fetch real MLB data: ${error.message}`)
    }

    // Fetch all teams using client SDK
    const teamsSnapshot = await getDocs(collection(db, "teams"))
    const updatedTeams = []

    logger.info(`Found ${teamsSnapshot.size} teams to update with real data`)

    // Process each team
    for (const teamDoc of teamsSnapshot.docs) {
      try {
        const team = teamDoc.data()
        const teamPlayers = [
          team.players.tier1Player,
          team.players.tier2Player,
          team.players.tier3Player,
          team.players.wildcard1,
          team.players.wildcard2,
          team.players.wildcard3,
        ]

        // Calculate total HRs for the team based on current stats
        let totalHR = 0
        const playerHRs = []

        teamPlayers.forEach((player) => {
          if (player && player.id) {
            // Find the player's current stats by matching player ID
            const playerStats = players.find((p) => p.id === player.id)

            // Use actual HR count or default to 0 if not found
            const hr = playerStats ? playerStats.hr2025 : 0

            totalHR += hr
            playerHRs.push(hr)
          } else {
            playerHRs.push(0)
          }
        })

        logger.info(`Updating team ${team.teamName} with ${totalHR} HRs from players: ${JSON.stringify(playerHRs)}`)

        // Update the team document with both the total and individual player HRs
        await updateDoc(doc(db, "teams", teamDoc.id), {
          actualHR: totalHR,
          playerHRs: playerHRs,
          lastUpdated: new Date(),
        })

        updatedTeams.push({
          id: teamDoc.id,
          name: team.teamName,
          previousHR: team.actualHR || 0,
          newHR: totalHR,
          playerHRs: playerHRs,
        })
      } catch (error) {
        logger.error(`Error processing team ${teamDoc.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated stats for ${updatedTeams.length} teams using real 2025 MLB data`,
      teams: updatedTeams,
      dataSource,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error updating team stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update team stats",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Replace the entire generateMlbData function with this version that doesn't generate any data
function generateMlbData() {
  // Instead of returning mock data, log that we're trying to use real data only
  console.log("Attempting to use real MLB data only - no mock data")
  return [] // Return empty array so the code doesn't break
}
