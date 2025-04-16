"use client"

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Loader2, RefreshCw, AlertCircle, ArrowLeft, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import Link from "next/link"

export default function UpdateStatsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)

  const handleUpdateStats = async () => {
    setIsUpdating(true)
    setResult(null)

    try {
      // Call the public endpoint for simplicity
      const response = await fetch("/api/run-stats-update", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update stats")
      }

      setResult({
        success: true,
        message: data.message || "Stats updated successfully",
        details: data.details,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred while updating stats",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Update Player Stats</h1>
          <p className="text-muted-foreground">Manually update current season home run stats</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Panel
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update 2025 Season Stats</CardTitle>
          <CardDescription>This will update all team statistics based on player performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Use this function to manually update the home run statistics for all players and teams. This process:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Calculates current season home runs for each player</li>
            <li>Updates each team's total home run count</li>
            <li>Recalculates leaderboard rankings</li>
          </ul>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-6">
              {result.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>
                {result.message}
                {result.success && result.details && (
                  <div className="mt-2">
                    <p>Updated {result.details.teams?.length || 0} teams</p>
                    {result.details.teams && result.details.teams.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left">Team</th>
                              <th className="text-right">Previous HR</th>
                              <th className="text-right">New HR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.details.teams.map((team: any, index: number) => (
                              <tr key={index} className="border-t border-border/30">
                                <td className="py-1">{team.name}</td>
                                <td className="text-right py-1">{team.previousHR}</td>
                                <td className="text-right py-1">{team.newHR}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateStats} disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Stats...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Stats Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
