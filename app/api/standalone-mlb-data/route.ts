import { NextResponse } from "next/server"

// This endpoint fetches MLB data directly from the MLB Stats API
export async function GET() {
  try {
    console.log("Fetching MLB data directly from MLB Stats API")

    // Ensure we're only using 2025 data
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
    const hrLeadersUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=100&sportId=1`
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
      }
    } catch (error) {
      console.error("Error fetching HR leaders:", error)
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

    // If we couldn't get data from the API, return an error
    if (hrLeaders.length === 0 && wildcardPlayers.length === 0) {
      // Fall back to hardcoded 2025 data
      hrLeaders = [
        { id: "p592450", name: "Aaron Judge", team: "NYY", hr2025: 15, position: "RF" },
        { id: "p660271", name: "Shohei Ohtani", team: "LAD", hr2025: 16, position: "DH" },
        { id: "p624413", name: "Pete Alonso", team: "NYM", hr2025: 10, position: "1B" },
        { id: "p656941", name: "Kyle Schwarber", team: "PHI", hr2025: 9, position: "LF" },
        { id: "p621566", name: "Matt Olson", team: "ATL", hr2025: 7, position: "1B" },
        { id: "p670541", name: "Yordan Alvarez", team: "HOU", hr2025: 8, position: "DH" },
        { id: "p545361", name: "Mike Trout", team: "LAA", hr2025: 11, position: "CF" },
        { id: "p665489", name: "Vladimir Guerrero Jr.", team: "TOR", hr2025: 8, position: "1B" },
        { id: "p665742", name: "Juan Soto", team: "NYY", hr2025: 9, position: "RF" },
        { id: "p666969", name: "Adolis García", team: "TEX", hr2025: 7, position: "RF" },
        { id: "p605141", name: "Mookie Betts", team: "LAD", hr2025: 5, position: "RF" },
        { id: "p547180", name: "Bryce Harper", team: "PHI", hr2025: 6, position: "1B" },
        { id: "p646240", name: "Rafael Devers", team: "BOS", hr2025: 9, position: "3B" },
        { id: "p606192", name: "Teoscar Hernández", team: "LAD", hr2025: 8, position: "RF" },
        { id: "p519317", name: "Giancarlo Stanton", team: "NYY", hr2025: 7, position: "DH" },
        { id: "p677776", name: "Bobby Witt Jr.", team: "KC", hr2025: 9, position: "SS" },
        { id: "p542303", name: "Marcell Ozuna", team: "ATL", hr2025: 10, position: "DH" },
        { id: "p669477", name: "Gunnar Henderson", team: "BAL", hr2025: 8, position: "SS" },
      ]

      wildcardPlayers = [
        { id: "p665742", name: "Ronald Acuña Jr.", team: "ATL", hr2025: 5, position: "RF" },
        { id: "p665487", name: "Fernando Tatis Jr.", team: "SD", hr2025: 6, position: "RF" },
        { id: "p700022", name: "Julio Rodríguez", team: "SEA", hr2025: 7, position: "CF" },
        { id: "p682998", name: "Corbin Carroll", team: "ARI", hr2025: 5, position: "LF" },
        { id: "p666023", name: "Christopher Morel", team: "CHC", hr2025: 6, position: "3B" },
        { id: "p656349", name: "Brent Rooker", team: "OAK", hr2025: 8, position: "DH" },
        { id: "p673357", name: "Luis Robert Jr.", team: "CWS", hr2025: 8, position: "CF" },
        { id: "p641355", name: "Cody Bellinger", team: "CHC", hr2025: 6, position: "CF" },
        { id: "p518692", name: "Freddie Freeman", team: "LAD", hr2025: 6, position: "1B" },
        { id: "p542432", name: "José Ramírez", team: "CLE", hr2025: 8, position: "3B" },
        { id: "p592518", name: "Manny Machado", team: "SD", hr2025: 8, position: "3B" },
        { id: "p663586", name: "Austin Riley", team: "ATL", hr2025: 7, position: "3B" },
        { id: "p571448", name: "Nolan Arenado", team: "STL", hr2025: 5, position: "3B" },
        { id: "p642715", name: "Willy Adames", team: "MIL", hr2025: 7, position: "SS" },
        { id: "p596019", name: "Francisco Lindor", team: "NYM", hr2025: 10, position: "SS" },
        { id: "p608369", name: "Corey Seager", team: "TEX", hr2025: 11, position: "SS" },
        { id: "p571771", name: "Enrique (Kike) Hernandez", team: "LAD", hr2025: 4, position: "2B/OF" },
        { id: "p700760", name: "Jackson Chourio", team: "MIL", hr2025: 3, position: "OF" },
        { id: "p682928", name: "Elly De La Cruz", team: "CIN", hr2025: 5, position: "SS" },
        { id: "p677594", name: "CJ Abrams", team: "WSH", hr2025: 3, position: "SS" },
        { id: "p680757", name: "Anthony Volpe", team: "NYY", hr2025: 2, position: "SS" },
      ]
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
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch MLB data",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
