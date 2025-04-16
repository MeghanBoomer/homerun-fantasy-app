import { NextResponse } from "next/server"
import { db } from "../../../lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// This endpoint calculates a team's total HRs based on provided player HR counts
export async function POST(request: Request) {
  try {
    const { teamId, playerHRs } = await request.json()

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Fetch the team
    const teamDoc = await getDoc(doc(db, "teams", teamId))

    if (!teamDoc.exists()) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const team = teamDoc.data()

    // If playerHRs are provided, use them
    // Otherwise, use the existing playerHRs or default to zeros
    const hrCounts = playerHRs || team.playerHRs || [0, 0, 0, 0, 0, 0]

    // Calculate total
    const totalHR = hrCounts.reduce((sum: number, hr: number) => sum + hr, 0)

    // Return the calculation without updating the database
    return NextResponse.json({
      teamName: team.teamName,
      players: [
        { name: team.players.tier1Player?.name, hr: hrCounts[0] },
        { name: team.players.tier2Player?.name, hr: hrCounts[1] },
        { name: team.players.tier3Player?.name, hr: hrCounts[2] },
        { name: team.players.wildcard1?.name, hr: hrCounts[3] },
        { name: team.players.wildcard2?.name, hr: hrCounts[4] },
        { name: team.players.wildcard3?.name, hr: hrCounts[5] },
      ],
      totalHR: totalHR,
    })
  } catch (error: any) {
    console.error("Error calculating team total:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to calculate team total",
      },
      { status: 500 },
    )
  }
}
