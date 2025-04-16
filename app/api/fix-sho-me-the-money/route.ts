import { NextResponse } from "next/server"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "../../../lib/firebase"

export async function GET() {
  try {
    console.log("Fixing 'Sho me the money' team")

    // Find the team by name
    const teamsQuery = query(collection(db, "teams"), where("teamName", "==", "Sho me the money"))
    const querySnapshot = await getDocs(teamsQuery)

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: "Team 'Sho me the money' not found",
      })
    }

    // Get the team document
    const teamDoc = querySnapshot.docs[0]
    const team = teamDoc.data()

    // Set the correct player HRs - these should add up to 8
    const playerHRs = [2, 1, 1, 2, 1, 1] // Total: 8

    // Calculate total HRs
    const totalHR = playerHRs.reduce((sum, hr) => sum + hr, 0)

    console.log(`Updating team ${team.teamName}: playerHRs = ${JSON.stringify(playerHRs)}, totalHR = ${totalHR}`)

    // Update the team document
    await updateDoc(doc(db, "teams", teamDoc.id), {
      playerHRs: playerHRs,
      actualHR: totalHR,
      lastUpdated: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `Fixed 'Sho me the money' team with ${totalHR} total HRs`,
      team: {
        id: teamDoc.id,
        name: team.teamName,
        playerHRs: playerHRs,
        totalHR: totalHR,
      },
    })
  } catch (error) {
    console.error("Error fixing team:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
