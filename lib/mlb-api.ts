import { db } from "./firebase"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"

// Fetch data from MLB Stats API with caching
export async function fetchMlbData(endpoint: string, cacheName: string, cacheHours = 12) {
  try {
    // Check cache first
    const cacheDoc = await getDoc(doc(db, "mlb-cache", cacheName))
    const cacheData = cacheDoc.exists() ? cacheDoc.data() : null
    const lastFetchTime = cacheData?.fetchedAt?.toDate() || new Date(0)
    const now = new Date()

    // If we've fetched within the cache period, use cached data
    const cacheMs = cacheHours * 60 * 60 * 1000
    if (cacheData && now.getTime() - lastFetchTime.getTime() < cacheMs) {
      console.log(`Using cached MLB data for ${cacheName}`)
      return {
        data: cacheData.data,
        lastUpdated: lastFetchTime,
        isCached: true,
      }
    }

    console.log(`Fetching fresh MLB data for ${cacheName}`)

    // Fetch from MLB API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(`https://statsapi.mlb.com/api/v1/${endpoint}`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`MLB API responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Store in cache
      await setDoc(doc(db, "mlb-cache", cacheName), {
        data,
        fetchedAt: serverTimestamp(),
      })

      return {
        data,
        lastUpdated: now,
        isCached: false,
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        throw new Error("MLB API request timed out after 15 seconds")
      }

      throw fetchError
    }
  } catch (error) {
    console.error(`Error fetching MLB data for ${cacheName}:`, error)

    // Try to get cached data as fallback
    try {
      const cacheDoc = await getDoc(doc(db, "mlb-cache", cacheName))
      if (cacheDoc.exists()) {
        const cacheData = cacheDoc.data()
        console.log(`Falling back to cached data for ${cacheName} due to API error`)
        return {
          data: cacheData.data,
          lastUpdated: cacheData.fetchedAt.toDate(),
          isCached: true,
          isErrorFallback: true,
        }
      }
    } catch (cacheError) {
      console.error(`Error fetching cached data for ${cacheName}:`, cacheError)
    }

    // Re-throw the original error if we couldn't get cached data
    throw error
  }
}

// Get home run leaders - explicitly for 2025 season
export async function getHomeRunLeaders(season = 2025, limit = 100) {
  const { data, lastUpdated, isCached } = await fetchMlbData(
    `stats/leaders?leaderCategories=homeRuns&season=${season}&limit=${limit}&sportId=1`,
    "hr-leaders",
  )

  // Format the data
  let players = []

  if (data.leagueLeaders && data.leagueLeaders.length > 0 && data.leagueLeaders[0].leaders) {
    players = data.leagueLeaders[0].leaders.map((leader) => ({
      id: `p${leader.person.id}`,
      name: leader.person.fullName,
      team: leader.team?.abbreviation || leader.team?.name || "Unknown",
      hr2025: leader.value, // Explicitly use hr2025 for the 2025 season
      position: leader.position?.abbreviation || "Unknown",
    }))
  }

  return {
    players,
    lastUpdated,
    isCached,
  }
}

// Get player details
export async function getPlayerDetails(playerId: string) {
  // Remove 'p' prefix if present
  const mlbPlayerId = playerId.startsWith("p") ? playerId.substring(1) : playerId

  const { data, lastUpdated, isCached } = await fetchMlbData(
    `people/${mlbPlayerId}?hydrate=stats(group=[hitting],type=[yearByYear])`,
    `player-${mlbPlayerId}`,
    24, // Cache player data for 24 hours
  )

  return {
    player: data.people?.[0] || null,
    lastUpdated,
    isCached,
  }
}
