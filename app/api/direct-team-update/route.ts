import { NextResponse } from "next/server"
import { adminDb } from "../../../lib/firebase-admin"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("direct-team-update")

// This endpoint updates a specific team's stats
export async function POST(request: Request) {
  try {
    const { teamId } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    logger.info(`Direct team update triggered for team: ${teamId}`)

    // Explicitly use 2025 season
    const currentYear = 2025

    // Fetch from MLB API - no fallbacks
    let players = []
    let dataSource = ""

    try {
      const mlbApiUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=500&sportId=1`

      logger.info(`Fetching MLB data from: ${mlbApiUrl}`)

      const mlbResponse = await fetch(mlbApiUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
      })

      if (!mlbResponse.ok) {
        throw new Error(`MLB API responded with status: ${mlbResponse.status}`)
      }

      const mlbData = await mlbResponse.json()

      if (mlbData.leagueLeaders && mlbData.leagueLeaders.length > 0 && mlbData.leagueLeaders[0].leaders) {
        players = mlbData.leagueLeaders[0].leaders.map((leader) => ({
          id: `p${leader.person.id}`,
          name: leader.person.fullName,
          team: leader.team?.abbreviation || leader.team?.name || "Unknown",
          hr2025: leader.value, // Explicitly use hr2025 for the 2025 season
          position: leader.position?.abbreviation || "Unknown",
        }))

        dataSource = "MLB API (Direct)"

        // Update the cache
        await adminDb.collection("mlb-cache").doc("latest").set({
          players,
          fetchedAt: new Date(),
          source: dataSource,
        })

        logger.info("Updated MLB cache with fresh data")
      } else {
        throw new Error("No player data found in MLB API response")
      }
    } catch (apiError) {
      logger.error("Error fetching from MLB API:", apiError)
      throw new Error(`Failed to fetch MLB data: ${apiError.message}`)
    }

    // Get the team document
    const teamDoc = await adminDb.collection("teams").doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const team = teamDoc.data()
    const teamPlayers = [
      team.players.tier1Player,
      team.players.tier2Player,
      team.players.tier3Player,
      team.players.wildcard1,
      team.players.wildcard2,
      team.players.wildcard3,
    ]

    // Calculate total HRs
    let totalHR = 0
    const playerHRs = []

    teamPlayers.forEach((player) => {
      if (player && player.id) {
        // Find the player's current stats
        const playerStats = players.find((p) => p.id === player.id)

        // Use hr2025 or default to 0
        const hr = playerStats ? playerStats.hr2025 : 0

        totalHR += hr
        playerHRs.push(hr)
      } else {
        playerHRs.push(0)
      }
    })

    logger.info(`Updating team ${team.teamName} with ${totalHR} HRs for ${currentYear}`)

    // Update the team document
    await adminDb.collection("teams").doc(teamId).update({
      actualHR: totalHR,
      playerHRs: playerHRs,
      lastUpdated: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${currentYear} stats for ${team.teamName}`,
      team: {
        id: teamId,
        name: team.teamName,
        previousHR: team.actualHR || 0,
        newHR: totalHR,
        playerHRs: playerHRs,
      },
      dataSource,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error in direct-team-update:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
