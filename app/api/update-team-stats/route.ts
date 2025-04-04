import { NextResponse } from "next/server"
import { db } from "../../../lib/firebase"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { getBaseUrl } from "../../../lib/get-base-url"

// This endpoint updates team stats based on current player performance
export async function POST() {
  try {
    console.log("Starting team stats update process")

    // Fetch all teams
    const teamsCollection = collection(db, "teams")
    const teamsSnapshot = await getDocs(teamsCollection)

    console.log(`Found ${teamsSnapshot.size} teams to update`)

    if (teamsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No teams found to update",
        teams: [],
      })
    }

    // Fetch the current MLB stats from our API
    const baseUrl = getBaseUrl()
    console.log("Base URL for API calls:", baseUrl)

    const mlbStatsResponse = await fetch(`${baseUrl}/api/mlb-current-stats`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    if (!mlbStatsResponse.ok) {
      throw new Error(`Failed to fetch MLB stats: ${mlbStatsResponse.status}`)
    }

    const mlbStatsData = await mlbStatsResponse.json()
    const mlbStats = mlbStatsData.players

    console.log(`Fetched stats for ${mlbStats.length} MLB players`)
    console.log("Data source:", mlbStatsData.source)
    console.log("Is cached data:", mlbStatsData.isCached || false)

    const updates = []
    const updatedTeams = []

    // Update each team's stats
    for (const teamDoc of teamsSnapshot.docs) {
      try {
        const team = teamDoc.data()
        const teamPlayers = [
          team.players.tier1Player,
          team.players.tier2Player,
          team.players.tier3Player,
          team.players.wildcard1,
          team.players.wildcard2,
          team.players.wildcard3,
        ]

        // Calculate total HRs for the team based on current stats
        let totalHR = 0
        const playerHRs = []

        teamPlayers.forEach((player) => {
          if (player && player.id) {
            // Find the player's current stats by matching player ID
            const playerStats = mlbStats.find((p) => p.id === player.id)
            // Use actual HR count or default to 0 if not found
            const hr = playerStats ? playerStats.hr2025 : 0

            totalHR += hr
            playerHRs.push(hr)
          } else {
            playerHRs.push(0)
          }
        })

        console.log(`Updating team ${team.teamName} with ${totalHR} HRs`)

        // Update the team document
        updates.push(
          updateDoc(doc(db, "teams", teamDoc.id), {
            actualHR: totalHR,
            playerHRs: playerHRs,
            lastUpdated: new Date(),
          }),
        )

        updatedTeams.push({
          id: teamDoc.id,
          name: team.teamName,
          previousHR: team.actualHR || 0,
          newHR: totalHR,
        })
      } catch (error) {
        console.error(`Error processing team ${teamDoc.id}:`, error)
      }
    }

    // Wait for all updates to complete
    if (updates.length > 0) {
      await Promise.all(updates)
    }

    return NextResponse.json({
      success: true,
      message: `Updated stats for ${updates.length} teams`,
      teams: updatedTeams,
      timestamp: new Date().toISOString(),
      dataSource: mlbStatsData.source,
      isCachedData: mlbStatsData.isCached || false,
    })
  } catch (error) {
    console.error("Error updating team stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update team stats",
      },
      { status: 500 },
    )
  }
}

