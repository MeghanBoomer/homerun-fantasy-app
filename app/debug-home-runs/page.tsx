"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

export default function DebugHomeRunsPage() {
  const [playerIds, setPlayerIds] = useState("p592450,p660271,p624413,p656941")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testHomeRuns = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Call our debug endpoint
      const response = await fetch(`/api/debug-recent-home-runs?playerIds=${playerIds}`)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      console.error("Error testing home runs:", error)
      setError(error.message || "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Test on initial load
  useEffect(() => {
    testHomeRuns()
  }, [])

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Debug Home Runs</h1>
          <p className="text-muted-foreground">Test the MLB API and home run data fetching</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
          <CardDescription>Enter player IDs to test (comma-separated)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerIds">Player IDs</Label>
              <Input
                id="playerIds"
                value={playerIds}
                onChange={(e) => setPlayerIds(e.target.value)}
                placeholder="e.g., p592450,p660271,p624413"
              />
              <p className="text-sm text-muted-foreground">
                Common IDs: p592450 (Judge), p660271 (Ohtani), p624413 (Alonso), p656941 (Schwarber)
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={testHomeRuns} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Home Run Data
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Date Range: {result.dateRange?.start} to {result.dateRange?.end}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">MLB Schedule Data</h3>
                {result.mlbSchedule ? (
                  <div className="bg-muted p-4 rounded-md">
                    <p>Games found: {result.mlbSchedule.gameCount}</p>
                    <p>Date entries: {result.mlbSchedule.dates}</p>
                    {result.mlbSchedule.gameIds && result.mlbSchedule.gameIds.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Sample Game IDs:</p>
                        <ul className="list-disc pl-5 mt-1">
                          {result.mlbSchedule.gameIds.map((gameId, index) => (
                            <li key={index}>{gameId}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No schedule data available</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Simulated Home Runs</h3>
                {result.simulatedHomeRuns && result.simulatedHomeRuns.length > 0 ? (
                  <div className="space-y-2">
                    {result.simulatedHomeRuns.map((hr, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <p className="font-medium">{hr.playerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {hr.playerTeam} vs {hr.opponent} - {new Date(hr.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No simulated home runs generated</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Raw Response</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
