import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET(request: Request) {
  try {
    // Clear the cache for the MLB players endpoint
    revalidatePath("/api/mlb-players")

    // Make a fresh request to the MLB API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://homerun-fantasy.vercel.app"}/api/mlb-players`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to refresh MLB data: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "MLB data refreshed successfully",
      source: data.source,
      lastUpdated: data.lastUpdated,
    })
  } catch (error: any) {
    console.error("Error forcing MLB refresh:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to refresh MLB data",
      },
      { status: 500 },
    )
  }
}
