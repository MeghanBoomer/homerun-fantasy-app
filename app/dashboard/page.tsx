"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, type Timestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../lib/firebase"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import {
  AlertCircle,
  Loader2,
  Trophy,
  Users,
  PlusCircle,
  BarChart2,
  Ruler,
  LogOut,
  Info,
  ExternalLink,
  BeerIcon,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Separator } from "../../components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { RealHomeRunsWidget } from "../../components/real-home-runs-widget"

// Import the error handler
import { handleFirebaseError } from "../../lib/firebase-error-handler"

interface Player {
  id: string
  name: string
  team: string
  hr2025: number // Ensure we're using 2025 data
  position?: string
}

interface Team {
  id: string
  teamName: string
  userId: string
  userEmail: string
  isPaid: boolean
  createdAt: Timestamp
  totalHR: number
  actualHR?: number
  rank?: number
  players: {
    tier1Player: Player
    tier2Player: Player
    tier3Player: Player
    wildcard1: Player
    wildcard2: Player
    wildcard3: Player
  }
  playerHRs?: number[]
}

interface HomeRun {
  playerId: string
  playerName: string
  playerTeam: string
  date: any
  opponent?: string
  gameId?: string
  description?: string
  videoLink?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [recentHomeRuns, setRecentHomeRuns] = useState<HomeRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingHomeRuns, setIsLoadingHomeRuns] = useState(true)
  const [homeRunsError, setHomeRunsError] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [weeklyHRChange, setWeeklyHRChange] = useState(0)
  const [longestHomeRun, setLongestHomeRun] = useState<{
    distance: number
    player: string
    team: string
    date?: string
    opponent?: string
    gameId?: string
    videoLink?: string
    isLoading?: boolean
    error?: string
  }>({
    distance: 0,
    player: "",
    team: "",
    isLoading: true,
  })

  // Add a debug state
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isRefreshingHomeRuns, setIsRefreshingHomeRuns] = useState(false)

  // Get the current season year
  const getCurrentSeasonYear = () => {
    return 2025 // Explicitly set to 2025 for the current season
  }

  const currentSeasonYear = getCurrentSeasonYear()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchUserTeams(currentUser.uid)
        fetchAllTeams()
        fetchLongestHomeRun()
      } else {
        // Not logged in, redirect to login
        console.log("User not logged in, redirecting to login")
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Calculate the sum of home runs for a team
  const calculateTeamHomeRuns = (team: Team): number => {
    // If playerHRs array exists, calculate the sum
    if (team.playerHRs && team.playerHRs.length > 0) {
      const sum = team.playerHRs.reduce((total, hr) => total + (Number(hr) || 0), 0)
      console.log(`Team ${team.teamName} HR sum: ${sum}, playerHRs: ${JSON.stringify(team.playerHRs)}`)
      return sum
    }
    // If actualHR is already set, use it
    else if (team.actualHR !== undefined) {
      return team.actualHR
    }
    // If neither exists, default to 0
    else {
      return 0
    }
  }

  // Update the fetchUserTeams function to use the error handler
  const fetchUserTeams = async (userId: string) => {
    setIsLoading(true)
    try {
      console.log("Fetching teams for user:", userId)
      const teamsQuery = query(collection(db, "teams"), where("userId", "==", userId))
      const querySnapshot = await getDocs(teamsQuery)

      const userTeams: Team[] = []
      querySnapshot.forEach((doc) => {
        userTeams.push({ id: doc.id, ...doc.data() } as Team)
      })

      // Sort by totalHR in descending order
      userTeams.sort((a, b) => b.totalHR - a.totalHR)

      console.log("Found teams:", userTeams.length)
      setTeams(userTeams)
      setError("")

      // Calculate actual home runs for each team
      const teamsWithCalculatedHRs = userTeams.map((team) => {
        const totalHRs = calculateTeamHomeRuns(team)
        console.log(
          `Dashboard - Team ${team.teamName}: Total HRs = ${totalHRs}, playerHRs = ${JSON.stringify(team.playerHRs || [])}`,
        )
        return {
          ...team,
          actualHR: totalHRs,
        }
      })

      setTeams(teamsWithCalculatedHRs)

      // Calculate weekly HR change based on actual data
      const totalHRs = teamsWithCalculatedHRs.reduce((sum, team) => sum + (team.actualHR || 0), 0)

      // Calculate weekly change based on actual data if available
      if (teamsWithCalculatedHRs.length > 0) {
        // For now, we'll use a placeholder value until we implement proper weekly tracking
        setWeeklyHRChange(1)
      }

      // After teams are loaded, fetch recent home runs
      if (teamsWithCalculatedHRs.length > 0) {
        fetchRecentHomeRuns(teamsWithCalculatedHRs)
      } else {
        setIsLoadingHomeRuns(false)
      }
    } catch (error: any) {
      console.error("Error fetching teams:", error)
      // Use the error handler to get a user-friendly message
      setError(handleFirebaseError(error, "fetching your teams"))
      setIsLoadingHomeRuns(false)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllTeams = async () => {
    try {
      // Fetch all teams without complex query conditions
      const teamsQuery = query(collection(db, "teams"))
      const querySnapshot = await getDocs(teamsQuery)

      const allTeamsData: Team[] = []
      querySnapshot.forEach((doc) => {
        allTeamsData.push({ id: doc.id, ...doc.data() } as Team)
      })

      // Calculate total HRs for each team
      const teamsWithCalculatedHRs = allTeamsData.map((team) => {
        const totalHRs = calculateTeamHomeRuns(team)
        return {
          ...team,
          actualHR: totalHRs,
        }
      })

      // Sort by actualHR in descending order
      teamsWithCalculatedHRs.sort((a, b) => (b.actualHR || 0) - (a.actualHR || 0))

      // Add rank to each team, handling ties correctly
      const rankedTeams = []
      let currentRank = 1
      let previousHR = -1

      for (let i = 0; i < teamsWithCalculatedHRs.length; i++) {
        const team = teamsWithCalculatedHRs[i]
        const teamHR = team.actualHR || 0

        // If this is the first team or it has a different HR count than the previous team
        if (i === 0 || teamHR !== previousHR) {
          currentRank = i + 1
        }

        // Store the current HR for the next iteration
        previousHR = teamHR

        rankedTeams.push({
          ...team,
          rank: currentRank,
        })
      }

      setAllTeams(rankedTeams)

      // Update ranks for user teams based on the global ranking
      setTeams((prevTeams) => {
        return prevTeams.map((team) => {
          const matchingTeam = rankedTeams.find((t) => t.id === team.id)
          return {
            ...team,
            rank: matchingTeam?.rank,
          }
        })
      })
    } catch (error) {
      console.error("Error fetching all teams:", error)
    }
  }

  const fetchRecentHomeRuns = async (userTeams: Team[]) => {
    setIsLoadingHomeRuns(true)
    setHomeRunsError(null)

    try {
      // Get all players from the user's teams
      const userPlayers = userTeams.flatMap((team) => [
        team.players.tier1Player,
        team.players.tier2Player,
        team.players.tier3Player,
        team.players.wildcard1,
        team.players.wildcard2,
        team.players.wildcard3,
      ])

      // Get unique player IDs
      const uniquePlayerIds = [...new Set(userPlayers.map((player) => player?.id).filter(Boolean))]

      if (uniquePlayerIds.length === 0) {
        setRecentHomeRuns([])
        setIsLoadingHomeRuns(false)
        return
      }

      // Call our API endpoint with improved error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      try {
        const response = await fetch(`/api/real-home-runs?playerIds=${uniquePlayerIds.join(",")}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()

        // If we get a successful response with home runs
        if (data.success) {
          setRecentHomeRuns(data.homeRuns || [])
        } else {
          // Handle other error cases
          throw new Error(data.error || "Failed to fetch home run data")
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError.name === "AbortError") {
          throw new Error("Request timed out after 15 seconds")
        }

        throw fetchError
      }
    } catch (error: any) {
      console.error("Error fetching recent home runs:", error)
      setHomeRunsError(error.message || "Unable to load recent home runs")
      // Make sure we set an empty array so we don't try to render undefined
      setRecentHomeRuns([])
    } finally {
      setIsLoadingHomeRuns(false)
    }
  }

  const refreshHomeRuns = async () => {
    if (isRefreshingHomeRuns) return

    setIsRefreshingHomeRuns(true)
    try {
      await fetchRecentHomeRuns(teams)
    } finally {
      setIsRefreshingHomeRuns(false)
    }
  }

  // Add a debug function after the fetchRecentHomeRuns function
  const debugHomeRuns = async () => {
    setIsDebugging(true)
    try {
      // Get all players from the user's teams
      const userPlayers = teams.flatMap((team) => [
        team.players.tier1Player,
        team.players.tier2Player,
        team.players.tier3Player,
        team.players.wildcard1,
        team.players.wildcard2,
        team.players.wildcard3,
      ])

      // Get unique player IDs
      const uniquePlayerIds = [...new Set(userPlayers.map((player) => player?.id).filter(Boolean))]

      if (uniquePlayerIds.length === 0) {
        setDebugInfo({ error: "No player IDs found in your teams" })
        return
      }

      // Call our debug endpoint
      const response = await fetch(`/api/debug-home-runs?playerIds=${uniquePlayerIds.join(",")}&days=7`)
      const data = await response.json()
      setDebugInfo(data)

      // Try the regular endpoint with debug flag
      const regularResponse = await fetch(`/api/real-home-runs?playerIds=${uniquePlayerIds.join(",")}&debug=true`)
      const regularData = await regularResponse.json()
      setDebugInfo((prev) => ({ ...prev, regularApiResponse: regularData }))
    } catch (error) {
      setDebugInfo({ error: error.message || "Error during debugging" })
    } finally {
      setIsDebugging(false)
    }
  }

  // Fetch longest home run data from MLB API
  const fetchLongestHomeRun = async () => {
    try {
      setLongestHomeRun((prev) => ({ ...prev, isLoading: true, error: undefined }))

      const response = await fetch("/api/longest-home-run")

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setLongestHomeRun({
          ...data.data,
          isLoading: false,
        })
      } else {
        throw new Error(data.error || "Failed to fetch longest home run data")
      }
    } catch (error) {
      console.error("Error fetching longest home run data:", error)
      setLongestHomeRun({
        distance: 0,
        player: "",
        team: "",
        isLoading: false,
        error: error.message || "Failed to load data",
      })
    }
  }

  const getBestRank = () => {
    const ranks = teams.map((team) => team.rank).filter((rank) => rank !== undefined) as number[]
    return ranks.length > 0 ? Math.min(...ranks) : 1 // Default to 1st if no ranks
  }

  const getBestTeamName = () => {
    if (teams.length === 0) return ""

    let bestTeam = teams[0]
    let bestRank = bestTeam.rank || Number.MAX_SAFE_INTEGER

    for (const team of teams) {
      if (team.rank && team.rank < bestRank) {
        bestRank = team.rank
        bestTeam = team
      }
    }

    return bestTeam.teamName
  }

  const getTotalHomeRuns = () => {
    return teams.reduce((total, team) => total + calculateTeamHomeRuns(team), 0)
  }

  // Function to get the start of the current week (Monday)
  const getStartOfWeek = () => {
    const now = new Date()
    const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(now.setDate(diff))
  }

  // Replace the formatDate function with this improved version:
  const formatDate = (timestamp: any) => {
    try {
      // Get a JavaScript Date object regardless of the input format
      let date: Date

      if (timestamp?.toDate && typeof timestamp.toDate === "function") {
        // Handle Firestore Timestamp objects
        date = timestamp.toDate()
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp)
      } else if (timestamp && typeof timestamp === "object") {
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
          date = timestamp.toDate()
        } else {
          date = new Date()
        }
      } else {
        date = new Date()
      }

      // Get current date with time set to midnight
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Get yesterday with time set to midnight
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Get the date to compare with time set to midnight
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

      // Compare dates
      if (compareDate.getTime() === today.getTime()) {
        return "Today"
      } else if (compareDate.getTime() === yesterday.getTime()) {
        return "Yesterday"
      } else {
        // Calculate days difference
        const diffTime = today.getTime() - compareDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return `${diffDays} days ago`
      }
    } catch (error) {
      console.error("Error in formatDate:", error)
      return "Recently"
    }
  }

  // Generate a video link for a home run
  const getVideoLink = (hr: HomeRun) => {
    if (hr.videoLink) return hr.videoLink

    // Use the exact MLB video search format with just the player name
    return `https://www.mlb.com/video/?q=${hr.playerName.replace(/ /g, "+")}&qt=FREETEXT`
  }

  // Helper function to get all player IDs from teams
  const getAllPlayerIds = () => {
    const allPlayerIds = new Set<string>()

    teams.forEach((team) => {
      if (team.players) {
        if (team.players.tier1Player?.id) allPlayerIds.add(team.players.tier1Player.id)
        if (team.players.tier2Player?.id) allPlayerIds.add(team.players.tier2Player.id)
        if (team.players.tier3Player?.id) allPlayerIds.add(team.players.tier3Player.id)
        if (team.players.wildcard1?.id) allPlayerIds.add(team.players.wildcard1.id)
        if (team.players.wildcard2?.id) allPlayerIds.add(team.players.wildcard2.id)
        if (team.players.wildcard3?.id) allPlayerIds.add(team.players.wildcard3.id)
      }
    })

    return [...allPlayerIds]
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Loading your dashboard...</h2>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <div className="flex items-center">
          <BeerIcon className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-4xl font-bold">Dashboard</h1>
        </div>
        <div className="flex justify-between items-center mt-2">
          <Button asChild variant="outline">
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      {teams.length === 0 && (
        <div className="bg-primary/10 p-4 sm:p-6 rounded-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Get Started with Your First Team</h2>
            <p className="text-muted-foreground">Create your first team to join the Homerun Fantasy competition</p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/create-team">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Team
            </Link>
          </Button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-1">Your Teams</h3>
                <p className="text-muted-foreground">Active teams</p>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{teams.length}</span>
                </div>
              </div>
              <div className="bg-muted rounded-full p-2">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6">
              {teams.length >= 3 ? (
                <div className="text-center">
                  <Button disabled variant="outline" className="w-full mb-2">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Another Team
                  </Button>
                  <p className="text-xs text-muted-foreground">Maximum of 3 teams reached</p>
                </div>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/create-team">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Another Team
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-1">Highest Ranked Team</h3>
                <p className="text-muted-foreground">{getBestTeamName() || "Your team"}</p>
                <div className="mt-4">
                  <span className="text-5xl font-bold">
                    {getBestRank() === 1
                      ? "1st"
                      : getBestRank() === 2
                        ? "2nd"
                        : getBestRank() === 3
                          ? "3rd"
                          : `${getBestRank()}th`}
                  </span>
                </div>
              </div>
              <div className="bg-muted rounded-full p-2">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6">
              <Button asChild variant="outline" className="w-full">
                <Link href="/leaderboards">
                  <Trophy className="mr-2 h-4 w-4" />
                  View Leaderboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-1 flex items-center">
                  Total Home Runs in 2025
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total home runs from all your teams in the 2025 season.</p>
                        <p>Weekly stats reset every Monday.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                <p className="text-muted-foreground">+{weeklyHRChange} from last week</p>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{getTotalHomeRuns()}</span>
                </div>
              </div>
              <div className="bg-muted rounded-full p-2">
                <BarChart2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-1">Longest Home Run</h3>
                {longestHomeRun.isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
                ) : longestHomeRun.error ? (
                  <p className="text-muted-foreground">Unable to load data</p>
                ) : (
                  <p className="text-muted-foreground">
                    {longestHomeRun.player} ({longestHomeRun.team})
                  </p>
                )}
                <div className="mt-4">
                  {longestHomeRun.isLoading ? (
                    <div className="h-12 flex items-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : longestHomeRun.error ? (
                    <span className="text-5xl font-bold">--'</span>
                  ) : (
                    <span className="text-5xl font-bold">{longestHomeRun.distance}'</span>
                  )}
                </div>
                {longestHomeRun.videoLink && !longestHomeRun.isLoading && !longestHomeRun.error && (
                  <a
                    href={longestHomeRun.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Watch video
                  </a>
                )}
              </div>
              <div className="bg-muted rounded-full p-2">
                <Ruler className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Details and Recent Home Runs */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Your Teams</h3>
              <div className="bg-muted rounded-full p-2">
                <BeerIcon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-muted-foreground mb-4">Home run breakdown by team for 2025 season</p>

            {teams.length > 0 ? (
              <div className="space-y-6">
                {teams.map((team) => (
                  <div key={team.id}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-2">
                      <h4 className="text-lg font-bold">{team.teamName}</h4>
                      <span className="font-bold text-sm sm:text-base">
                        {calculateTeamHomeRuns(team)} HRs (
                        {team.rank !== undefined
                          ? `${team.rank}${team.rank === 1 ? "st" : team.rank === 2 ? "nd" : team.rank === 3 ? "rd" : "th"} Place`
                          : "Unranked"}
                        )
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="truncate mr-2">
                          {team.players.tier1Player?.name}{" "}
                          <span className="text-xs text-muted-foreground">(Tier 1)</span>
                        </span>
                        <span className="font-medium whitespace-nowrap">{team.playerHRs?.[0] || 0} HRs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="truncate mr-2">
                          {team.players.tier2Player?.name}{" "}
                          <span className="text-xs text-muted-foreground">(Tier 2)</span>
                        </span>
                        <span className="font-medium whitespace-nowrap">{team.playerHRs?.[1] || 0} HRs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="truncate mr-2">
                          {team.players.tier3Player?.name}{" "}
                          <span className="text-xs text-muted-foreground">(Tier 3)</span>
                        </span>
                        <span className="font-medium whitespace-nowrap">{team.playerHRs?.[2] || 0} HRs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="truncate mr-2">
                          {team.players.wildcard1?.name}{" "}
                          <span className="text-xs text-muted-foreground">(Wild Card)</span>
                        </span>
                        <span className="font-medium whitespace-nowrap">{team.playerHRs?.[3] || 0} HRs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="truncate mr-2">
                          {team.players.wildcard2?.name}{" "}
                          <span className="text-xs text-muted-foreground">(Wild Card)</span>
                        </span>
                        <span className="font-medium whitespace-nowrap">{team.playerHRs?.[4] || 0} HRs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="truncate mr-2">
                          {team.players.wildcard3?.name}{" "}
                          <span className="text-xs text-muted-foreground">(Wild Card)</span>
                        </span>
                        <span className="font-medium whitespace-nowrap">{team.playerHRs?.[5] || 0} HRs</span>
                      </div>
                    </div>

                    {teams.indexOf(team) < teams.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't created any teams yet</p>
                <Button asChild>
                  <Link href="/create-team">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Team
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Recent Home Runs</h3>
              <div className="bg-muted rounded-full p-2">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-muted-foreground mb-4">Home runs hit by your players in the last few days</p>

            {isLoadingHomeRuns ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading recent home runs...</p>
              </div>
            ) : (
              <RealHomeRunsWidget playerIds={getAllPlayerIds()} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
