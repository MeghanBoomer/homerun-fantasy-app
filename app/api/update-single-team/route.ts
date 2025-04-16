import { NextResponse } from "next/server"
import { adminDb } from "../../../lib/firebase-admin"
import { createLogger } from "../../../lib/logger"
import { getHomeRunLeaders } from "../../../lib/mlb-api"

const logger = createLogger("update-single-team")

export async function POST(request: Request) {
  try {
    const { teamId } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    logger.info(`Updating stats for team: ${teamId}`)

    // Get the team document
    const teamDoc = await adminDb.collection("teams").doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const team = teamDoc.data()

    // Fetch the latest MLB data
    const { players: mlbPlayers } = await getHomeRunLeaders(2025, 500)

    logger.info(`Fetched MLB data with ${mlbPlayers.length} players`)

    // Get the team's players
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

    teamPlayers.forEach((player: any) => {
      if (player && player.id) {
        const playerStats = mlbPlayers.find((p) => p.id === player.id)
        const hr = playerStats ? playerStats.hr2025 : 0
        totalHR += hr
        playerHRs.push(hr)
      } else {
        playerHRs.push(0)
      }
    })

    // Update the team document
    await adminDb.collection("teams").doc(teamId).update({
      actualHR: totalHR,
      playerHRs: playerHRs,
      lastUpdated: new Date(),
    })

    logger.info(`Successfully updated team ${teamId} with total HR: ${totalHR}`)

    return NextResponse.json({
      success: true,
      message: `Updated stats for team ${teamId}`,
      teamId,
      totalHR,
      playerHRs,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error updating single team stats:", error)
    return NextResponse.json(
      {
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
