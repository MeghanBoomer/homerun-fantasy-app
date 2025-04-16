import { NextResponse } from "next/server"
import { adminDb } from "../../../../lib/firebase-admin"
import { createLogger } from "../../../../lib/logger"
import { mlbApi } from "../../../../lib/mlb-api-service"

const logger = createLogger("cron-update-home-runs")

// This endpoint will be called by a scheduled job (every few hours)
export async function GET(request: Request) {
  try {
    logger.info("Scheduled home run data update triggered")

    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn("Unauthorized cron job attempt", { authHeader })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all player IDs from the database
    const teamsSnapshot = await adminDb.collection("teams").get()
    const allPlayerIds = new Set<string>()

    teamsSnapshot.forEach((doc) => {
      const team = doc.data()
      if (team.players) {
        // Add all player IDs from the team
        if (team.players.tier1Player?.id) allPlayerIds.add(team.players.tier1Player.id)
        if (team.players.tier2Player?.id) allPlayerIds.add(team.players.tier2Player.id)
        if (team.players.tier3Player?.id) allPlayerIds.add(team.players.tier3Player.id)
        if (team.players.wildcard1?.id) allPlayerIds.add(team.players.wildcard1.id)
        if (team.players.wildcard2?.id) allPlayerIds.add(team.players.wildcard2.id)
        if (team.players.wildcard3?.id) allPlayerIds.add(team.players.wildcard3.id)
      }
    })

    logger.info(`Found ${allPlayerIds.size} unique players to check for home runs`)

    // Fetch recent home runs for all players
    const homeRuns = await mlbApi.getRecentHomeRuns([...allPlayerIds], 7)

    // Store the home runs in the database for quick access
    await adminDb.collection("cached-data").doc("recent-home-runs").set({
      homeRuns,
      lastUpdated: new Date(),
    })

    logger.info(`Cached ${homeRuns.length} recent home runs`)

    return NextResponse.json({
      success: true,
      message: `Updated home run data for ${allPlayerIds.size} players`,
      homeRunCount: homeRuns.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error in scheduled home run update:", error)
    return NextResponse.json(
      {
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
