import { NextResponse } from "next/server"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("debug-recent-home-runs")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerIdsParam = searchParams.get("playerIds")

    if (!playerIdsParam) {
      return NextResponse.json(
        {
          error: "No player IDs provided",
        },
        { status: 400 },
      )
    }

    const playerIds = playerIdsParam.split(",")

    // Calculate date range for the last 14 days (extended range for debugging)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 14)

    // Format dates for API
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    logger.info(`Debugging recent home runs for ${playerIds.length} players from ${startDateStr} to ${endDateStr}`)

    // Get MLB schedule for the date range to check if we're getting data
    const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDateStr}&endDate=${endDateStr}&gameType=R&fields=dates,games,gamePk`

    let scheduleData
    try {
      const response = await fetch(scheduleUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        throw new Error(`MLB API schedule request failed: ${response.status}`)
      }

      scheduleData = await response.json()
    } catch (error) {
      logger.error("Error fetching MLB schedule:", error)
      scheduleData = { error: error.message }
    }

    // Check if we have any games in the schedule
    const gameIds = []
    if (scheduleData.dates) {
      for (const date of scheduleData.dates) {
        if (date.games) {
          for (const game of date.games) {
            if (game.gamePk) {
              gameIds.push(game.gamePk.toString())
            }
          }
        }
      }
    }

    // For debugging, also return simulated home run data
    const simulatedHomeRuns = generateSimulatedHomeRuns(playerIds)

    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
      playerIds: playerIds,
      mlbSchedule: {
        gameCount: gameIds.length,
        gameIds: gameIds.slice(0, 10), // Just show first 10 for brevity
        dates: scheduleData.dates?.length || 0,
      },
      simulatedHomeRuns: simulatedHomeRuns,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error in debug endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Generate simulated home run data for debugging
function generateSimulatedHomeRuns(playerIds: string[]) {
  const playerMap: Record<string, { name: string; team: string }> = {
    p592450: { name: "Aaron Judge", team: "NYY" },
    p660271: { name: "Shohei Ohtani", team: "LAD" },
    p624413: { name: "Pete Alonso", team: "NYM" },
    p656941: { name: "Kyle Schwarber", team: "PHI" },
    p621566: { name: "Matt Olson", team: "ATL" },
    p670541: { name: "Yordan Alvarez", team: "HOU" },
    p545361: { name: "Mike Trout", team: "LAA" },
    p665489: { name: "Vladimir Guerrero Jr.", team: "TOR" },
    p665742: { name: "Juan Soto", team: "NYY" },
    // Add more players as needed
  }

  const homeRuns = []

  // Generate 1-2 simulated home runs for each valid player
  for (const playerId of playerIds) {
    const player = playerMap[playerId]
    if (player) {
      // Create 1-2 home runs in the last 7 days
      const numHomeRuns = Math.floor(Math.random() * 2) + 1

      for (let i = 0; i < numHomeRuns; i++) {
        const daysAgo = Math.floor(Math.random() * 7)
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)

        homeRuns.push({
          playerId,
          playerName: player.name,
          playerTeam: player.team,
          opponent: "OPP",
          date: date.toISOString(),
          gameId: `game-${Date.now()}-${i}`,
        })
      }
    }
  }

  return homeRuns
}
