import { NextResponse } from "next/server"
import { db } from "../../../lib/firebase"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"

// This is a Next.js API route that can be scheduled with Vercel Cron
// Add this to your vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/update-stats",
//       "schedule": "0 0 * * *"
//     }
//   ]
// }

export async function GET() {
  try {
    const teamsSnapshot = await getDocs(collection(db, "teams"))

    for (const teamDoc of teamsSnapshot.docs) {
      const team = teamDoc.data()
      let totalHRs = 0

      const players = [team.tier1, team.tier2, team.tier3, team.wildCard1, team.wildCard2, team.wildCard3]

      for (const player of players) {
        try {
          // Fetch player stats from MLB API
          const response = await fetch(
            `https://statsapi.mlb.com/api/v1/people/${player}/stats?stats=season&season=2025`,
          )
          const data = await response.json()

          // Extract home runs from the response
          const homeRuns = data.stats[0]?.splits[0]?.stat?.homeRuns || 0
          totalHRs += homeRuns
        } catch (error) {
          console.error(`Error fetching stats for player ${player}:`, error)
        }
      }

      // Update the team document with the new total
      await updateDoc(doc(db, "teams", teamDoc.id), { totalHRs })
    }

    return NextResponse.json({ success: true, message: "Stats updated successfully" })
  } catch (error) {
    console.error("Error updating stats:", error)
    return NextResponse.json({ success: false, error: "Failed to update stats" }, { status: 500 })
  }
}

