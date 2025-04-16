import { NextResponse } from "next/server"
import { mlbApi } from "../../../lib/mlb-api-service"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("debug-home-runs-api")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerIdsParam = searchParams.get("playerIds")
    const daysParam = searchParams.get("days")

    if (!playerIdsParam) {
      return NextResponse.json(
        {
          error: "No player IDs provided",
        },
        { status: 400 },
      )
    }

    const playerIds = playerIdsParam.split(",")
    const days = daysParam ? Number.parseInt(daysParam, 10) : 7

    logger.info(`Debugging recent home runs for ${playerIds.length} players over ${days} days`)

    // Get recent home runs from the MLB API service
    const homeRuns = await mlbApi.getRecentHomeRuns(playerIds, days)

    // Get raw MLB data for debugging
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    // Get a sample game to debug
    const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDateStr}&endDate=${endDateStr}&gameType=R&fields=dates,games,gamePk`
    let scheduleData
    try {
      const response = await fetch(scheduleUrl)
      scheduleData = await response.json()
    } catch (error) {
      scheduleData = { error: error.message }
    }

    return NextResponse.json({
      success: true,
      homeRuns: homeRuns,
      playerIds: playerIds,
      days: days,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
      scheduleData: scheduleData,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    logger.error("Error debugging recent home runs:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to debug recent home runs",
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
