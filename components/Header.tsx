"use client"

import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="bg-blue-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Home Run Fantasy</Link>
        <nav>
          {user ? (
            <>
              <Link href="/dashboard" className="mr-4">Dashboard</Link>
              <button onClick={() => signOut(auth)} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
