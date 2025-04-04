import { NextResponse } from "next/server"
import { getBaseUrl } from "../../../lib/get-base-url"

// This endpoint is a public wrapper for the update-team-stats API
export async function GET() {
  try {
    // Get the base URL for API calls
    const baseUrl = getBaseUrl()

    // Call the update-team-stats API
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

    return NextResponse.json({
      success: true,
      message: "Team stats updated successfully",
      details: data,
    })
  } catch (error: any) {
    console.error("Error in run-stats-update:", error)
    return NextResponse.json(
      {
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

