"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import Link from "next/link"

export default function FixShoMeTheMoneyPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixTeam = async () => {
    setIsUpdating(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-sho-me-the-money")

      if (!response.ok) {
        throw new Error(`Failed to fix team: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error fixing team:", error)
      setResult({ error: error.message || "An unknown error occurred" })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Fix "Sho me the money" Team</h1>
          <p className="text-muted-foreground">Update stats for the "Sho me the money" team to have 8 total HRs</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Fix Team Stats</CardTitle>
          <CardDescription>This will set the "Sho me the money" team to have 8 total home runs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Click the button below to fix the home run statistics for the "Sho me the money" team. This will:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Set individual player HR counts to add up to 8</li>
            <li>Update the team's total HR count to 8</li>
            <li>Update the team's last updated timestamp</li>
          </ul>

          {result && (
            <Alert className="mb-6" variant={result.error ? "destructive" : "default"}>
              <AlertTitle>{result.error ? "Error" : "Success"}</AlertTitle>
              <AlertDescription>
                {result.error || result.message}
                {result.team && (
                  <div className="mt-2">
                    <p>Total HRs: {result.team.totalHR}</p>
                    <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                      <p className="font-medium">Player HRs:</p>
                      {result.team.playerHRs.map((hr, index) => (
                        <div key={index} className="py-1 border-t border-border/30">
                          Player {index + 1}: {hr} HRs
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
          <Button onClick={fixTeam} disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing Team...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fix "Sho me the money" Team
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
