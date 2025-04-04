import { NextResponse } from "next/server"
import { getBaseUrl } from "../../../../lib/get-base-url"

// This route will be called by a scheduled job (cron)
export async function GET(request: Request) {
  try {
    // Check for a secret token to prevent unauthorized access
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    // In production, you should use a secure token stored in environment variables
    // For now, we'll use a simple token for demonstration
    const validToken = "your-secret-token"

    if (token !== validToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Cron job triggered: Updating home run data")

    // Call our update-home-runs API
    const baseUrl = getBaseUrl()

    const response = await fetch(`${baseUrl}/api/update-home-runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to update home runs: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    console.log("Home run data update completed successfully")

    return NextResponse.json({
      success: true,
      message: "Home run data updated successfully",
      details: data,
    })
  } catch (error: any) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      {
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

