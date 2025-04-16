"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Loader2, Search, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"

export default function DebugPlayerPage() {
  const [playerId, setPlayerId] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("id")

  const debugPlayer = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const queryParam =
        activeTab === "id" ? `id=${encodeURIComponent(playerId)}` : `name=${encodeURIComponent(playerName)}`

      const response = await fetch(`/api/debug-player?${queryParam}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API responded with status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error debugging player:", error)
      setError(error.message || "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Debug Player Data</h1>
        <p className="text-muted-foreground">Look up player information and home run stats</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Player Lookup</CardTitle>
          <CardDescription>Search for a player by ID or name to debug their data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="id">Search by ID</TabsTrigger>
              <TabsTrigger value="name">Search by Name</TabsTrigger>
            </TabsList>

            <TabsContent value="id">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerId">Player ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="playerId"
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                      placeholder="e.g., p592518 or 592518"
                    />
                    <Button onClick={debugPlayer} disabled={isLoading || !playerId}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Enter the player ID with or without the 'p' prefix</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="name">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Player Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="e.g., Manny Machado"
                    />
                    <Button onClick={debugPlayer} disabled={isLoading || !playerName}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Enter the player's full name</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Player Information</h3>
                <div className="bg-muted p-4 rounded-md">
                  <p>
                    <strong>Name:</strong> {result.player.fullName}
                  </p>
                  <p>
                    <strong>ID:</strong> {result.player.id} (use p{result.player.id} in your app)
                  </p>
                  <p>
                    <strong>Team:</strong> {result.player.currentTeam?.name || "Unknown"}
                  </p>
                  <p>
                    <strong>Position:</strong> {result.player.primaryPosition?.abbreviation || "Unknown"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">2025 Home Run Stats</h3>
                <div className="bg-muted p-4 rounded-md">
                  {result.currentHRStats ? (
                    <>
                      <p>
                        <strong>Home Runs:</strong> {result.currentHRStats.value}
                      </p>
                      <p>
                        <strong>Rank:</strong> {result.currentHRStats.rank}
                      </p>
                    </>
                  ) : (
                    <p>No home run data found for 2025 season</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">API Details</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  <p>
                    <strong>Player API URL:</strong> {result.apiUrl}
                  </p>
                  <p>
                    <strong>HR Leaders URL:</strong> {result.hrLeadersUrl}
                  </p>
                  <p>
                    <strong>Timestamp:</strong> {result.timestamp}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Raw Player Data</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">{JSON.stringify(result.player, null, 2)}</pre>
                </div>
              </div>

              {result.currentHRStats && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Raw HR Stats Data</h3>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                    <pre className="text-xs">{JSON.stringify(result.currentHRStats, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
