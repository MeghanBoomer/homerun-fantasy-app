"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"
import { db } from "../../lib/firebase"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import Header from "../../components/Header"
import { useRouter } from "next/navigation"
import { fetchTopHomeRunHitters } from "../../lib/mlb-service"
import type React from "react"

interface Player {
  id: number
  name: string
  team: string
  homeRuns: number
}

export default function CreateTeam() {
  const user = useAuth()
  const router = useRouter()
  const [teamName, setTeamName] = useState("")
  const [selectedPlayers, setSelectedPlayers] = useState({
    tier1: "",
    tier2: "",
    tier3: "",
    wildCard1: "",
    wildCard2: "",
    wildCard3: "",
  })
  const [error, setError] = useState("")
  const [players, setPlayers] = useState<{
    tier1: Player[]
    tier2: Player[]
    tier3: Player[]
    wildCardPlayers: Player[]
  }>({
    tier1: [],
    tier2: [],
    tier3: [],
    wildCardPlayers: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const mlbPlayers = await fetchTopHomeRunHitters()
        setPlayers(mlbPlayers)
      } catch (error) {
        setError("Failed to load MLB players. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadPlayers()
  }, [])

  useEffect(() => {
    if (user) {
      const checkTeamCount = async () => {
        const q = query(collection(db, "teams"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        if (querySnapshot.size >= 3) {
          setError("You have already created the maximum number of teams (3).")
        }
      }
      checkTeamCount()
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (Object.values(selectedPlayers).some((player) => !player)) {
      setError("Please select all players before submitting.")
      return
    }

    try {
      await addDoc(collection(db, "teams"), {
        userId: user.uid,
        name: teamName,
        ...selectedPlayers,
        createdAt: new Date(),
        totalHRs: 0, // Initial value, will be updated by the API
        paid: false, // Admin will mark as paid
      })
      router.push("/dashboard")
    } catch (error) {
      setError("Failed to create team. Please try again.")
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Loading MLB Players...</h1>
            <p>Please wait while we fetch the latest player data.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Create Your Team</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 font-bold">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            {/* Tier 1 Players (Top 6 HR hitters) */}
            <div className="mb-6 p-4 border rounded bg-red-50">
              <h2 className="text-xl font-bold mb-2">Tier 1 - Top HR Hitters</h2>
              <p className="mb-2 text-sm">Select 1 player from the top 6 home run hitters</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.tier1.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedPlayers.tier1 === player.id.toString()
                        ? "bg-blue-100 border-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedPlayers({ ...selectedPlayers, tier1: player.id.toString() })}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">{player.name}</span>
                      <span className="text-gray-600">{player.team}</span>
                    </div>
                    <div className="text-sm text-gray-500">{player.homeRuns} HR in 2024</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 2 Players (Next 6 HR hitters) */}
            <div className="mb-6 p-4 border rounded bg-blue-50">
              <h2 className="text-xl font-bold mb-2">Tier 2 - Strong HR Hitters</h2>
              <p className="mb-2 text-sm">Select 1 player from the next 6 home run hitters</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.tier2.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedPlayers.tier2 === player.id.toString()
                        ? "bg-blue-100 border-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedPlayers({ ...selectedPlayers, tier2: player.id.toString() })}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">{player.name}</span>
                      <span className="text-gray-600">{player.team}</span>
                    </div>
                    <div className="text-sm text-gray-500">{player.homeRuns} HR in 2024</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 3 Players (Next 6 HR hitters) */}
            <div className="mb-6 p-4 border rounded bg-green-50">
              <h2 className="text-xl font-bold mb-2">Tier 3 - Solid HR Hitters</h2>
              <p className="mb-2 text-sm">Select 1 player from the next 6 home run hitters</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.tier3.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedPlayers.tier3 === player.id.toString()
                        ? "bg-blue-100 border-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedPlayers({ ...selectedPlayers, tier3: player.id.toString() })}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">{player.name}</span>
                      <span className="text-gray-600">{player.team}</span>
                    </div>
                    <div className="text-sm text-gray-500">{player.homeRuns} HR in 2024</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wild Card Players */}
            <div className="mb-6 p-4 border rounded bg-yellow-50">
              <h2 className="text-xl font-bold mb-2">Wild Card Selections</h2>
              <p className="mb-2 text-sm">Select 3 players from anyone not in the tiers above</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {players.wildCardPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedPlayers.wildCard1 === player.id.toString() ||
                      selectedPlayers.wildCard2 === player.id.toString() ||
                      selectedPlayers.wildCard3 === player.id.toString()
                        ? "bg-blue-100 border-blue-500"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      if (!selectedPlayers.wildCard1) {
                        setSelectedPlayers({ ...selectedPlayers, wildCard1: player.id.toString() })
                      } else if (!selectedPlayers.wildCard2) {
                        setSelectedPlayers({ ...selectedPlayers, wildCard2: player.id.toString() })
                      } else if (!selectedPlayers.wildCard3) {
                        setSelectedPlayers({ ...selectedPlayers, wildCard3: player.id.toString() })
                      }
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">{player.name}</span>
                      <span className="text-gray-600">{player.team}</span>
                    </div>
                    <div className="text-sm text-gray-500">{player.homeRuns} HR in 2024</div>
                  </div>
                ))}
              </div>

              {/* Selected Wild Cards */}
              <div className="mt-4">
                <h3 className="font-bold">Your Wild Card Selections:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPlayers.wildCard1 && (
                    <div className="bg-blue-100 border border-blue-500 rounded px-3 py-1 flex items-center">
                      {players.wildCardPlayers.find((p) => p.id.toString() === selectedPlayers.wildCard1)?.name}
                      <button
                        className="ml-2 text-red-500"
                        onClick={() => setSelectedPlayers({ ...selectedPlayers, wildCard1: "" })}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {selectedPlayers.wildCard2 && (
                    <div className="bg-blue-100 border border-blue-500 rounded px-3 py-1 flex items-center">
                      {players.wildCardPlayers.find((p) => p.id.toString() === selectedPlayers.wildCard2)?.name}
                      <button
                        className="ml-2 text-red-500"
                        onClick={() => setSelectedPlayers({ ...selectedPlayers, wildCard2: "" })}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {selectedPlayers.wildCard3 && (
                    <div className="bg-blue-100 border border-blue-500 rounded px-3 py-1 flex items-center">
                      {players.wildCardPlayers.find((p) => p.id.toString() === selectedPlayers.wildCard3)?.name}
                      <button
                        className="ml-2 text-red-500"
                        onClick={() => setSelectedPlayers({ ...selectedPlayers, wildCard3: "" })}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Team Preview */}
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h2 className="text-xl font-bold mb-2">Your Team Preview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border rounded bg-white">
                  <h3 className="font-bold">Tier 1 Player</h3>
                  {selectedPlayers.tier1 ? (
                    <div className="mt-2">
                      <div className="font-medium">
                        {players.tier1.find((p) => p.id.toString() === selectedPlayers.tier1)?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {players.tier1.find((p) => p.id.toString() === selectedPlayers.tier1)?.team}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 mt-2">Not selected</div>
                  )}
                </div>
                <div className="p-3 border rounded bg-white">
                  <h3 className="font-bold">Tier 2 Player</h3>
                  {selectedPlayers.tier2 ? (
                    <div className="mt-2">
                      <div className="font-medium">
                        {players.tier2.find((p) => p.id.toString() === selectedPlayers.tier2)?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {players.tier2.find((p) => p.id.toString() === selectedPlayers.tier2)?.team}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 mt-2">Not selected</div>
                  )}
                </div>
                <div className="p-3 border rounded bg-white">
                  <h3 className="font-bold">Tier 3 Player</h3>
                  {selectedPlayers.tier3 ? (
                    <div className="mt-2">
                      <div className="font-medium">
                        {players.tier3.find((p) => p.id.toString() === selectedPlayers.tier3)?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {players.tier3.find((p) => p.id.toString() === selectedPlayers.tier3)?.team}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 mt-2">Not selected</div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="mb-6 p-4 border rounded bg-red-50">
              <h2 className="text-xl font-bold mb-2">Payment Required</h2>
              <p className="mb-4">Send $10 per team entry via Venmo before submitting.</p>
              <a
                href="[insert your Venmo link]"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transform hover:scale-105 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #4299e1, #3182ce)",
                  border: "2px solid #2c5282",
                  boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
                }}
              >
                Pay via Venmo
              </a>
            </div>

            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg w-full"
              style={{
                background: "linear-gradient(135deg, #48bb78, #38a169)",
                border: "2px solid #2f855a",
              }}
            >
              Create Team
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

