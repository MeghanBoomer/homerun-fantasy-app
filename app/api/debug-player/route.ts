import { NextResponse } from "next/server"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("debug-player")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("id")
    const playerName = searchParams.get("name")

    if (!playerId && !playerName) {
      return NextResponse.json({ error: "Either player ID or name is required" }, { status: 400 })
    }

    // Current year - explicitly set to 2025 for the current season
    const currentYear = 2025

    // Fetch from MLB API
    let apiResponse
    let apiUrl

    if (playerId) {
      // Remove 'p' prefix if present
      const mlbPlayerId = playerId.startsWith("p") ? playerId.substring(1) : playerId
      apiUrl = `https://statsapi.mlb.com/api/v1/people/${mlbPlayerId}?hydrate=stats(group=[hitting],type=[yearByYear])`

      logger.info(`Fetching player data by ID from: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        throw new Error(`MLB API responded with status: ${response.status}`)
      }

      apiResponse = await response.json()
    } else if (playerName) {
      // Search by name
      apiUrl = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(playerName)}&sportIds=1`

      logger.info(`Searching player by name from: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        throw new Error(`MLB API responded with status: ${response.status}`)
      }

      const searchResponse = await response.json()

      if (searchResponse.people && searchResponse.people.length > 0) {
        // Get the first matching player
        const foundPlayer = searchResponse.people[0]

        // Now fetch detailed stats for this player
        apiUrl = `https://statsapi.mlb.com/api/v1/people/${foundPlayer.id}?hydrate=stats(group=[hitting],type=[yearByYear])`

        logger.info(`Fetching details for found player from: ${apiUrl}`)

        const detailsResponse = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Homerun-Fantasy-App/1.0",
            Accept: "application/json",
          },
          next: { revalidate: 0 },
        })

        if (!detailsResponse.ok) {
          throw new Error(`MLB API responded with status: ${detailsResponse.status}`)
        }

        apiResponse = await detailsResponse.json()
      } else {
        return NextResponse.json({ error: `No player found with name: ${playerName}` }, { status: 404 })
      }
    }

    // Also fetch current season HR stats
    const hrStatsUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=500&sportId=1`

    logger.info(`Fetching HR leaders from: ${hrStatsUrl}`)

    const hrResponse = await fetch(hrStatsUrl, {
      headers: {
        "User-Agent": "Homerun-Fantasy-App/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    })

    if (!hrResponse.ok) {
      throw new Error(`MLB API HR leaders responded with status: ${hrResponse.status}`)
    }

    const hrData = await hrResponse.json()

    // Find the player in the HR leaders
    let currentHRStats = null
    if (hrData.leagueLeaders && hrData.leagueLeaders.length > 0 && hrData.leagueLeaders[0].leaders) {
      const leaders = hrData.leagueLeaders[0].leaders
      const player = apiResponse.people[0]

      currentHRStats = leaders.find((leader) => leader.person.id === Number.parseInt(player.id))
    }

    return NextResponse.json({
      success: true,
      player: apiResponse.people[0],
      currentHRStats: currentHRStats,
      apiUrl: apiUrl,
      hrLeadersUrl: hrStatsUrl,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error in debug-player:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch player data",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
