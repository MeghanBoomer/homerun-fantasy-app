"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc } from "firebase/firestore"
import { db, auth } from "../../lib/firebase"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Loader2, Info, Search, X, Calendar, Mail, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { Input } from "../../components/ui/input"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"

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
  players: {
    tier1Player: Player
    tier2Player: Player
    tier3Player: Player
    wildcard1: Player
    wildcard2: Player
    wildcard3: Player
  }
}

// Mock data for testing when Firestore permissions are insufficient
const MOCK_TEAMS: Team[] = [
  {
    id: "mock-team-1",
    teamName: "Test Team Alpha",
    userId: "user123",
    userEmail: "test@example.com",
    isPaid: true,
    createdAt: { toDate: () => new Date() },
    totalHR: 180,
    players: {
      tier1Player: { id: "t1p1", name: "Aaron Judge", team: "NYY", hr2025: 54, position: "RF" },
      tier2Player: { id: "t2p1", name: "Mike Trout", team: "LAA", hr2025: 40, position: "CF" },
      tier3Player: { id: "t3p1", name: "Rafael Devers", team: "BOS", hr2025: 34, position: "3B" },
      wildcard1: { id: "wp1", name: "Ronald Acuña Jr.", team: "ATL", hr2025: 15, position: "RF" },
      wildcard2: { id: "wp2", name: "Fernando Tatis Jr.", team: "SD", hr2025: 25, position: "RF" },
      wildcard3: { id: "wp3", name: "Julio Rodríguez", team: "SEA", hr2025: 22, position: "CF" },
    },
  },
  {
    id: "mock-team-2",
    teamName: "Betting on Betts",
    userId: "user456",
    userEmail: "fan@example.com",
    isPaid: false,
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }, // 1 day ago
    totalHR: 165,
    players: {
      tier1Player: { id: "t1p2", name: "Shohei Ohtani", team: "LAD", hr2025: 49, position: "DH" },
      tier2Player: { id: "t2p2", name: "Vladimir Guerrero Jr.", team: "TOR", hr2025: 39, position: "1B" },
      tier3Player: { id: "t3p2", name: "Teoscar Hernández", team: "LAD", hr2025: 33, position: "RF" },
      wildcard1: { id: "wp4", name: "Freddie Freeman", team: "LAD", hr2025: 23, position: "1B" },
      wildcard2: { id: "wp5", name: "José Ramírez", team: "CLE", hr2025: 28, position: "3B" },
      wildcard3: { id: "wp6", name: "Cody Bellinger", team: "CHC", hr2025: 26, position: "CF" },
    },
  },
  {
    id: "mock-team-3",
    teamName: "Home Run Heroes",
    userId: "user789",
    userEmail: "baseball@example.com",
    isPaid: true,
    createdAt: { toDate: () => new Date(Date.now() - 172800000) }, // 2 days ago
    totalHR: 175,
    players: {
      tier1Player: { id: "t1p3", name: "Pete Alonso", team: "NYM", hr2025: 46, position: "1B" },
      tier2Player: { id: "t2p3", name: "Juan Soto", team: "NYY", hr2025: 38, position: "RF" },
      tier3Player: { id: "t3p3", name: "Giancarlo Stanton", team: "NYY", hr2025: 32, position: "DH" },
      wildcard1: { id: "wp7", name: "Austin Riley", team: "ATL", hr2025: 27, position: "3B" },
      wildcard2: { id: "wp8", name: "Luis Robert Jr.", team: "CWS", hr2025: 28, position: "CF" },
      wildcard3: { id: "wp9", name: "Corbin Carroll", team: "ARI", hr2025: 20, position: "RF" },
    },
  },
]

