import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import fetch from "node-fetch"

admin.initializeApp()

const db = admin.firestore()

export const updateHomeRunStats = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const teamsSnapshot = await db.collection("teams").get()

  for (const doc of teamsSnapshot.docs) {
    const team = doc.data()
    let totalHRs = 0

    const players = [team.tier1, team.tier2, team.tier3, team.wildCard1, team.wildCard2, team.wildCard3]

    for (const player of players) {
      const playerStats = await fetch(`https://statsapi.mlb.com/api/v1/people/${player}/stats?stats=season&season=2025`)
      const statsData = await playerStats.json()
      const homeRuns = statsData.stats[0].splits[0].stat.homeRuns || 0
      totalHRs += homeRuns
    }

    await doc.ref.update({ totalHRs })
  }

  return null
})

