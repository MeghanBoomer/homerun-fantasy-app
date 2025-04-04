"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { db, auth } from "../../lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Loader2, Trophy, AlertCircle, Users, ArrowLeft, ChevronLeft, ChevronRight, Info, Star } from "lucide-react"
import { Button } from "../../components/ui/button"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { Separator } from "../../components/ui/separator"
import { onAuthStateChanged } from "firebase/auth"

interface Player {
  id: string
  name: string
  team: string
  hr2024: number
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
}

export default function LeaderboardsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [displayedTeams, setDisplayedTeams] = useState<Team[]>([])
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const teamsPerPage = 10

  // Get the upcoming season year (current year + 1 if we're past the World Series, which typically ends in October)
  const getUpcomingSeasonYear = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-based, so 9 = October

    // If we're in November or December, show next year's season
    return currentMonth >= 10 ? currentYear + 1 : currentYear
  }

  const upcomingSeasonYear = getUpcomingSeasonYear()

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
      } else {
        setCurrentUserId(null)
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

  const fetchTeams = async () => {
    setIsLoading(true)
    try {
      // Simplified query - just get all teams without filtering or sorting
      const teamsQuery = query(collection(db, "teams"))
      const querySnapshot = await getDocs(teamsQuery)

      const teamsData: Team[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Team, "id">

        // For demonstration, let's add some mock actual HR data
        const mockActualHR = Math.floor(Math.random() * 30) + 10

        teamsData.push({
          id: doc.id,
          ...data,
          actualHR: mockActualHR, // Mock data for demonstration
        } as Team)
      })

      console.log("Fetched teams:", teamsData.length)

      // Sort by actualHR in descending order
      teamsData.sort((a, b) => (b.actualHR || 0) - (a.actualHR || 0))

      // Add rank to each team
      const rankedTeams = teamsData.map((team, index) => ({
        ...team,
        rank: index + 1,
      }))

      setTeams(rankedTeams)
      setError("")
    } catch (error: any) {
      console.error("Error fetching teams:", error)
      setError("Failed to load leaderboard data. Please try again later.")

      // Use mock data if Firestore fails
      const mockTeams = generateMockTeams(25)
      setTeams(mockTeams)
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

  // Generate mock teams for testing
  const generateMockTeams = (count: number): Team[] => {
    const mockTeams: Team[] = []
    const teamNames = [
      "Betting on Betts",
      "Home Run Heroes",
      "Diamond Kings",
      "Power Hitters",
      "Grand Slammers",
      "Bronx Bombers",
      "Slugger Squad",
      "Fence Busters",
      "Dinger Dynasty",
      "Yard Work",
      "Long Ball Legends",
      "Out of the Park",
      "Blast Masters",
      "Homer Homies",
      "Swing Kings",
      "Bat Crushers",
      "Ball Bashers",
      "Moonshot Maniacs",
      "Clutch Crushers",
      "Deep Threat",
    ]

    const userEmails = [
      "john.doe@example.com",
      "jane.smith@example.com",
      "mike.jones@example.com",
      "sarah.wilson@example.com",
      "david.brown@example.com",
      "current.user@example.com",
    ]

    for (let i = 0; i < count; i++) {
      const isUserTeam = i < 3 // Make the first 3 teams belong to the current user
      const actualHR = Math.floor(Math.random() * 50) + 30

      mockTeams.push({
        id: `mock-team-${i}`,
        teamName:
          teamNames[i % teamNames.length] + (i >= teamNames.length ? ` ${Math.floor(i / teamNames.length) + 1}` : ""),
        userId: isUserTeam ? "current-user-id" : `user-${i}`,
        userEmail: isUserTeam ? "current.user@example.com" : userEmails[i % (userEmails.length - 1)],
        isPaid: Math.random() > 0.2, // 80% chance of being paid
        createdAt: { toDate: () => new Date(Date.now() - i * 86400000) },
        totalHR: 150 - i * 2,
        actualHR: actualHR,
        rank: i + 1,
        players: {
          tier1Player: { id: "t1p1", name: "Aaron Judge", team: "NYY", hr2024: 54, position: "RF" },
          tier2Player: { id: "t2p1", name: "Mike Trout", team: "LAA", hr2024: 40, position: "CF" },
          tier3Player: { id: "t3p1", name: "Rafael Devers", team: "BOS", hr2024: 34, position: "3B" },
          wildcard1: { id: "wp1", name: "Ronald Acuña Jr.", team: "ATL", hr2024: 15, position: "RF" },
          wildcard2: { id: "wp2", name: "Fernando Tatis Jr.", team: "SD", hr2024: 25, position: "RF" },
          wildcard3: { id: "wp3", name: "Julio Rodríguez", team: "SEA", hr2024: 22, position: "CF" },
        },
      })
    }

    // Set current user ID for mock data
    setCurrentUserId("current-user-id")

    // Set user teams
    setUserTeams(mockTeams.filter((team) => team.userId === "current-user-id"))

    return mockTeams
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
          <h1 className="text-4xl font-bold mb-2">Leaderboards</h1>
          <p className="text-muted-foreground">Track all teams in the Homerun Fantasy league</p>
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
                    <th className="text-right py-3 px-4 font-medium">Home Runs</th>
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
                      <td className="py-3 px-4 text-right font-medium">{team.actualHR || 0}</td>
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
                                    <span className="font-medium">{Math.floor(Math.random() * 15) + 1} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.tier2Player?.name} (T2)</span>
                                    <span className="font-medium">{Math.floor(Math.random() * 10) + 1} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.tier3Player?.name} (T3)</span>
                                    <span className="font-medium">{Math.floor(Math.random() * 8) + 1} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.wildcard1?.name} (WC)</span>
                                    <span className="font-medium">{Math.floor(Math.random() * 6) + 1} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.wildcard2?.name} (WC)</span>
                                    <span className="font-medium">{Math.floor(Math.random() * 5) + 1} HR</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>{team.players.wildcard3?.name} (WC)</span>
                                    <span className="font-medium">{Math.floor(Math.random() * 4) + 1} HR</span>
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
              <CardDescription>Teams ranked by home runs for the {upcomingSeasonYear} season</CardDescription>
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
                No teams have been registered yet for the {upcomingSeasonYear} season
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
                      <th className="text-right py-3 px-4 font-medium">Home Runs</th>
                      <th className="text-center py-3 px-4 font-medium w-10">Details</th>
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
                          <td className="py-3 px-4 text-right font-medium">{team.actualHR || 0}</td>
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
                                        <span className="font-medium">{Math.floor(Math.random() * 15) + 1} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.tier2Player?.name} (T2)</span>
                                        <span className="font-medium">{Math.floor(Math.random() * 10) + 1} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.tier3Player?.name} (T3)</span>
                                        <span className="font-medium">{Math.floor(Math.random() * 8) + 1} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.wildcard1?.name} (WC)</span>
                                        <span className="font-medium">{Math.floor(Math.random() * 6) + 1} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.wildcard2?.name} (WC)</span>
                                        <span className="font-medium">{Math.floor(Math.random() * 5) + 1} HR</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{team.players.wildcard3?.name} (WC)</span>
                                        <span className="font-medium">{Math.floor(Math.random() * 4) + 1} HR</span>
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

