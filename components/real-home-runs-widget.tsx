"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, AlertCircle, Info } from "lucide-react"
import { Separator } from "../components/ui/separator"

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

interface Player {
  id: string
  name: string
  team: string
  hr2025: number
  position?: string
}

interface RealHomeRunsWidgetProps {
  playerIds: string[]
}

export function RealHomeRunsWidget({ playerIds }: RealHomeRunsWidgetProps) {
  const [recentHomeRuns, setRecentHomeRuns] = useState<HomeRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchHomeRuns()
  }, [playerIds])

  const fetchHomeRuns = async () => {
    if (!playerIds || playerIds.length === 0) {
      setRecentHomeRuns([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Add timeout to the fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(`/api/real-home-runs?playerIds=${playerIds.join(",")}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setRecentHomeRuns(data.homeRuns || [])
      } else {
        throw new Error(data.message || "Failed to fetch home run data")
      }
    } catch (error: any) {
      console.error("Error fetching recent home runs:", error)
      setError(error.message || "Unable to load recent home runs")
      setRecentHomeRuns([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshHomeRuns = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await fetchHomeRuns()
    } finally {
      setIsRefreshing(false)
    }
  }

  const debugHomeRuns = async () => {
    setIsDebugging(true)
    try {
      // Get all players from the user's teams
      const uniquePlayerIds = playerIds

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
      setDebugInfo((prev: any) => ({ ...prev, regularApiResponse: regularData }))
    } catch (error: any) {
      setDebugInfo({ error: error.message || "Error during debugging" })
    } finally {
      setIsDebugging(false)
    }
  }

  // Format date for display
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
    return `https://www.mlb.com/video/?q=${hr.playerName.replace(/ /g, "+")}&qt=FREETEXT`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading recent home runs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <p className="font-medium mb-2">No Home Runs in 2025</p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          None of your players have hit home runs in the 2025 season yet. Check back later for updates!
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={refreshHomeRuns} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={debugHomeRuns} disabled={isDebugging}>
            {isDebugging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Debugging...
              </>
            ) : (
              <>
                <Info className="mr-2 h-4 w-4" />
                Debug API
              </>
            )}
          </Button>
        </div>
        {debugInfo && (
          <div className="mt-4 text-left bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs w-full">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }

  if (recentHomeRuns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <p className="font-medium mb-2">No Home Runs in 2025</p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          None of your players have hit home runs in the 2025 season yet. Check back later for updates!
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={refreshHomeRuns} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={debugHomeRuns} disabled={isDebugging}>
            {isDebugging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Debugging...
              </>
            ) : (
              <>
                <Info className="mr-2 h-4 w-4" />
                Debug API
              </>
            )}
          </Button>
        </div>
        {debugInfo && (
          <div className="mt-4 text-left bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs w-full">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-4">Home runs hit by your players in the 2025 season</p>
      {/* Show recent home runs (last 7 days) */}
      {recentHomeRuns.slice(0, 5).map((hr, index) => (
        <div key={index} className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h4 className="font-bold text-lg">{hr.playerName}</h4>
              <div className="flex items-center">
                <p className="text-muted-foreground">
                  {hr.playerTeam} vs {hr.opponent} - {formatDate(hr.date)}
                </p>
                <a
                  href={getVideoLink(hr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="sr-only">Watch video</span>
                </a>
              </div>
            </div>
            <span className="text-green-500 font-medium whitespace-nowrap">+1 HR</span>
          </div>
          {index < Math.min(recentHomeRuns.length - 1, 4) && <Separator className="my-4" />}
        </div>
      ))}

      <div className="flex justify-center mt-4">
        <Button variant="outline" size="sm" onClick={refreshHomeRuns} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>
    </div>
  )
}
