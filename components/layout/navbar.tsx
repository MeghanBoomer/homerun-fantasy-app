"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BeerIcon, Menu, X } from "lucide-react"
import { Button } from "../ui/button"
import { auth } from "../../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { getDoc, doc } from "firebase/firestore"
import { db } from "../../lib/firebase"

// Add this function to check if user is admin
const checkAdminStatus = async (uid: string) => {
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid))
    return adminDoc.exists()
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Then update your useEffect:
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email)
      setUser(currentUser)

      if (currentUser) {
        // Check if user is admin
        const adminStatus = await checkAdminStatus(currentUser.uid)
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      console.log("User signed out")
      // Force reload to clear any cached state
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Base navigation links
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/leaderboards", label: "Leaderboards" },
  ]

  // Add links based on authentication state
  if (user) {
    navLinks.push({ href: "/dashboard", label: "Dashboard" })
    navLinks.push({ href: "/create-team", label: "Create Team" })
  }

  // Add admin link if user is admin
  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin Panel" })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <BeerIcon className="h-6 w-6" />
            <span className="text-xl font-bold">Homerun Fantasy</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {!isLoading && (
            <>
              {user ? (
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </>
          )}
          {isAdmin && (
            <Button asChild variant="destructive">
              <Link href="/admin">ADMIN ACCESS</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={toggleMenu}>
          <span className="sr-only">Toggle menu</span>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container py-4 grid gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Button asChild variant="destructive" className="mt-2 mb-2" onClick={closeMenu}>
                <Link href="/admin">ADMIN ACCESS</Link>
              </Button>
            )}

            {!isLoading && (
              <>
                {user ? (
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                ) : (
                  <Button asChild onClick={closeMenu}>
                    <Link href="/login">Sign In</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

