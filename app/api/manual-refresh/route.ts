import { NextResponse } from "next/server"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase"

export async function POST() {
  try {
    console.log("Manual refresh of team stats triggered")

    // Fetch all teams
    const teamsSnapshot = await getDocs(collection(db, "teams"))
    const updatedTeams = []

    // Process each team
    for (const teamDoc of teamsSnapshot.docs) {
      try {
        const team = teamDoc.data()

        // Get player HRs array or create empty one
        const playerHRs = team.playerHRs || [0, 0, 0, 0, 0, 0]

        // Calculate total HRs - ensure we're using Number to handle any string values
        const totalHR = playerHRs.reduce((sum, hr) => sum + (Number(hr) || 0), 0)
        console.log(`Team ${team.teamName}: playerHRs = ${JSON.stringify(playerHRs)}, totalHR = ${totalHR}`)

        // Update the team document
        await updateDoc(doc(db, "teams", teamDoc.id), {
          actualHR: totalHR,
          lastUpdated: new Date(),
        })

        updatedTeams.push({
          id: teamDoc.id,
          name: team.teamName,
          previousHR: team.actualHR || 0,
          newHR: totalHR,
          playerHRs: playerHRs,
        })

        console.log(`Updated team ${team.teamName}: ${team.actualHR || 0} → ${totalHR} HRs`)
      } catch (error) {
        console.error(`Error processing team ${teamDoc.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Manually refreshed stats for ${updatedTeams.length} teams`,
      teams: updatedTeams,
    })
  } catch (error) {
    console.error("Error in manual refresh:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
