import { NextResponse } from "next/server"

// MLB Stats API base URL
const MLB_API_BASE_URL = "https://statsapi.mlb.com/api/v1"

// Cache duration in seconds (1 hour)
const CACHE_DURATION = 3600

// Module-level cache variables
let cachedMLBData: any = null
let cachedMLBDataTimestamp: number | null = null

// Function to fetch with timeout
async function fetchWithTimeout(url: string, options = {}, timeout = 10000) {
  const controller = new AbortController()
  const { signal } = controller

  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { ...options, signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Function to fetch players from MLB API
async function fetchMLBPlayers() {
  try {
    // Current season - adjust as needed
    const currentYear = new Date().getFullYear()

    console.log(`Fetching MLB data for ${currentYear} season...`)

    // Fetch home run leaders for the current season
    // We'll request the top 100 HR leaders to have enough data for our tiers
    const response = await fetchWithTimeout(
      `${MLB_API_BASE_URL}/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=100&sportId=1`,
      {},
      15000, // 15 second timeout
    )

    if (!response.ok) {
      throw new Error(`MLB API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("MLB API response received successfully")

    return processMLBData(data)
  } catch (error) {
    console.error("Error fetching from MLB API:", error)
    throw error
  }
}

// Process MLB API data into our format
function processMLBData(mlbData: any) {
  try {
    // Check if the data has the expected structure
    if (
      !mlbData ||
      !mlbData.leagueLeaders ||
      !Array.isArray(mlbData.leagueLeaders) ||
      mlbData.leagueLeaders.length === 0
    ) {
      console.error("MLB API returned unexpected data structure:", mlbData)
      return getFallbackData()
    }

    // Find the home runs leaderboard
    const homeRunLeaders = mlbData.leagueLeaders.find((leaderboard: any) => leaderboard.leaderCategory === "homeRuns")

    if (!homeRunLeaders || !homeRunLeaders.leaders || !Array.isArray(homeRunLeaders.leaders)) {
      console.error("Could not find home run leaders in the MLB API response")
      return getFallbackData()
    }

    // Map the leaders to our player format
    const allPlayers = homeRunLeaders.leaders
      .map((leader: any) => {
        // Add validation to handle potential missing properties
        if (!leader.person || !leader.team) {
          return null
        }

        return {
          id: `p${leader.person.id || Math.random().toString(36).substring(2, 10)}`,
          name: leader.person.fullName || `${leader.person.firstName || ""} ${leader.person.lastName || ""}`,
          team: leader.team.abbreviation || leader.team.name?.substring(0, 3) || "MLB",
          hr2024: Number.parseInt(leader.value) || 0,
          position: (leader.position && leader.position.abbreviation) || "POS",
        }
      })
      .filter(Boolean) // Remove any null entries

    // If we don't have enough players, return fallback data
    if (allPlayers.length < 20) {
      console.warn("MLB API returned insufficient player data, using fallback data")
      return getFallbackData()
    }

    // Sort by home runs (should already be sorted, but just to be safe)
    allPlayers.sort((a: any, b: any) => b.hr2024 - a.hr2024)

    // Divide into tiers based on HR counts
    // Tier 1: Top ~10% of HR hitters (at least 6)
    // Tier 2: Next ~15% of HR hitters (at least 6)
    // Tier 3: Next ~25% of HR hitters (at least 6)
    // Wildcards: Everyone else
    const tier1Count = Math.max(6, Math.floor(allPlayers.length * 0.1))
    const tier2Count = Math.max(6, Math.floor(allPlayers.length * 0.15))
    const tier3Count = Math.max(6, Math.floor(allPlayers.length * 0.25))

    const tier1Players = allPlayers.slice(0, tier1Count)
    const tier2Players = allPlayers.slice(tier1Count, tier1Count + tier2Count)
    const tier3Players = allPlayers.slice(tier1Count + tier2Count, tier1Count + tier2Count + tier3Count)
    const wildcardPlayers = allPlayers.slice(tier1Count + tier2Count + tier3Count)

    // Add Kike Hernandez to wildcards if not already present
    const kikeHernandez = wildcardPlayers.find(
      (p) => p.name.toLowerCase().includes("kike") || p.name.toLowerCase().includes("enrique hernandez"),
    )

    if (!kikeHernandez) {
      wildcardPlayers.push({
        id: "wp91",
        name: "Enrique (Kike) Hernandez",
        team: "LAD",
        hr2024: 18,
        position: "2B/OF",
      })
    }

    return {
      tier1Players,
      tier2Players,
      tier3Players,
      wildcardPlayers,
      allPlayers: [...tier1Players, ...tier2Players, ...tier3Players, ...wildcardPlayers],
      lastUpdated: new Date().toISOString(),
      source: "MLB API",
    }
  } catch (error) {
    console.error("Error processing MLB data:", error)
    return getFallbackData()
  }
}

// Fallback data in case the API fails
function getFallbackData() {
  // Using your existing fallback data
  const FALLBACK_PLAYERS = {
    tier1Players: [
      { id: "t1p1", name: "Aaron Judge", team: "NYY", hr2024: 54, position: "RF" },
      { id: "t1p2", name: "Shohei Ohtani", team: "LAD", hr2024: 49, position: "DH" },
      { id: "t1p3", name: "Pete Alonso", team: "NYM", hr2024: 46, position: "1B" },
      { id: "t1p4", name: "Kyle Schwarber", team: "PHI", hr2024: 45, position: "LF" },
      { id: "t1p5", name: "Matt Olson", team: "ATL", hr2024: 43, position: "1B" },
      { id: "t1p6", name: "Yordan Alvarez", team: "HOU", hr2024: 42, position: "DH" },
    ],
    tier2Players: [
      { id: "t2p1", name: "Mike Trout", team: "LAA", hr2024: 40, position: "CF" },
      { id: "t2p2", name: "Vladimir Guerrero Jr.", team: "TOR", hr2024: 39, position: "1B" },
      { id: "t2p3", name: "Juan Soto", team: "NYY", hr2024: 38, position: "RF" },
      { id: "t2p4", name: "Adolis García", team: "TEX", hr2024: 37, position: "RF" },
      { id: "t2p5", name: "Mookie Betts", team: "LAD", hr2024: 36, position: "RF" },
      { id: "t2p6", name: "Bryce Harper", team: "PHI", hr2024: 35, position: "1B" },
    ],
    tier3Players: [
      { id: "t3p1", name: "Rafael Devers", team: "BOS", hr2024: 34, position: "3B" },
      { id: "t3p2", name: "Teoscar Hernández", team: "LAD", hr2024: 33, position: "RF" },
      { id: "t3p3", name: "Giancarlo Stanton", team: "NYY", hr2024: 32, position: "DH" },
      { id: "t3p4", name: "Bobby Witt Jr.", team: "KC", hr2024: 31, position: "SS" },
      { id: "t3p5", name: "Marcell Ozuna", team: "ATL", hr2024: 30, position: "DH" },
      { id: "t3p6", name: "Gunnar Henderson", team: "BAL", hr2024: 29, position: "SS" },
    ],
    wildcardPlayers: [
      { id: "wp1", name: "Ronald Acuña Jr.", team: "ATL", hr2024: 15, position: "RF" },
      { id: "wp2", name: "Fernando Tatis Jr.", team: "SD", hr2024: 25, position: "RF" },
      // Include all your existing wildcard players...
      { id: "wp91", name: "Enrique (Kike) Hernandez", team: "LAD", hr2024: 18, position: "2B/OF" },
    ],
    lastUpdated: new Date().toISOString(),
    source: "Fallback Data",
  }

  // Populate the allPlayers array in the fallback data
  FALLBACK_PLAYERS.allPlayers = [
    ...FALLBACK_PLAYERS.tier1Players,
    ...FALLBACK_PLAYERS.tier2Players,
    ...FALLBACK_PLAYERS.tier3Players,
    ...FALLBACK_PLAYERS.wildcardPlayers,
  ]

  return FALLBACK_PLAYERS
}

export async function GET() {
  try {
    // Check if we have valid cached data
    if (cachedMLBData && cachedMLBDataTimestamp) {
      const cacheAge = Date.now() - cachedMLBDataTimestamp
      if (cacheAge < CACHE_DURATION * 1000) {
        console.log("Returning cached MLB data (age: " + Math.floor(cacheAge / 1000) + " seconds)")
        return NextResponse.json(cachedMLBData)
      }
    }

    // Fetch fresh data from MLB API
    console.log("Fetching fresh MLB data")
    const data = await fetchMLBPlayers()

    // Cache the data
    cachedMLBData = data
    cachedMLBDataTimestamp = Date.now()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in MLB players API route:", error)

    // Return fallback data if API fails
    console.log("Returning fallback data due to error")
    const fallbackData = getFallbackData()
    return NextResponse.json(fallbackData)
  }
}

