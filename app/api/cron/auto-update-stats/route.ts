import { NextResponse } from "next/server"
import { getBaseUrl } from "../../../../lib/get-base-url"

// This endpoint will be called by a scheduled job (daily at 8am via Vercel Cron)
export async function GET(request: Request) {
  try {
    console.log("Daily stats update triggered")

    // Get the base URL for API calls
    const baseUrl = getBaseUrl()

    // First, refresh the MLB data cache
    console.log("Refreshing MLB data cache...")
    const mlbResponse = await fetch(`${baseUrl}/api/mlb-current-stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    })

    if (!mlbResponse.ok) {
      console.warn(`MLB data refresh returned status: ${mlbResponse.status}`)
    } else {
      const mlbData = await mlbResponse.json()
      console.log(`MLB data refreshed successfully. Got ${mlbData.players?.length || 0} players.`)
    }

    // Then update team stats
    console.log("Updating team stats...")
    const response = await fetch(`${baseUrl}/api/update-team-stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to update stats: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    console.log("Daily stats update completed successfully")

    return NextResponse.json({
      success: true,
      message: "Stats automatically updated successfully",
      details: data,
      timestamp: new Date().toISOString(),
      schedule: "Daily at 8:00 AM UTC",
    })
  } catch (error: any) {
    console.error("Error in automated stats update:", error)
    return NextResponse.json(
      {
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

