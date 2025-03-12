"use client"

import { useState, useEffect } from "react"
import { auth } from "../lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [])

  return user
}

