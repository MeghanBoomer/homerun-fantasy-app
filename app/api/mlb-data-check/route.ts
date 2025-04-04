import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Try multiple base URL options
    const possibleBaseUrls = [
      process.env.NEXT_PUBLIC_SITE_URL,
      "https://v0-homerun-fantasy-app-meghward-gmailcoms-projects.vercel.app",
      "https://homerun-fantasy.vercel.app",
      "", // relative URL - will use same domain
    ]

    let lastError = null
    let data = null

    // Try each base URL until one works
    for (const baseUrl of possibleBaseUrls) {
      try {
        const url = baseUrl ? `${baseUrl}/api/mlb-players` : "/api/mlb-players"
        console.log(`Trying to fetch from: ${url}`)

        const response = await fetch(url, {
          next: { revalidate: 0 }, // Don't cache
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        data = await response.json()
        console.log("Successfully fetched data")
        break // Exit the loop if successful
      } catch (e) {
        lastError = e
        console.error(`Failed with baseUrl ${baseUrl}:`, e)
        // Continue to the next URL
      }
    }

    if (!data) {
      throw new Error(`All fetch attempts failed. Last error: ${lastError?.message}`)
    }

    // Extract just the essential information
    return NextResponse.json({
      success: true,
      source: data.source || "Unknown",
      lastUpdated: data.lastUpdated || "Unknown",
      playerCounts: {
        tier1: data.tier1Players?.length || 0,
        tier2: data.tier2Players?.length || 0,
        tier3: data.tier3Players?.length || 0,
        wildcard: data.wildcardPlayers?.length || 0,
        total: data.allPlayers?.length || 0,
      },
      samplePlayers: {
        tier1: data.tier1Players?.[0] || null,
        tier2: data.tier2Players?.[0] || null,
        tier3: data.tier3Players?.[0] || null,
        wildcard: data.wildcardPlayers?.[0] || null,
      },
    })
  } catch (error: any) {
    console.error("Error in mlb-data-check:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch MLB data",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

