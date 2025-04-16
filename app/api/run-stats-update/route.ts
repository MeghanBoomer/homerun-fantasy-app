import { NextResponse } from "next/server"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("run-stats-update")

// This endpoint triggers an immediate update of all team stats
export async function GET() {
  try {
    logger.info("Manual stats update triggered via admin panel")

    // Instead of trying to do everything in this endpoint,
    // we'll call the standalone-update-stats endpoint which is more reliable
    const response = await fetch(
      new URL("/api/standalone-update-stats", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(
        `Failed to update stats: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`,
      )
    }

    const data = await response.json()
    logger.info(`Stats update completed successfully: ${data.message || "No message"}`)

    return NextResponse.json(data)
  } catch (error) {
    logger.error("Error in run-stats-update:", error)

    // Return a more detailed error response
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unknown error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
