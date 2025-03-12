// This service will fetch MLB players and their stats from the MLB Stats API

// Function to fetch top home run hitters from the previous season
export async function fetchTopHomeRunHitters(season = 2024) {
  try {
    // In a real implementation, you would use the MLB Stats API
    // For now, we'll return mock data

    // These would be the top 18 HR hitters from the previous season
    // Divided into 3 tiers of 6 players each
    const tier1 = [
      { id: 665742, name: "Aaron Judge", team: "NYY", homeRuns: 42 },
      { id: 665487, name: "Shohei Ohtani", team: "LAD", homeRuns: 40 },
      { id: 592450, name: "Pete Alonso", team: "NYM", homeRuns: 38 },
      { id: 665743, name: "Kyle Schwarber", team: "PHI", homeRuns: 36 },
      { id: 608336, name: "Matt Olson", team: "ATL", homeRuns: 35 },
      { id: 605141, name: "Yordan Alvarez", team: "HOU", homeRuns: 34 },
    ]

    const tier2 = [
      { id: 547180, name: "Mookie Betts", team: "LAD", homeRuns: 33 },
      { id: 518692, name: "Bryce Harper", team: "PHI", homeRuns: 32 },
      { id: 641355, name: "Adolis García", team: "TEX", homeRuns: 31 },
      { id: 571448, name: "Marcell Ozuna", team: "ATL", homeRuns: 30 },
      { id: 596019, name: "Austin Riley", team: "ATL", homeRuns: 29 },
      { id: 543760, name: "J.D. Martinez", team: "NYM", homeRuns: 28 },
    ]

    const tier3 = [
      { id: 663993, name: "Bobby Witt Jr.", team: "KC", homeRuns: 27 },
      { id: 668939, name: "Juan Soto", team: "NYY", homeRuns: 26 },
      { id: 543829, name: "Freddie Freeman", team: "LAD", homeRuns: 25 },
      { id: 621566, name: "Rhys Hoskins", team: "MIL", homeRuns: 24 },
      { id: 669023, name: "Gunnar Henderson", team: "BAL", homeRuns: 23 },
      { id: 543333, name: "Manny Machado", team: "SD", homeRuns: 22 },
    ]

    // All other MLB players not in the top tiers (for wild card selections)
    const wildCardPlayers = [
      { id: 545361, name: "Mike Trout", team: "LAA", homeRuns: 21 },
      { id: 605141, name: "Vladimir Guerrero Jr.", team: "TOR", homeRuns: 20 },
      { id: 518934, name: "Paul Goldschmidt", team: "STL", homeRuns: 19 },
      { id: 641319, name: "Rafael Devers", team: "BOS", homeRuns: 18 },
      { id: 665742, name: "Fernando Tatis Jr.", team: "SD", homeRuns: 17 },
      { id: 592885, name: "Francisco Lindor", team: "NYM", homeRuns: 16 },
      { id: 664034, name: "Bo Bichette", team: "TOR", homeRuns: 15 },
      { id: 571448, name: "Ronald Acuña Jr.", team: "ATL", homeRuns: 14 },
      { id: 543829, name: "Nolan Arenado", team: "STL", homeRuns: 13 },
      { id: 543760, name: "Corey Seager", team: "TEX", homeRuns: 12 },
      { id: 518692, name: "José Ramírez", team: "CLE", homeRuns: 11 },
      { id: 547180, name: "Wander Franco", team: "TB", homeRuns: 10 },
    ]

    return {
      tier1,
      tier2,
      tier3,
      wildCardPlayers,
    }
  } catch (error) {
    console.error("Error fetching MLB players:", error)
    throw error
  }
}

// Function to fetch home run stats for a specific player
export async function fetchPlayerHomeRuns(playerId: number, season = 2025) {
  try {
    // In a real implementation, you would call the MLB Stats API
    // For now, we'll return mock data with random home run counts

    // Generate a random number of home runs (0-10 for demonstration)
    const homeRuns = Math.floor(Math.random() * 11)

    return {
      playerId,
      season,
      homeRuns,
    }
  } catch (error) {
    console.error(`Error fetching home runs for player ${playerId}:`, error)
    throw error
  }
}

