"use client"

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Loader2, RefreshCw, ArrowLeft, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import Link from "next/link"

export default function DebugPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<any>(null)

  const [isTestingMlb, setIsTestingMlb] = useState(false)
  const [mlbResult, setMlbResult] = useState<any>(null)

  const triggerUpdate = async () => {
    setIsUpdating(true)
    setUpdateResult(null)

    try {
      const response = await fetch("/api/run-stats-update")

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Failed to update stats: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}...`,
        )
      }

      // Safely parse JSON
      let data
      try {
        data = await response.json()
      } catch (error) {
        const jsonError = error as Error
        const responseText = await response.text()
        throw new Error(
          `Failed to parse response as JSON: ${jsonError.message || "Unknown error"}. Response: ${responseText.substring(0, 200)}...`,
        )
      }

      setUpdateResult(data)
    } catch (error) {
      console.error("Error updating stats:", error)
      setUpdateResult({
        error: error instanceof Error ? error.message : "An unknown error occurred",
        stack: error instanceof Error ? error.stack : undefined,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const testMlbData = async () => {
    setIsTestingMlb(true)
    setMlbResult(null)

    try {
      const response = await fetch("/api/standalone-mlb-data")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Failed to fetch MLB data: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}...`,
        )
      }

      try {
        const data = await response.json()
        setMlbResult(data)
      } catch (error) {
        const jsonError = error as Error
        const responseText = await response.text()
        throw new Error(
          `Failed to parse MLB data as JSON: ${jsonError.message || "Unknown error"}. Response: ${responseText.substring(0, 200)}...`,
        )
      }
    } catch (error) {
      setMlbResult({
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsTestingMlb(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Debug Dashboard</h1>
          <p className="text-muted-foreground">Test and debug API endpoints</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Panel
          </Link>
        </Button>
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

                  {updateResult.simulationMode && (
                    <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded-md">
                      <div className="flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Simulation Mode</p>
                          <p className="text-sm">{updateResult.note}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {updateResult.dataSource && (
                    <div className="mt-2 text-sm">
                      <p>
                        <strong>Data Source:</strong> {updateResult.dataSource}
                      </p>
                      {updateResult.mlbApiStatus && (
                        <p>
                          <strong>MLB API Status:</strong>{" "}
                          <span
                            className={updateResult.mlbApiStatus === "Connected" ? "text-green-600" : "text-red-600"}
                          >
                            {updateResult.mlbApiStatus}
                          </span>
                        </p>
                      )}
                      {updateResult.mlbPlayerCount !== undefined && (
                        <p>
                          <strong>Player Count:</strong> {updateResult.mlbPlayerCount}
                        </p>
                      )}
                    </div>
                  )}

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

                  {updateResult.samplePlayers && updateResult.samplePlayers.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                      <p className="font-medium">Sample MLB Players:</p>
                      {updateResult.samplePlayers.map(
                        (player: { name: string; team: string; hr2025: number }, index: number) => (
                          <div key={index} className="py-1 border-t border-border/30">
                            {player.name} ({player.team}): {player.hr2025} HRs
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {updateResult.stack && (
                    <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md text-xs overflow-auto max-h-40">
                      <pre>{updateResult.stack}</pre>
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

                  {mlbResult.source && (
                    <div className="mt-2 text-sm">
                      <p>
                        <strong>Source:</strong> {mlbResult.source}
                      </p>
                      <p>
                        <strong>Last Updated:</strong> {mlbResult.lastUpdated}
                      </p>
                    </div>
                  )}

                  {mlbResult.allPlayers && mlbResult.allPlayers.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                      <p className="font-medium">Sample Players:</p>
                      {mlbResult.allPlayers.slice(0, 10).map((player, index) => (
                        <div key={index} className="py-1 border-t border-border/30">
                          {player.name} ({player.team}): {player.hr2025} HRs
                        </div>
                      ))}
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
