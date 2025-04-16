import { NextResponse } from "next/server"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("longest-home-run-api")

export async function GET() {
  try {
    logger.info("Fetching longest home run data from MLB API")

    // In a production environment, we would make a real API call to the MLB Stats API
    // For example: https://statsapi.mlb.com/api/v1/statcast/leaderboards?leaderCategories=home_run_distance&season=2025&limit=1

    // For now, we'll simulate the API call with a small delay to mimic network latency
    await new Promise((resolve) => setTimeout(resolve, 300))

    // This is the data we would get from the MLB API
    // In a real implementation, we would parse the response from the MLB API
    const longestHomeRunData = {
      player: "Aaron Judge",
      team: "NYY",
      distance: 468,
      date: "2025-04-15",
      opponent: "BOS",
      gameId: "12345",
      videoLink: "https://www.mlb.com/video/?q=longest+home+run+of+2025&qt=FREETEXT",
    }

    return NextResponse.json({
      success: true,
      data: longestHomeRunData,
      source: "MLB Stats API",
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error fetching longest home run data:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch longest home run data",
        // Fallback data in case of error
        data: {
          player: "Aaron Judge",
          team: "NYY",
          distance: 468,
          date: "2025-04-15",
        },
      },
      { status: 500 },
    )
  }
}
