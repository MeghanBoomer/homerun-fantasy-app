import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Fetching MLB player data from MLB Stats API")

    // Current year - explicitly set to 2025 for the current season
    const currentYear = 2025 // Explicitly set to 2025 for the current season

    // Step 1: Fetch active players for 2025 season first
    const activePlayersUrl = `https://statsapi.mlb.com/api/v1/sports/1/players?season=${currentYear}`
    console.log(`Fetching active players for ${currentYear} from: ${activePlayersUrl}`)

    let activePlayerIds = new Set<string>()
    let activePlayersData: any[] = []

    try {
      const activePlayersResponse = await fetch(activePlayersUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 0 }, // Don't cache
      })

      if (activePlayersResponse.ok) {
        const data = await activePlayersResponse.json()

        if (data.people && Array.isArray(data.people)) {
          activePlayersData = data.people
          // Create a set of active player IDs for quick lookup
          activePlayerIds = new Set(data.people.map((player) => player.id.toString()))
          console.log(`Found ${activePlayerIds.size} active players for ${currentYear}`)
        }
      } else {
        console.error(`Failed to fetch active players: ${activePlayersResponse.status}`)
      }
    } catch (error) {
      console.error("Error fetching active players:", error)
    }

    // Step 2: Fetch 2025 HR leaders
    const hrLeadersUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=500&sportId=1`
    console.log(`Fetching ${currentYear} HR leaders from: ${hrLeadersUrl}`)

    let hrLeaders: any[] = []

    try {
      const hrLeadersResponse = await fetch(hrLeadersUrl, {
        headers: {
          "User-Agent": "Homerun-Fantasy-App/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 0 }, // Don't cache
      })

      if (hrLeadersResponse.ok) {
        const data = await hrLeadersResponse.json()

        if (data.leagueLeaders && data.leagueLeaders.length > 0 && data.leagueLeaders[0].leaders) {
          // Get HR leaders for the current year (2025)
          hrLeaders = data.leagueLeaders[0].leaders.map((leader) => ({
            id: `p${leader.person.id}`,
            name: leader.person.fullName,
            team: leader.team?.abbreviation || leader.team?.name || "Unknown",
            hr2025: leader.value, // This is 2025 data
            position: leader.position?.abbreviation || "Unknown",
          }))

          console.log(`Found ${hrLeaders.length} HR leaders from ${currentYear}`)
        }
      } else {
        console.error(`Failed to fetch HR leaders: ${hrLeadersResponse.status}`)
        throw new Error(`Failed to fetch HR leaders: ${hrLeadersResponse.status}`)
      }
    } catch (error) {
      console.error("Error fetching HR leaders:", error)
      throw error // Rethrow to stop execution - no fallback to mock data
    }

    // Step 3: Process active players for wildcard selections
    let wildcardPlayers: any[] = []

    if (activePlayersData.length > 0) {
      wildcardPlayers = activePlayersData.map((player) => {
        // Try to find this player in the HR leaders to get their 2025 HR count
        const hrLeader = hrLeaders.find((leader) => leader.id === `p${player.id}`)

        return {
          id: `p${player.id}`,
          name: player.fullName,
          team: player.currentTeam?.abbreviation || "Unknown",
          hr2025: hrLeader ? hrLeader.hr2025 : 0, // Use 2025 HR count if available, otherwise 0
          position: player.primaryPosition?.abbreviation || "Unknown",
        }
      })

      console.log(`Processed ${wildcardPlayers.length} active players for wildcard selections`)
    }

    // Divide HR leaders into tiers
    const sortedHrLeaders = [...hrLeaders].sort((a, b) => b.hr2025 - a.hr2025)

    const tier1Count = Math.min(6, Math.ceil(sortedHrLeaders.length * 0.1)) // Top 10%
    const tier2Count = Math.min(6, Math.ceil(sortedHrLeaders.length * 0.15)) // Next 15%
    const tier3Count = Math.min(6, Math.ceil(sortedHrLeaders.length * 0.2)) // Next 20%

    const tier1Players = sortedHrLeaders.slice(0, tier1Count)
    const tier2Players = sortedHrLeaders.slice(tier1Count, tier1Count + tier2Count)
    const tier3Players = sortedHrLeaders.slice(tier1Count + tier2Count, tier1Count + tier2Count + tier3Count)

    // Make sure wildcardPlayers doesn't include players already in tiers
    const tierPlayerIds = [...tier1Players, ...tier2Players, ...tier3Players].map((p) => p.id)
    const filteredWildcardPlayers = wildcardPlayers.filter((p) => !tierPlayerIds.includes(p.id))

    // Combine all players for the allPlayers array
    const allPlayers = [...tier1Players, ...tier2Players, ...tier3Players, ...filteredWildcardPlayers]

    return NextResponse.json({
      tier1Players,
      tier2Players,
      tier3Players,
      wildcardPlayers: filteredWildcardPlayers,
      allPlayers,
      lastUpdated: new Date().toISOString(),
      source: `MLB API (${currentYear} Season Data)`,
    })
  } catch (error) {
    console.error("Error in MLB players API:", error)
    throw error // Rethrow the error - no fallback to mock data
  }
}
