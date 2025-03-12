"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"
import { db } from "../../lib/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore"
import Header from "../../components/Header"
import { useRouter } from "next/navigation"

interface Team {
  id: string
  name: string
  userId: string
  userDisplayName?: string
  userEmail?: string
  totalHRs: number
  paid: boolean
  createdAt: any
}

export default function AdminPage() {
  const user = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Admin UIDs - replace with your actual admin UIDs
  const ADMIN_UIDS = ["your-admin-uid-here"]

  useEffect(() => {
    if (user) {
      // Check if current user is an admin
      if (ADMIN_UIDS.includes(user.uid)) {
        setIsAdmin(true)
        fetchTeams()
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, router])

  const fetchTeams = async () => {
    try {
      const q = query(collection(db, "teams"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const teamsData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const teamData = docSnapshot.data() as Team
          teamData.id = docSnapshot.id

          // Get user info
          if (teamData.userId) {
            try {
              const userDoc = await doc(db, "users", teamData.userId)
              const userSnapshot = await getDocs(query(collection(db, "users"), doc(userDoc)))
              if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data()
                teamData.userDisplayName = userData.displayName
                teamData.userEmail = userData.email
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
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePaidStatus = async (teamId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "teams", teamId), {
        paid: !currentStatus,
      })

      // Update local state
      setTeams(teams.map((team) => (team.id === teamId ? { ...team, paid: !currentStatus } : team)))
    } catch (error) {
      console.error("Error updating payment status:", error)
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Loading...</h1>
          </div>
        </main>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p>You do not have permission to view this page.</p>
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
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Payment Management</h2>
            <div className="bg-yellow-50 p-4 rounded mb-4">
              <p>Total Teams: {teams.length}</p>
              <p>Paid Teams: {teams.filter((team) => team.paid).length}</p>
              <p>Unpaid Teams: {teams.filter((team) => !team.paid).length}</p>
              <p>Total Revenue: ${teams.filter((team) => team.paid).length * 10}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="px-4 py-3 text-left">Team Name</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-center">Created</th>
                  <th className="px-4 py-3 text-center">Payment Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr
                    key={team.id}
                    className={`
                      ${team.paid ? "bg-green-50" : "bg-red-50"}
                      hover:bg-gray-100 transition-colors
                    `}
                  >
                    <td className="border-b px-4 py-3">{team.name}</td>
                    <td className="border-b px-4 py-3">{team.userDisplayName || "Unknown"}</td>
                    <td className="border-b px-4 py-3">{team.userEmail || "Unknown"}</td>
                    <td className="border-b px-4 py-3 text-center">
                      {team.createdAt?.toDate().toLocaleDateString() || "Unknown"}
                    </td>
                    <td className="border-b px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-white ${
                          team.paid ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {team.paid ? "PAID" : "UNPAID"}
                      </span>
                    </td>
                    <td className="border-b px-4 py-3 text-center">
                      <button
                        onClick={() => togglePaidStatus(team.id, team.paid)}
                        className={`px-3 py-1 rounded text-white ${
                          team.paid ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {team.paid ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

