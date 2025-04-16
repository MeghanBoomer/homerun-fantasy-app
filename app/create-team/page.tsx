"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
// Using relative paths for imports
import { auth, db } from "../../lib/firebase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { BeerIcon, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { PlayerSearch } from "../../components/player-search"
import { SubmissionAnimation } from "../../components/submission-animation"
// Import the error handler
import { handleFirebaseError } from "../../lib/firebase-error-handler"

// Types
interface Player {
  id: string
  name: string
  team: string
  hr2025: number // Explicitly using 2025 data
  position?: string
}

export default function CreateTeamPage() {
  const router = useRouter()
  const [teamName, setTeamName] = useState("")
  const [tier1Player, setTier1Player] = useState("")
  const [tier2Player, setTier2Player] = useState("")
  const [tier3Player, setTier3Player] = useState("")

  // For wildcard players, we'll use objects instead of just IDs
  const [wildcard1, setWildcard1] = useState<Player | null>(null)
  const [wildcard2, setWildcard2] = useState<Player | null>(null)
  const [wildcard3, setWildcard3] = useState<Player | null>(null)

  // Animation state
  const [showAnimation, setShowAnimation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Player data state
  const [tier1Players, setTier1Players] = useState<Player[]>([])
  const [tier2Players, setTier2Players] = useState<Player[]>([])
  const [tier3Players, setTier3Players] = useState<Player[]>([])
  const [wildcardPlayers, setWildcardPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")

  // Get the upcoming season year
  const getUpcomingSeasonYear = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-based, so 9 = October
    return currentMonth >= 10 ? currentYear + 1 : currentYear
  }

  const upcomingSeasonYear = getUpcomingSeasonYear()

  // Check if user has reached the maximum number of teams
  useEffect(() => {
    const checkTeamLimit = async () => {
      try {
        if (!auth.currentUser) {
          router.push("/login")
          return
        }

        const userId = auth.currentUser.uid
        const teamsQuery = query(collection(db, "teams"), where("userId", "==", userId))
        const querySnapshot = await getDocs(teamsQuery)

        if (querySnapshot.size >= 3) {
          // User already has 3 teams, redirect to dashboard
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking team limit:", error)
      }
    }

    checkTeamLimit()
  }, [router])

  // Fetch player data from MLB API
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setIsLoading(true)

        // Add a timeout to the fetch to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch("/api/mlb-players", {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to fetch player data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Ensure all players have valid hr2025 values
        const validatePlayers = (players: Player[]): Player[] => {
          return players.map((player) => ({
            ...player,
            hr2025: typeof player.hr2025 === "number" && !isNaN(player.hr2025) ? player.hr2025 : 0,
          }))
        }

        setTier1Players(validatePlayers(data.tier1Players))
        setTier2Players(validatePlayers(data.tier2Players))
        setTier3Players(validatePlayers(data.tier3Players))
        setWildcardPlayers(validatePlayers(data.wildcardPlayers))
        setLoadingError("")
      } catch (error) {
        console.error("Error fetching player data:", error)
        setLoadingError("Failed to load player data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayerData()
  }, [])

  // Function to update team stats immediately after creation
  const updateTeamStats = async (teamId: string) => {
    try {
      const response = await fetch("/api/update-single-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId }),
      })

      if (!response.ok) {
        console.error("Failed to update team stats:", await response.text())
      } else {
        console.log("Team stats updated successfully")
      }
    } catch (error) {
      console.error("Error updating team stats:", error)
    }
  }

  // Update the handleSubmit function to use the error handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const user = auth.currentUser

      if (!user) {
        setError("You must be logged in to create a team")
        setIsSubmitting(false)
        return
      }

      // Get the selected players' full information
      const tier1PlayerData = tier1Players.find((p) => p.id === tier1Player)
      const tier2PlayerData = tier2Players.find((p) => p.id === tier2Player)
      const tier3PlayerData = tier3Players.find((p) => p.id === tier3Player)

      if (!tier1PlayerData || !tier2PlayerData || !tier3PlayerData || !wildcard1 || !wildcard2 || !wildcard3) {
        setError("Please select all required players")
        setIsSubmitting(false)
        return
      }

      // Check for duplicate wildcard selections
      if (wildcard1.id === wildcard2.id || wildcard1.id === wildcard3.id || wildcard2.id === wildcard3.id) {
        setError("You cannot select the same player for multiple wildcard positions")
        setIsSubmitting(false)
        return
      }

      // Calculate total projected home runs - ensure we're adding valid numbers
      const getHR = (value: number | undefined): number => {
        return typeof value === "number" && !isNaN(value) ? value : 0
      }

      const totalHR =
        getHR(tier1PlayerData.hr2025) +
        getHR(tier2PlayerData.hr2025) +
        getHR(tier3PlayerData.hr2025) +
        getHR(wildcard1.hr2025) +
        getHR(wildcard2.hr2025) +
        getHR(wildcard3.hr2025)

      // Create team document in Firestore
      const teamsCollection = collection(db, "teams")
      const docRef = await addDoc(teamsCollection, {
        teamName,
        userId: user.uid,
        userEmail: user.email,
        isPaid: false, // Admin will mark as paid after Venmo payment
        createdAt: serverTimestamp(),
        totalHR,
        players: {
          tier1Player: tier1PlayerData,
          tier2Player: tier2PlayerData,
          tier3Player: tier3PlayerData,
          wildcard1,
          wildcard2,
          wildcard3,
        },
      })

      // Update team stats immediately
      await updateTeamStats(docRef.id)

      // Show success animation
      setShowAnimation(true)

      // Add a fallback redirect in case the animation redirect fails
      setTimeout(() => {
        if (window.location.pathname.includes("/create-team")) {
          console.log("Fallback redirect to leaderboards triggered")
          router.push("/leaderboards")
        }
      }, 6000) // Wait 6 seconds to allow animation to complete
    } catch (error: any) {
      console.error("Error creating team:", error)
      // Use the error handler to get a user-friendly message
      setError(handleFirebaseError(error, "creating team"))
      setIsSubmitting(false)
    }
  }

  const isFormComplete = () => {
    return teamName && tier1Player && tier2Player && tier3Player && wildcard1 && wildcard2 && wildcard3
  }

  const totalProjectedHR = () => {
    let total = 0

    // Helper function to safely add HR values
    const addHR = (value: number | undefined): number => {
      return typeof value === "number" && !isNaN(value) ? value : 0
    }

    if (tier1Player) {
      const player = tier1Players.find((p) => p.id === tier1Player)
      if (player) total += addHR(player.hr2025)
    }

    if (tier2Player) {
      const player = tier2Players.find((p) => p.id === tier2Player)
      if (player) total += addHR(player.hr2025)
    }

    if (tier3Player) {
      const player = tier3Players.find((p) => p.id === tier3Player)
      if (player) total += addHR(player.hr2025)
    }

    if (wildcard1) {
      total += addHR(wildcard1.hr2025)
    }

    if (wildcard2) {
      total += addHR(wildcard2.hr2025)
    }

    if (wildcard3) {
      total += addHR(wildcard3.hr2025)
    }

    return total
  }

  // Get available wildcard players (excluding already selected players)
  const getAvailableWildcardPlayers = (currentSelection: Player | null) => {
    return wildcardPlayers.filter((player) => {
      // Always include the current selection in the available players
      if (currentSelection && player.id === currentSelection.id) {
        return true
      }

      // Exclude players selected in other wildcard positions
      return (
        (!wildcard1 || player.id !== wildcard1.id) &&
        (!wildcard2 || player.id !== wildcard2.id) &&
        (!wildcard3 || player.id !== wildcard3.id)
      )
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Loading MLB player data...</h2>
        <p className="text-muted-foreground mt-2">This may take a few moments</p>
      </div>
    )
  }

  // Error state
  if (loadingError) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-8">
        <div className="bg-destructive/10 text-destructive p-6 rounded-md flex flex-col items-center">
          <AlertCircle className="h-12 w-12 mb-4" />
          <h2 className="text-xl font-medium mb-2">Failed to Load Player Data</h2>
          <p className="text-center mb-4">{loadingError}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Helper function to safely display HR values
  const displayHR = (value: number | undefined): string => {
    return typeof value === "number" && !isNaN(value) ? value.toString() : "0"
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Your Team</h1>
        <p className="text-muted-foreground">Select 6 players for your Homerun Fantasy team</p>
        <p className="text-muted-foreground mt-1">
          Tier players are based on 2024 HR leaders who are still active in 2025. Wild Card players include all active
          players for the 2025 season, including rookies.
        </p>
      </div>

      <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Team Information</CardTitle>
                <CardDescription>Give your team a unique name</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter a unique team name"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier 1 Selection</CardTitle>
                <CardDescription>Select 1 player from the top HR hitters of 2025</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tier1">Tier 1 Player</Label>
                    <Select value={tier1Player} onValueChange={setTier1Player}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Tier 1 player" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {tier1Players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} ({player.team}) - {displayHR(player.hr2025)} HR
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier 2 Selection</CardTitle>
                <CardDescription>Select 1 player from the next group of HR hitters</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tier2">Tier 2 Player</Label>
                    <Select value={tier2Player} onValueChange={setTier2Player}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Tier 2 player" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {tier2Players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} ({player.team}) - {displayHR(player.hr2025)} HR
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier 3 Selection</CardTitle>
                <CardDescription>Select 1 player from the third group of HR hitters</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tier3">Tier 3 Player</Label>
                    <Select value={tier3Player} onValueChange={setTier3Player}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Tier 3 player" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {tier3Players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} ({player.team}) - {displayHR(player.hr2025)} HR
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wild Card Selections</CardTitle>
                <CardDescription>
                  Select 3 players not in the tiers above (includes rookies and all active players)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="wildcard1">Wild Card Player 1</Label>
                    <PlayerSearch
                      players={getAvailableWildcardPlayers(wildcard1)}
                      onSelect={setWildcard1}
                      selectedPlayer={wildcard1}
                      placeholder="Search for Wild Card player 1..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wildcard2">Wild Card Player 2</Label>
                    <PlayerSearch
                      players={getAvailableWildcardPlayers(wildcard2)}
                      onSelect={setWildcard2}
                      selectedPlayer={wildcard2}
                      placeholder="Search for Wild Card player 2..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wildcard3">Wild Card Player 3</Label>
                    <PlayerSearch
                      players={getAvailableWildcardPlayers(wildcard3)}
                      onSelect={setWildcard3}
                      selectedPlayer={wildcard3}
                      placeholder="Search for Wild Card player 3..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>$10 entry fee per team</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col items-center space-y-4 px-2 sm:px-4">
                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                    <p className="mb-2 font-medium">Send $10 per team entry via Venmo</p>
                    <Link href="https://venmo.com/u/Meghward" target="_blank" rel="noopener noreferrer">
                      <BeerIcon className="h-16 w-16 mx-auto text-primary" />
                      <span className="block mt-2 text-primary hover:underline">Pay via Venmo</span>
                    </Link>
                  </div>
                  <div className="flex items-center text-amber-600 bg-amber-50 p-3 rounded-md w-full">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">Teams will be manually verified for payment</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={!isFormComplete() || isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Team"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div className="space-y-6">
          <Card className="md:sticky md:top-20">
            <CardHeader>
              <CardTitle>Team Preview</CardTitle>
              <CardDescription>Your selected players and projected home runs</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Team Name</h3>
                  <div className="p-3 border border-border rounded-md bg-background">
                    {teamName || "Not selected yet"}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Tier 1 Player</h3>
                  {tier1Player ? (
                    <div className="p-3 border border-border rounded-md shadow-sm bg-background">
                      <p className="font-medium">{tier1Players.find((p) => p.id === tier1Player)?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tier1Players.find((p) => p.id === tier1Player)?.team} •{" "}
                        {displayHR(tier1Players.find((p) => p.id === tier1Player)?.hr2025)} HR in {upcomingSeasonYear}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border border-border/50 rounded-md bg-background text-muted-foreground">
                      Not selected yet
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Tier 2 Player</h3>
                  {tier2Player ? (
                    <div className="p-3 border border-border rounded-md shadow-sm bg-background">
                      <p className="font-medium">{tier2Players.find((p) => p.id === tier2Player)?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tier2Players.find((p) => p.id === tier2Player)?.team} •{" "}
                        {displayHR(tier2Players.find((p) => p.id === tier2Player)?.hr2025)} HR in {upcomingSeasonYear}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border border-border/50 rounded-md bg-background text-muted-foreground">
                      Not selected yet
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Tier 3 Player</h3>
                  {tier3Player ? (
                    <div className="p-3 border border-border rounded-md shadow-sm bg-background">
                      <p className="font-medium">{tier3Players.find((p) => p.id === tier3Player)?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tier3Players.find((p) => p.id === tier3Player)?.team} •{" "}
                        {displayHR(tier3Players.find((p) => p.id === tier3Player)?.hr2025)} HR in {upcomingSeasonYear}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border border-border/50 rounded-md bg-background text-muted-foreground">
                      Not selected yet
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Wild Card Players</h3>
                  {wildcard1 ? (
                    <div className="p-3 border border-border rounded-md shadow-sm mb-2 bg-background">
                      <p className="font-medium">{wildcard1.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {wildcard1.team} • {displayHR(wildcard1.hr2025)} HR in {upcomingSeasonYear}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border border-border/50 rounded-md mb-2 bg-background text-muted-foreground">
                      Wild Card 1 not selected
                    </div>
                  )}

                  {wildcard2 ? (
                    <div className="p-3 border border-border rounded-md shadow-sm mb-2 bg-background">
                      <p className="font-medium">{wildcard2.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {wildcard2.team} • {displayHR(wildcard2.hr2025)} HR in {upcomingSeasonYear}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border border-border/50 rounded-md mb-2 bg-background text-muted-foreground">
                      Wild Card 2 not selected
                    </div>
                  )}

                  {wildcard3 ? (
                    <div className="p-3 border border-border rounded-md shadow-sm bg-background">
                      <p className="font-medium">{wildcard3.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {wildcard3.team} • {displayHR(wildcard3.hr2025)} HR in {upcomingSeasonYear}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border border-border/50 rounded-md bg-background text-muted-foreground">
                      Wild Card 3 not selected
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Projected {upcomingSeasonYear} HR Total:</h3>
                    <span className="text-xl font-bold">{totalProjectedHR()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submission Animation */}
      <SubmissionAnimation isOpen={showAnimation} teamName={teamName} onClose={() => setShowAnimation(false)} />
    </div>
  )
}
