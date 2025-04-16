import { NextResponse } from "next/server"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("real-home-runs-api")

// MLB Stats API base URL
const MLB_API_BASE_URL = "https://statsapi.mlb.com/api/v1"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerIdsParam = searchParams.get("playerIds")
    const debug = searchParams.get("debug") === "true"

    if (!playerIdsParam) {
      return NextResponse.json(
        {
          error: "No player IDs provided",
        },
        { status: 400 },
      )
    }

    const playerIds = playerIdsParam.split(",")
    logger.info(`Fetching real home runs for ${playerIds.length} players: ${playerIds.join(", ")}`)

    // Calculate date range for the last 14 days (extended range to increase chances of finding data)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 14)

    // Format dates for API
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    logger.info(`Date range: ${startDateStr} to ${endDateStr}`)

    // 1. Fetch schedule with game IDs
    const scheduleUrl = `${MLB_API_BASE_URL}/schedule?sportId=1&startDate=${startDateStr}&endDate=${endDateStr}&gameType=R&fields=dates,games,gamePk`
    logger.info(`Fetching schedule data from: ${scheduleUrl}`)

    let scheduleData
    try {
      // Add timeout to schedule fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const scheduleResponse = await fetch(scheduleUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        signal: controller.signal,
        next: { revalidate: 0 }, // Don't cache
      })

      clearTimeout(timeoutId)

      if (!scheduleResponse.ok) {
        throw new Error(`MLB API schedule request failed: ${scheduleResponse.status}`)
      }

      scheduleData = await scheduleResponse.json()
    } catch (scheduleError) {
      logger.error(`Error fetching MLB schedule: ${scheduleError.message}`)
      return NextResponse.json({
        success: true,
        homeRuns: [],
        message: "No MLB schedule data available for 2025 season",
        lastUpdated: new Date().toISOString(),
      })
    }

    // 2. Extract game IDs
    const gameIds = extractGameIds(scheduleData)
    logger.info(`Found ${gameIds.length} games in the date range`)

    if (gameIds.length === 0) {
      logger.warn("No games found in the date range")
      return NextResponse.json({
        success: true,
        homeRuns: [],
        message: "No MLB games found in the 2025 season yet",
        lastUpdated: new Date().toISOString(),
      })
    }

    // 3. Fetch home runs for each game
    try {
      const homeRuns = await fetchHomeRunsFromGames(gameIds, playerIds)
      logger.info(`Found ${homeRuns.length} home runs for the specified players`)

      // If no home runs found, return empty array
      if (homeRuns.length === 0) {
        logger.info("No home runs found for the specified players")
        return NextResponse.json({
          success: true,
          homeRuns: [],
          message: "No home runs found for the specified players in the 2025 season",
          lastUpdated: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: true,
        homeRuns: homeRuns,
        lastUpdated: new Date().toISOString(),
        gameCount: gameIds.length,
      })
    } catch (fetchError) {
      logger.error(`Error fetching home runs: ${fetchError.message}`)
      return NextResponse.json({
        success: true,
        homeRuns: [],
        message: "Error fetching home run data for 2025 season",
        lastUpdated: new Date().toISOString(),
      })
    }
  } catch (error) {
    logger.error(`Error in real home runs API: ${error.message}`)
    return NextResponse.json({
      success: true,
      homeRuns: [],
      message: "Error in API",
      lastUpdated: new Date().toISOString(),
    })
  }
}

// Extract game IDs from schedule data
function extractGameIds(scheduleData: any): string[] {
  const gameIds: string[] = []

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

  return gameIds
}

// Fetch home runs from a list of games for specific players
async function fetchHomeRunsFromGames(gameIds: string[], playerIds: string[]) {
  const homeRuns = []

  // Limit to most recent 30 games to avoid too many API calls
  const recentGameIds = gameIds.slice(-30)

  // Normalize player IDs (remove 'p' prefix if present)
  const normalizedPlayerIds = playerIds.map((id) => (id.startsWith("p") ? id.substring(1) : id))

  for (const gameId of recentGameIds) {
    try {
      // Fetch play-by-play data with timeout
      const pbpUrl = `${MLB_API_BASE_URL}/game/${gameId}/playByPlay`

      const controller1 = new AbortController()
      const timeoutId1 = setTimeout(() => controller1.abort(), 5000) // 5 second timeout

      const pbpResponse = await fetch(pbpUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        signal: controller1.signal,
        next: { revalidate: 0 }, // Don't cache
      })

      clearTimeout(timeoutId1)

      if (!pbpResponse.ok) {
        logger.warn(`Skipping game ${gameId}: Play-by-play data not available (${pbpResponse.status})`)
        continue // Skip this game if we can't get play-by-play data
      }

      const pbpData = await pbpResponse.json()

      // Fetch game data for team info with timeout
      const gameDataUrl = `${MLB_API_BASE_URL}/game/${gameId}/boxscore`

      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000) // 5 second timeout

      const gameDataResponse = await fetch(gameDataUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        signal: controller2.signal,
        next: { revalidate: 0 }, // Don't cache
      })

      clearTimeout(timeoutId2)

      if (!gameDataResponse.ok) {
        logger.warn(`Skipping game ${gameId}: Game data not available (${gameDataResponse.status})`)
        continue // Skip this game if we can't get game data
      }

      const gameData = await gameDataResponse.json()

      // Process plays to find home runs
      if (pbpData.allPlays) {
        for (const play of pbpData.allPlays) {
          // Check if it's a home run
          if (play.result?.event === "Home Run") {
            const hitterId = play.matchup?.batter?.id?.toString()

            // Check if this home run was hit by one of our players
            if (hitterId && normalizedPlayerIds.includes(hitterId)) {
              const playerName = play.matchup?.batter?.fullName || "Unknown Player"

              // Try to get the team abbreviation
              let playerTeam = "TEAM"
              if (play.matchup?.batter?.parentTeam?.abbreviation) {
                playerTeam = play.matchup.batter.parentTeam.abbreviation
              } else if (play.matchup?.batSide?.team?.abbreviation) {
                playerTeam = play.matchup.batSide.team.abbreviation
              }

              // Get opponent team
              const homeTeam = gameData.teams?.home?.team?.abbreviation || "HOME"
              const awayTeam = gameData.teams?.away?.team?.abbreviation || "AWAY"
              const isHome = playerTeam === homeTeam
              const opponent = isHome ? awayTeam : homeTeam

              // Get game date
              let gameDate: Date
              if (play.about?.endTime) {
                gameDate = new Date(play.about.endTime)
              } else if (pbpData.gameData?.datetime?.dateTime) {
                gameDate = new Date(pbpData.gameData.datetime.dateTime)
              } else if (gameData.gameData?.game?.date) {
                gameDate = new Date(gameData.gameData.game.date)
              } else {
                // Fallback to current date
                gameDate = new Date()
              }

              // Generate a video link
              const videoLink = `https://www.mlb.com/video/?q=${playerName.replace(/ /g, "+")}&qt=FREETEXT`

              homeRuns.push({
                playerId: `p${hitterId}`,
                playerName,
                playerTeam,
                opponent,
                // Store the actual Date object instead of a custom object
                date: gameDate,
                gameId,
                videoLink,
              })
            }
          }
        }
      }
    } catch (error) {
      // Log the error but continue processing other games
      logger.warn(`Error processing game ${gameId}: ${error.message}`)
      continue
    }
  }

  // Sort by date (most recent first)
  homeRuns.sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date)
    const dateB = b.date instanceof Date ? b.date : new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })

  return homeRuns
}
