"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Loader2, RefreshCw, ArrowLeft, LogOut } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import Link from "next/link"

export default function DebugStatsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<any>(null)

  const [isTestingMlb, setIsTestingMlb] = useState(false)
  const [mlbResult, setMlbResult] = useState<any>(null)

  const triggerUpdate = async () => {
    setIsUpdating(true)
    setUpdateResult(null)

    try {
      // Use the standalone endpoint instead
      const response = await fetch("/api/standalone-update-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to update stats: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setUpdateResult(data)
    } catch (error) {
      console.error("Error updating stats:", error)
      setUpdateResult({ error: error instanceof Error ? error.message : "An unknown error occurred" })
    } finally {
      setIsUpdating(false)
    }
  }

  const testMlbData = async () => {
    setIsTestingMlb(true)
    setMlbResult(null)

    try {
      // Use the standalone endpoint instead
      const response = await fetch("/api/standalone-mlb-data")

      if (!response.ok) {
        throw new Error(`Failed to fetch MLB data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setMlbResult(data)
    } catch (error) {
      setMlbResult({ error: error instanceof Error ? error.message : "An unknown error occurred" })
    } finally {
      setIsTestingMlb(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Debug Stats</h1>
          <p className="text-muted-foreground">Test and debug stats endpoints</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update Team Stats</CardTitle>
            <CardDescription>Manually trigger a stats update for all teams</CardDescription>
          </CardHeader>
          <CardContent>
            {updateResult && (
              <Alert className="mb-4" variant={updateResult.error ? "destructive" : "default"}>
                <AlertTitle>{updateResult.error ? "Error" : "Success"}</AlertTitle>
                <AlertDescription>
                  {updateResult.error || updateResult.message || "Stats updated successfully"}

                  {updateResult.teams && updateResult.teams.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p>Updated {updateResult.teams.length} teams</p>
                      <p>Data Source: {updateResult.dataSource}</p>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {updateResult.teams.map((team: any, index: number) => (
                          <div key={index} className="py-1 border-t border-border/30">
                            {team.name}: {team.previousHR} → {team.newHR} HRs
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={triggerUpdate} disabled={isUpdating} className="w-full">
              {isUpdating ? (
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
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test MLB Data</CardTitle>
            <CardDescription>Check if MLB data is being fetched correctly</CardDescription>
          </CardHeader>
          <CardContent>
            {mlbResult && (
              <Alert className="mb-4" variant={mlbResult.error ? "destructive" : "default"}>
                <AlertTitle>{mlbResult.error ? "Error" : "Success"}</AlertTitle>
                <AlertDescription>
                  {mlbResult.error ? mlbResult.error : `Found ${mlbResult.allPlayers?.length || 0} players`}

                  {mlbResult.allPlayers && mlbResult.allPlayers.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p>Source: {mlbResult.source}</p>
                      <p>Last Updated: {mlbResult.lastUpdated}</p>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        <p className="font-medium">Sample Players:</p>
                        {mlbResult.allPlayers.slice(0, 10).map((player, index) => (
                          <div key={index} className="py-1 border-t border-border/30">
                            {player.name} ({player.team}): {player.hr2025} HRs
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={testMlbData} disabled={isTestingMlb} className="w-full">
              {isTestingMlb ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing MLB Data...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test MLB Data
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
