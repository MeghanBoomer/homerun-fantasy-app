"use client"

import { useState, useEffect } from "react"
import { db } from "../../lib/firebase"
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore"
import Header from "../../components/Header"
import { fetchTopHomeRunHitters } from "../../lib/mlb-service"

interface Player {
  id: number
  name: string
  team: string
  homeRuns: number
}

interface Team {
  id: string
  name: string
  userId: string
  userDisplayName?: string
  totalHRs: number
  tier1: string
  tier2: string
  tier3: string
  wildCard1: string
  wildCard2: string
  wildCard3: string
}

export default function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<{ [key: string]: Player }>({})

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch all MLB players first
        const mlbPlayers = await fetchTopHomeRunHitters()
        const allPlayers = [
          ...mlbPlayers.tier1,
          ...mlbPlayers.tier2,
          ...mlbPlayers.tier3,
          ...mlbPlayers.wildCardPlayers,
        ]

        // Create a map of player IDs to player objects
        const playerMap = allPlayers.reduce(
          (map, player) => {
            map[player.id.toString()] = player
            return map
          },
          {} as { [key: string]: Player },
        )

        setPlayers(playerMap)

        // Fetch teams ordered by total home runs
        const q = query(collection(db, "teams"), orderBy("totalHRs", "desc"), limit(50))
        const querySnapshot = await getDocs(q)

        // Process each team
        const teamsData = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const teamData = docSnapshot.data() as Team
            teamData.id = docSnapshot.id

            // Fetch user display name
            if (teamData.userId) {
              try {
                const userDoc = await getDoc(doc(db, "users", teamData.userId))
                if (userDoc.exists()) {
                  teamData.userDisplayName = userDoc.data().displayName
                }
              } catch (error) {
                console.error("Error fetching user:", error)
              }
            }

            return teamData
          }),
        )

        setTeams(teamsData)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const getPlayerName = (playerId: string) => {
    return players[playerId]?.name || "Unknown Player"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-6 text-center">
            <span className="text-red-600">HOME RUN</span> FANTASY LEADERBOARD
          </h1>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {/* Top 3 Teams Podium */}
              {teams.length > 0 && (
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-8">
                    {/* 2nd Place */}
                    {teams.length > 1 && (
                      <div className="w-full md:w-1/4 bg-gray-100 rounded-t-lg pt-4 pb-8 px-4 text-center border-t-4 border-gray-400 shadow-md">
                        <div className="text-5xl mb-2">🥈</div>
                        <div className="font-bold text-xl">{teams[1].name}</div>
                        <div className="text-gray-600">{teams[1].userDisplayName || "Anonymous"}</div>
                        <div className="text-2xl font-bold mt-2">{teams[1].totalHRs} HR</div>
                      </div>
                    )}

                    {/* 1st Place */}
                    <div className="w-full md:w-1/3 bg-yellow-100 rounded-t-lg pt-6 pb-12 px-4 text-center border-t-4 border-yellow-400 shadow-lg z-10">
                      <div className="text-6xl mb-2">🥇</div>
                      <div className="font-bold text-2xl">{teams[0].name}</div>
                      <div className="text-gray-600">{teams[0].userDisplayName || "Anonymous"}</div>
                      <div className="text-3xl font-bold mt-2">{teams[0].totalHRs} HR</div>
                    </div>

                    {/* 3rd Place */}
                    {teams.length > 2 && (
                      <div className="w-full md:w-1/4 bg-orange-50 rounded-t-lg pt-2 pb-6 px-4 text-center border-t-4 border-orange-300 shadow-md">
                        <div className="text-4xl mb-2">🥉</div>
                        <div className="font-bold text-lg">{teams[2].name}</div>
                        <div className="text-gray-600">{teams[2].userDisplayName || "Anonymous"}</div>
                        <div className="text-xl font-bold mt-2">{teams[2].totalHRs} HR</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full Leaderboard */}
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-green-800 text-white">
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Team</th>
                      <th className="px-4 py-3 text-left">Manager</th>
                      <th className="px-4 py-3 text-center">HRs</th>
                      <th className="px-4 py-3 text-left">Players</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, index) => (
                      <tr
                        key={team.id}
                        className={`
                          ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          ${index < 3 ? "font-semibold" : ""}
                          hover:bg-blue-50 transition-colors
                        `}
                      >
                        <td className="border-b px-4 py-3 text-center">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          {index > 2 && <span>{index + 1}</span>}
                        </td>
                        <td className="border-b px-4 py-3">{team.name}</td>
                        <td className="border-b px-4 py-3">{team.userDisplayName || "Anonymous"}</td>
                        <td className="border-b px-4 py-3 text-center font-bold">{team.totalHRs}</td>
                        <td className="border-b px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-red-100 text-xs px-2 py-1 rounded">{getPlayerName(team.tier1)}</span>
                            <span className="bg-blue-100 text-xs px-2 py-1 rounded">{getPlayerName(team.tier2)}</span>
                            <span className="bg-green-100 text-xs px-2 py-1 rounded">{getPlayerName(team.tier3)}</span>
                            <span className="bg-yellow-100 text-xs px-2 py-1 rounded">
                              {getPlayerName(team.wildCard1)}
                            </span>
                            <span className="bg-yellow-100 text-xs px-2 py-1 rounded">
                              {getPlayerName(team.wildCard2)}
                            </span>
                            <span className="bg-yellow-100 text-xs px-2 py-1 rounded">
                              {getPlayerName(team.wildCard3)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

