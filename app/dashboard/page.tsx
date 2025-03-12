"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/useAuth"
import { db } from "../../lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import Header from "../../components/Header"
import Link from "next/link"

export default function Dashboard() {
  const user = useAuth()
  const [teams, setTeams] = useState([])

  useEffect(() => {
    if (user) {
      const fetchTeams = async () => {
        const q = query(collection(db, "teams"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        setTeams(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      }
      fetchTeams()
    }
  }, [user])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome, {user.displayName || user.email}!</h1>
          <h2 className="text-2xl font-bold mb-4">Your Teams</h2>
          {teams.length === 0 ? (
            <p>You haven't created any teams yet.</p>
          ) : (
            <ul>
              {teams.map((team: any) => (
                <li key={team.id} className="mb-2">
                  <Link href={`/team/${team.id}`} className="text-blue-500 hover:underline">
                    {team.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {teams.length < 3 && (
            <Link
              href="/create-team"
              className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Create New Team
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}

