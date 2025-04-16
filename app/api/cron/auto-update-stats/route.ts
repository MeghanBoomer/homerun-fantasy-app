import { NextResponse } from "next/server"
import { adminDb } from "../../../../lib/firebase-admin"
import { createLogger } from "../../../../lib/logger"

const logger = createLogger("cron-auto-update-stats")

// This endpoint will be called by a scheduled job (daily at 8am via Vercel Cron)
export async function GET(request: Request) {
  try {
    logger.info("Daily stats update triggered")

    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn("Unauthorized cron job attempt", { authHeader })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, fetch MLB data - explicitly for 2025 season
    const currentYear = 2025 // Explicitly set to 2025
    const mlbResponse = await fetch(
      `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=100&sportId=1`,
    )

    if (!mlbResponse.ok) {
      throw new Error(`MLB API responded with status: ${mlbResponse.status}`)
    }

    const mlbData = await mlbResponse.json()
    logger.info("MLB data fetched successfully")

    // Process MLB data
    const players = mlbData.leagueLeaders[0].leaders.map((leader: any) => ({
      id: `p${leader.person.id}`,
      name: leader.person.fullName,
      team: leader.team?.abbreviation || leader.team?.name || "Unknown",
      hr2025: leader.value, // Explicitly use hr2025 for the 2025 season
      position: leader.position?.abbreviation || "Unknown",
    }))

    // Store in cache
    await adminDb.collection("mlb-cache").doc("latest").set({
      players,
      fetchedAt: new Date(),
      source: "MLB Stats API (Cron Job)",
    })
    logger.info("MLB data cached successfully")

    // Fetch all teams
    const teamsSnapshot = await adminDb.collection("teams").get()
    const teams = []
    const updates = []

    logger.info(`Found ${teamsSnapshot.size} teams to update`)

    // Update each team's stats
    teamsSnapshot.forEach((doc) => {
      const team: any = doc.data()
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

      teamPlayers.forEach((player: { id?: string; name?: string }) => {
        if (player && player.id) {
          const playerStats = players.find((p: { id: string; hr2025: number }) => p.id === player.id)
          const hr = playerStats ? playerStats.hr2025 : 0 // Use hr2025 for the 2025 season
          totalHR += hr
          playerHRs.push(hr)
        } else {
          playerHRs.push(0)
        }
      })

      // Update the team document
      updates.push(
        adminDb.collection("teams").doc(doc.id).update({
          actualHR: totalHR,
          playerHRs: playerHRs,
          lastUpdated: new Date(),
        }),
      )

      teams.push({
        id: doc.id,
        name: team.teamName,
        previousHR: team.actualHR || 0,
        newHR: totalHR,
      })
    })

    // Wait for all updates to complete
    await Promise.all(updates)
    logger.info(`Updated ${teams.length} teams successfully`)

    return NextResponse.json({
      success: true,
      message: `Updated stats for ${teams.length} teams`,
      teams,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error in automated stats update:", error)
    return NextResponse.json(
      {
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
