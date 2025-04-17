import { NextResponse } from "next/server"
import { adminDb } from "../../../lib/firebase-admin"

// Update the function to only use real MLB data
export async function POST() {
  try {
    console.log("Starting team stats update process - using real MLB data only")

    // Fetch MLB data directly from the API - explicitly for 2025 season
    const currentYear = 2025 // Explicitly set to 2025
    const mlbApiUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns&season=${currentYear}&limit=500&sportId=1`

    console.log("Fetching MLB data from:", mlbApiUrl)

    const mlbResponse = await fetch(mlbApiUrl, {
      headers: {
        "User-Agent": "Homerun-Fantasy-App/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 0 }, // Don't cache
    })

    if (!mlbResponse.ok) {
      throw new Error(`MLB API responded with status: ${mlbResponse.status}`)
    }

    const mlbData = await mlbResponse.json()
    console.log("MLB API data fetched successfully")

    // Process the MLB data
    let mlbStats = []
    if (mlbData.leagueLeaders && mlbData.leagueLeaders.length > 0 && mlbData.leagueLeaders[0].leaders) {
      mlbStats = mlbData.leagueLeaders[0].leaders.map((leader: any) => ({
        id: `p${leader.person.id}`,
        name: leader.person.fullName,
        team: leader.team?.abbreviation || leader.team?.name || "Unknown",
        hr2025: leader.value, // Explicitly use hr2025 for the 2025 season
        position: leader.position?.abbreviation || "Unknown",
      }))
    } else {
      throw new Error("No player data found in MLB API response")
    }

    console.log(`Processed ${mlbStats.length} players from MLB API`)

    // Try to fetch teams from Firestore
    let teamsSnapshot
    const updatedTeams = []
    let firestoreSuccess = false

    try {
      // Fetch all teams
      const teamsCollection = adminDb.collection("teams")
      teamsSnapshot = await teamsCollection.get()

      console.log(`Found ${teamsSnapshot.size} teams to update`)

      if (teamsSnapshot.empty) {
        return NextResponse.json({
          success: true,
          message: "No teams found to update",
          teams: [],
          mlbApiStatus: "Connected",
          mlbPlayerCount: mlbStats.length,
        })
      }

      const updates = []

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

          teamPlayers.forEach((player: any) => {
            if (player && player.id) {
              // Find the player's current stats by matching player ID or name
              const playerStats = mlbStats.find(
                (p: { id: string; name: string }) =>
                  p.id === player.id || p.name.toLowerCase() === player.name?.toLowerCase(),
              )

              // Use actual HR count or default to 0 if not found
              const hr = playerStats ? playerStats.hr2025 : 0 // Use hr2025 for the 2025 season

              totalHR += hr
              playerHRs.push(hr)
            } else {
              playerHRs.push(0)
            }
          })

          console.log(`Updating team ${team.teamName} with ${totalHR} HRs from players: ${JSON.stringify(playerHRs)}`)

          // Update the team document with both the total and individual player HRs
          updates.push(
            adminDb.collection("teams").doc(teamDoc.id).update({
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
            playerHRs: playerHRs,
          })
        } catch (error) {
          console.error(`Error processing team ${teamDoc.id}:`, error)
        }
      }

      // Wait for all updates to complete
      if (updates.length > 0) {
        await Promise.all(updates)
        firestoreSuccess = true
      }
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError)
      throw firestoreError // Rethrow to stop execution - no fallback to mock data
    }

    return NextResponse.json({
      success: true,
      message: firestoreSuccess ? `Updated stats for ${updatedTeams.length} teams` : "Stats update failed",
      teams: updatedTeams,
      timestamp: new Date().toISOString(),
      dataSource: "MLB Stats API (Direct)",
      firestoreStatus: firestoreSuccess ? "Connected" : "Error",
      mlbApiStatus: "Connected",
      mlbPlayerCount: mlbStats.length,
      samplePlayers: mlbStats.slice(0, 5),
    })
  } catch (error) {
    console.error("Error updating team stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update team stats",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
