"use client"

import { useState } from "react"
import { signOut } from "firebase/auth"
import { auth } from "../../lib/firebase"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Loader2, LogOut } from "lucide-react"
import Link from "next/link"

export default function LogoutPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError(null)

    try {
      await signOut(auth)
      setSuccess(true)

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Failed to sign out. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="container py-12 flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>Sign out of your Homerun Fantasy account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">{error}</div>}

          {success && (
            <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4">
              You have been signed out successfully. Redirecting to home page...
            </div>
          )}

          <p className="mb-4">Are you sure you want to sign out?</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>

          <Button onClick={handleLogout} disabled={isLoggingOut || success}>
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
