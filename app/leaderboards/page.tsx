"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { db, auth } from "../../lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import {
  Loader2,
  Trophy,
  AlertCircle,
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Star,
  BeerIcon,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { Separator } from "../../components/ui/separator"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

interface Player {
  id: string
  name: string
  team: string
  hr2025: number // Explicitly using 2025 data
  position?: string
}

interface Team {
  id: string
  teamName: string
  userId: string
  userEmail: string
  isPaid: boolean
  createdAt: any
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
  lastUpdated?: any
}

export default function LeaderboardsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [displayedTeams, setDisplayedTeams] = useState<Team[]>([])
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const teamsPerPage = 10

  const router = useRouter()

  // Get the current season year - explicitly set to 2025
  const getCurrentSeasonYear = () => {
    return 2025 // Explicitly set to 2025 for the current season
  }

  const currentSeasonYear = getCurrentSeasonYear()

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid)

        // Skip admin check for now - we'll assume non-admin to avoid permission errors
        setIsAdmin(false)
      } else {
        setCurrentUserId(null)
        setIsAdmin(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [])

  // When currentPage changes, update displayed teams
  useEffect(() => {
    updateDisplayedTeams()
  }, [currentPage, teams, currentUserId])

  // Auto-refresh stats every 60 seconds
  useEffect(() => {
    const refreshStats = async () => {
      console.log("Auto-refreshing stats...")
      router.refresh() // This will cause the page to re-fetch data from the server
      fetchTeams()
    }

    // Initial refresh
    refreshStats()

    // Set up interval for future refreshes
    const intervalId = setInterval(refreshStats, 60000) // 60 seconds

    return () => clearInterval(intervalId)
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

  const fetchTeams = async () => {
    setIsLoading(true)
    try {
      // Simplified query - just get all teams without filtering or sorting
      const teamsQuery = query(collection(db, "teams"))
      const querySnapshot = await getDocs(teamsQuery)

      const teamsData: Team[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Team, "id">
        teamsData.push({
          id: doc.id,
          ...data,
        } as Team)
      })

      console.log("Fetched teams:", teamsData.length)

      // Calculate total HRs for each team
      const teamsWithCalculatedHRs = teamsData.map((team) => {
        const totalHRs = calculateTeamHomeRuns(team)
        console.log(
          `Team ${team.teamName}: Total HRs = ${totalHRs}, playerHRs = ${JSON.stringify(team.playerHRs || [])}`,
        )
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

      // Get the most recent update timestamp
      if (teamsData.length > 0 && teamsData[0].lastUpdated) {
        const timestamp = teamsData[0].lastUpdated.toDate ? teamsData[0].lastUpdated.toDate() : new Date()
        setLastUpdated(
          timestamp.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        )
      }

      setTeams(rankedTeams)
      setError("")
    } catch (error: any) {
      console.error("Error fetching teams:", error)
      setError("Failed to load leaderboard data. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateDisplayedTeams = () => {
    if (teams.length === 0) return

    // Don't filter by isPaid status - show all teams
    const filteredTeams = [...teams]

    // Identify user teams
    if (currentUserId) {
      const userOwnedTeams = teams.filter((team) => team.userId === currentUserId)
      setUserTeams(userOwnedTeams)
      console.log("Found user teams:", userOwnedTeams.length)
    } else {
      setUserTeams([])
    }

    // Paginate
    const startIndex = (currentPage - 1) * teamsPerPage
    const endIndex = startIndex + teamsPerPage
    setDisplayedTeams(filteredTeams.slice(startIndex, endIndex))
  }

  const handleNextPage = () => {
    if (currentPage * teamsPerPage < teams.length) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const formatOwnerName = (email: string) => {
    // Extract name from email (before @)
    const name = email.split("@")[0]

    // Capitalize first letter of each word
    return name
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (isLoading && teams.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Loading leaderboard data...</h2>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center">
            <BeerIcon className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-4xl font-bold">Leaderboards</h1>
          </div>
          <div className="flex flex-col mt-2">
            <p className="text-muted-foreground">Track all teams in the Homerun Fantasy league</p>
            {lastUpdated && (
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <p>Stats last updated: {lastUpdated}</p>
                <div className="ml-2 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full mr-1 bg-green-500"></span>
                  <span>Auto-updating</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* User's Teams Section - Separate Card */}
      {userTeams.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500 fill-yellow-500" />
              <CardTitle>Your Teams</CardTitle>
            </div>
            <CardDescription>Quick view of your teams and their rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 font-medium">Team</th>
                    <th className="text-right py-3 px-4 font-medium">{currentSeasonYear} HRs</th>
                    <th className="text-center py-3 px-4 font-medium w-10">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {userTeams.map((team) => (
                    <tr key={team.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {team.rank && team.rank <= 3 && (
                            <Trophy
                              className={`h-4 w-4 mr-1.5 ${
                                team.rank === 1
                                  ? "text-yellow-500"
                                  : team.rank === 2
                                    ? "text-gray-400"
                                    : "text-amber-700"
                              }`}
                            />
                          )}
                          <span className={team.rank && team.rank <= 3 ? "font-bold" : ""}>{team.rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {team.teamName}
                        {!team.isPaid && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Unpaid
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{calculateTeamHomeRuns(team)}</td>
                      <td className="py-3 px-4 text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Info className="h-4 w-4" />
                                <span className="sr-only">Team Details</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="w-80 p-0">
                              <div className="p-4">
                                <h4 className="font-bold mb-2">{team.teamName}</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Owner: {formatOwnerName(team.userEmail)}
                                </p>
                                <Separator className="my-2" />
                                <div className="space-y-1.5 mt-3">
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.tier1Player?.name} (T1)</span>
                                    <span className="font-medium">{team.playerHRs?.[0] || 0} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.tier2Player?.name} (T2)</span>
                                    <span className="font-medium">{team.playerHRs?.[1] || 0} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.tier3Player?.name} (T3)</span>
                                    <span className="font-medium">{team.playerHRs?.[2] || 0} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.wildcard1?.name} (WC)</span>
                                    <span className="font-medium">{team.playerHRs?.[3] || 0} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.wildcard2?.name} (WC)</span>
                                    <span className="font-medium">{team.playerHRs?.[4] || 0} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.wildcard3?.name} (WC)</span>
                                    <span className="font-medium">{team.playerHRs?.[5] || 0} HR</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Leaderboard - Separate Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>HR Team Leaderboard</CardTitle>
              <CardDescription>Teams ranked by home runs for the {currentSeasonYear} season</CardDescription>
            </div>
            <Badge variant="outline" className="ml-2">
              <Users className="h-3.5 w-3.5 mr-1" />
              {teams.length} Teams
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {teams.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Teams Found</h3>
              <p className="text-muted-foreground">
                No teams have been registered yet for the {currentSeasonYear} season
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Team</th>
                      <th className="text-left py-3 px-4 font-medium">Owner</th>
                      <th className="text-right py-3 px-4 font-medium">{currentSeasonYear} HRs</th>
                      <th className="text-center py-3 px-4 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTeams.map((team, index) => {
                      const isCurrentUserTeam = team.userId === currentUserId
                      const displayRank = team.rank || index + 1 + (currentPage - 1) * teamsPerPage

                      return (
                        <tr
                          key={team.id}
                          className={`border-b hover:bg-muted/50 ${isCurrentUserTeam ? "bg-primary/5" : ""}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {displayRank <= 3 && (
                                <Trophy
                                  className={`h-4 w-4 mr-1.5 ${
                                    displayRank === 1
                                      ? "text-yellow-500"
                                      : displayRank === 2
                                        ? "text-gray-400"
                                        : "text-amber-700"
                                  }`}
                                />
                              )}
                              <span className={displayRank <= 3 ? "font-bold" : ""}>{displayRank}</span>
                              {isCurrentUserTeam && <Star className="h-3.5 w-3.5 ml-1.5 text-primary fill-primary" />}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {team.teamName}
                            {!team.isPaid && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Unpaid
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{formatOwnerName(team.userEmail)}</td>
                          <td className="py-3 px-4 text-right font-medium">{calculateTeamHomeRuns(team)}</td>
                          <td className="py-3 px-4 text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Info className="h-4 w-4" />
                                    <span className="sr-only">Team Details</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="w-80 p-0">
                                  <div className="p-4">
                                    <h4 className="font-bold mb-2">{team.teamName}</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                      Owner: {formatOwnerName(team.userEmail)}
                                    </p>
                                    <Separator className="my-2" />
                                    <div className="space-y-1.5 mt-3">
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.tier1Player?.name} (T1)</span>
                                        <span className="font-medium">{team.playerHRs?.[0] || 0} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.tier2Player?.name} (T2)</span>
                                        <span className="font-medium">{team.playerHRs?.[1] || 0} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.tier3Player?.name} (T3)</span>
                                        <span className="font-medium">{team.playerHRs?.[2] || 0} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.wildcard1?.name} (WC)</span>
                                        <span className="font-medium">{team.playerHRs?.[3] || 0} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.wildcard2?.name} (WC)</span>
                                        <span className="font-medium">{team.playerHRs?.[4] || 0} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.wildcard3?.name} (WC)</span>
                                        <span className="font-medium">{team.playerHRs?.[5] || 0} HR</span>
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {displayedTeams.length > 0 ? (currentPage - 1) * teamsPerPage + 1 : 0} -{" "}
                  {(currentPage - 1) * teamsPerPage + displayedTeams.length} of {teams.length} teams
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1 || isLoading}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage * teamsPerPage >= teams.length || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
