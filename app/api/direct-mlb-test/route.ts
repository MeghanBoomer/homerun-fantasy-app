import { NextResponse } from "next/server"

export async function GET() {
  try {
    // This is the same data structure used in the mlb-players endpoint
    const MLB_DATA = {
      tier1Players: [
        { id: "p592450", name: "Aaron Judge", team: "NYY", hr2024: 37, position: "RF" },
        { id: "p660271", name: "Shohei Ohtani", team: "LAD", hr2024: 44, position: "DH" },
        // More players would be here
      ],
      tier2Players: [
        { id: "p545361", name: "Mike Trout", team: "LAA", hr2024: 18, position: "CF" },
        { id: "p665489", name: "Vladimir Guerrero Jr.", team: "TOR", hr2024: 26, position: "1B" },
        // More players would be here
      ],
      tier3Players: [
        { id: "p646240", name: "Rafael Devers", team: "BOS", hr2024: 33, position: "3B" },
        { id: "p606192", name: "Teoscar Hernández", team: "LAD", hr2024: 26, position: "RF" },
        // More players would be here
      ],
      wildcardPlayers: [
        { id: "p665742", name: "Ronald Acuña Jr.", team: "ATL", hr2024: 41, position: "RF" },
        { id: "p665487", name: "Fernando Tatis Jr.", team: "SD", hr2024: 25, position: "RF" },
        // More players would be here
      ],
      lastUpdated: new Date().toISOString(),
      source: "Direct test endpoint",
    }

    // Add allPlayers array
    MLB_DATA.allPlayers = [
      ...MLB_DATA.tier1Players,
      ...MLB_DATA.tier2Players,
      ...MLB_DATA.tier3Players,
      ...MLB_DATA.wildcardPlayers,
    ]

    return NextResponse.json({
      success: true,
      data: MLB_DATA,
      message: "This is a direct test endpoint that doesn't rely on fetching from another endpoint",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