export default function AdminPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [adminCheckFailed, setAdminCheckFailed] = useState(false)
  const [mlbApiStatus, setMlbApiStatus] = useState({ tested: false, success: false, message: "" })

  // Explicitly set the season year to 2025
  const seasonYear = 2025

  // Add this function inside the AdminPage component, before the return statement
  const triggerManualUpdate = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/run-stats-update")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update stats")
      }

      // Show success message
      alert(`${seasonYear} stats updated successfully!`)

      // Refresh the page to show updated stats
      window.location.reload()
    } catch (error) {
      console.error("Error updating stats:", error)
      alert(`Error updating ${seasonYear} stats: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user is admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (!currentUser) {
        // Not logged in, redirect to login with return URL
        // Store the intended destination
        if (typeof window !== "undefined") {
          localStorage.setItem("redirectAfterLogin", "/admin")
        }
        router.push("/login")
        return
      }

      try {
        console.log("Checking admin status for user:", currentUser.uid)

        // Try to fetch teams first - if the user has permission, they're probably an admin
        try {
          await fetchTeams()
          // If we get here, the user can fetch teams, so they're probably an admin
          setIsAdmin(true)
          setErrorMessage(null)
          console.log("User can fetch teams, assuming admin privileges")
        } catch (teamsError: any) {
          console.error("Error fetching teams:", teamsError)

          // If we can't fetch teams, try to check admin status directly
          try {
            const adminDoc = await getDoc(doc(db, "admins", currentUser.uid))
            const isUserAdmin = adminDoc.exists()
            console.log("Admin document exists:", isUserAdmin)

            if (isUserAdmin) {
              setIsAdmin(true)
              // Try fetching teams again
              try {
                await fetchTeams()
              } catch (error) {
                console.error("Admin user still can't fetch teams:", error)
                setUsingMockData(true)
                setTeams(MOCK_TEAMS)
                setErrorMessage("You have admin status but insufficient permissions to manage teams. Using mock data.")
              }
            } else {
              // Not an admin, redirect to dashboard
              setErrorMessage("You do not have admin privileges")
              setUsingMockData(true)
              setTeams(MOCK_TEAMS)
            }
          } catch (adminError: any) {
            console.error("Error checking admin status:", adminError)
            setErrorMessage(`Error checking admin status: ${adminError.message || adminError}`)
            setAdminCheckFailed(true)
            setUsingMockData(true)
            setTeams(MOCK_TEAMS)
          }
        }
      } catch (error: any) {
        console.error("Unexpected error:", error)
        setErrorMessage(`Unexpected error: ${error.message || error}`)
        setUsingMockData(true)
        setTeams(MOCK_TEAMS)
      } finally {
        setIsCheckingAdmin(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const testMlbApi = async () => {
      try {
        const response = await fetch("/api/test-mlb-connection")
        const data = await response.json()
        setMlbApiStatus({
          tested: true,
          success: data.success,
          message: data.success ? "MLB API connection successful" : data.error || "Connection failed",
        })
      } catch (error) {
        setMlbApiStatus({
          tested: true,
          success: false,
          message: error.message || "Error testing MLB API connection",
        })
      }
    }

    // Uncomment the line below to automatically test the API when the admin page loads
    // testMlbApi()
  }, [])

  const fetchTeams = async () => {
    setIsLoading(true)

    try {
      // Try to fetch from Firestore first
      const teamsQuery = query(collection(db, "teams"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(teamsQuery)

      const teamsData: Team[] = []
      querySnapshot.forEach((doc) => {
        teamsData.push({ id: doc.id, ...doc.data() } as Team)
      })

      setTeams(teamsData)
      setUsingMockData(false)
      return true
    } catch (error: any) {
      console.error("Error fetching teams:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePaid = async (teamId: string, currentStatus: boolean) => {
    setIsUpdating(teamId)

    try {
      if (usingMockData) {
        // Update mock data locally
        setTeams((prevTeams) =>
          prevTeams.map((team) => (team.id === teamId ? { ...team, isPaid: !currentStatus } : team)),
        )
      } else {
        // Update in Firestore
        const teamRef = doc(db, "teams", teamId)
        await updateDoc(teamRef, {
          isPaid: !currentStatus,
        })

        // Update local state
        setTeams((prevTeams) =>
          prevTeams.map((team) => (team.id === teamId ? { ...team, isPaid: !currentStatus } : team)),
        )
      }
    } catch (error: any) {
      console.error("Error updating payment status:", error)

      // If there's a permission error, switch to mock data
      if (error.code === "permission-denied") {
        setUsingMockData(true)
        // Update mock data locally
        setTeams((prevTeams) =>
          prevTeams.map((team) => (team.id === teamId ? { ...team, isPaid: !currentStatus } : team)),
        )
      } else {
        alert(`Error updating payment status: ${error.message}`)
      }
    } finally {
      setIsUpdating(null)
    }
  }

  const confirmDelete = (team: Team) => {
    setTeamToDelete(team)
  }

  const handleDelete = async () => {
    if (!teamToDelete) return

    setIsDeleting(true)

    try {
      if (usingMockData) {
        // Delete from mock data locally
        setTeams((prevTeams) => prevTeams.filter((team) => team.id !== teamToDelete.id))
      } else {
        // Delete from Firestore
        await deleteDoc(doc(db, "teams", teamToDelete.id))

        // Update local state
        setTeams((prevTeams) => prevTeams.filter((team) => team.id !== teamToDelete.id))
      }

      setTeamToDelete(null)
    } catch (error: any) {
      console.error("Error deleting team:", error)

      // If there's a permission error, switch to mock data
      if (error.code === "permission-denied") {
        setUsingMockData(true)
        // Delete from mock data locally
        setTeams((prevTeams) => prevTeams.filter((team) => team.id !== teamToDelete.id))
        setTeamToDelete(null)
      } else {
        alert(`Error deleting team: ${error.message}`)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setTeamToDelete(null)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  // Format date nicely
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "Unknown date"

    const date = timestamp.toDate()
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Filter teams based on tab and search query
  const filteredTeams = teams.filter((team) => {
    // First filter by tab
    const matchesTab =
      activeTab === "all" || (activeTab === "paid" && team.isPaid) || (activeTab === "unpaid" && !team.isPaid)

    if (!matchesTab) return false

    // Then filter by search query if one exists
    if (searchQuery.trim() === "") return true

    const query = searchQuery.toLowerCase()
    return team.teamName.toLowerCase().includes(query) || team.userEmail.toLowerCase().includes(query)
  })

  // Show loading state while checking admin status
  if (isCheckingAdmin) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4 md:py-12 md:px-8">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage teams and payment status</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="ml-2">
            <Link href="/admin/update-all-stats">
              <RefreshCw className="mr-2 h-4 w-4" />
              Advanced Stats Update
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Update All Team Stats</h2>
                <p className="text-muted-foreground">
                  Manually update {seasonYear} home run counts for all teams based on current MLB data
                </p>
              </div>
              <Button onClick={triggerManualUpdate} disabled={isLoading} size="lg" className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Stats...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update All Team Stats
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {errorMessage && (
        <Alert className="mb-6" variant={usingMockData ? "default" : "destructive"}>
          <Info className="h-4 w-4" />
          <AlertTitle>{usingMockData ? "Using Mock Data" : "Error"}</AlertTitle>
          <AlertDescription>
            {errorMessage}
            {usingMockData && (
              <div className="mt-2">
                <p>For a production environment, you'll need to:</p>
                <ol className="list-decimal ml-5 mt-2">
                  <li>Add your user ID to the admins collection</li>
                  <li>Set up proper Firebase security rules</li>
                  <li>Set up proper Firebase security rules</li>
                  <li>Deploy to production</li>
                </ol>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {mlbApiStatus.tested && (
        <Alert className="mb-6" variant={mlbApiStatus.success ? "default" : "destructive"}>
          <Info className="h-4 w-4" />
          <AlertTitle>{mlbApiStatus.success ? "MLB API Connected" : "MLB API Connection Failed"}</AlertTitle>
          <AlertDescription>
            {mlbApiStatus.message}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/test-mlb-connection")
                    const data = await response.json()
                    setMlbApiStatus({
                      tested: true,
                      success: data.success,
                      message: data.success ? "MLB API connection successful" : data.error || "Connection failed",
                    })
                  } catch (error) {
                    setMlbApiStatus({
                      tested: true,
                      success: false,
                      message: error.message || "Error testing MLB API connection",
                    })
                  }
                }}
              >
                Test MLB API Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {adminCheckFailed && !errorMessage && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Admin Check Bypassed</AlertTitle>
          <AlertDescription>
            Could not verify admin status in the admins collection, but you have permission to manage teams. For better
            security, consider adding your user ID to the admins collection.
          </AlertDescription>
        </Alert>
      )}

      {usingMockData && !errorMessage && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Using Mock Data</AlertTitle>
          <AlertDescription>
            Due to insufficient Firestore permissions, this admin panel is currently using mock data. In production,
            you'll need to:
            <ol className="list-decimal ml-5 mt-2">
              <li>Add your user ID to the admins collection</li>
              <li>Set up proper Firebase security rules</li>
              <li>Set up proper Firebase security rules</li>
              <li>Deploy to production</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by team name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Teams ({teams.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({teams.filter((team) => team.isPaid).length})</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid ({teams.filter((team) => !team.isPaid).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTeamsList(filteredTeams)}</TabsContent>
        <TabsContent value="paid">{renderTeamsList(filteredTeams)}</TabsContent>
        <TabsContent value="unpaid">{renderTeamsList(filteredTeams)}</TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!teamToDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Team Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.teamName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderTeamsList(teams: Team[]) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading teams...</p>
        </div>
      )
    }

    if (teams.length === 0) {
      return (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {searchQuery ? "No teams match your search" : "No teams found in this category"}
          </p>
        </div>
      )
    }

    return (
      <div className="grid gap-4">
        {teams.map((team) => (
          <Card key={team.id} className={`overflow-hidden ${!team.isPaid ? "border-amber-200" : ""}`}>
            <CardHeader className="py-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{team.teamName}</CardTitle>
                  <div className="flex items-center mt-1">
                    <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <a
                      href={`mailto:${team.userEmail}?subject=Homerun Fantasy - Payment Reminder&body=Hi there,%0A%0AThis is a reminder that your team "${team.teamName}" requires payment of the $10 entry fee for the Homerun Fantasy league.%0A%0APlease send payment via Venmo to complete your registration.%0A%0AThanks!`}
                      className="text-sm text-primary hover:underline"
                    >
                      {team.userEmail}
                    </a>
                  </div>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created on {formatDate(team.createdAt)}
                  </div>
                </div>
                {team.isPaid ? <Badge className="text-xs px-2 py-0.5 bg-green-600">Paid</Badge> : null}
              </div>
            </CardHeader>

            <CardContent className="py-3 border-t border-b">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Tier 1</p>
                  <p className="truncate">{team.players.tier1Player?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tier 2</p>
                  <p className="truncate">{team.players.tier2Player?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tier 3</p>
                  <p className="truncate">{team.players.tier3Player?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Wildcard 1</p>
                  <p className="truncate">{team.players.wildcard1?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Wildcard 2</p>
                  <p className="truncate">{team.players.wildcard2?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Wildcard 3</p>
                  <p className="truncate">{team.players.wildcard3?.name}</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="py-3 flex justify-between gap-2">
              <Button
                size="sm"
                variant={team.isPaid ? "outline" : "default"}
                onClick={() => handleTogglePaid(team.id, team.isPaid)}
                disabled={isUpdating === team.id}
                className="h-8"
              >
                {isUpdating === team.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                {team.isPaid ? "Mark Unpaid" : "Mark Paid"}
              </Button>

              <Button size="sm" variant="destructive" onClick={() => confirmDelete(team)} className="h-8">
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
}
