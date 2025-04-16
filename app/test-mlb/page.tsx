"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Loader2, RefreshCw, AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"

export default function TestMlbPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/test-mlb-connection")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to MLB API")
      }

      setResult(data)
    } catch (error: any) {
      console.error("Error testing MLB API:", error)
      setError(error.message || "An error occurred while testing the MLB API connection")
    } finally {
      setIsLoading(false)
    }
  }

  // Test connection on page load
  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Test MLB API Connection</h1>
        <p className="text-muted-foreground">Verify that the MLB Stats API is working correctly</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>MLB Stats API Connection Test</CardTitle>
          <CardDescription>
            This will attempt to connect to the MLB Stats API and retrieve current home run leaders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Testing connection to MLB Stats API...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : result ? (
            <div>
              {result.success ? (
                <Alert className="mb-6">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Connection Successful</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Failed</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}

              {result.leaders && result.leaders.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Current Home Run Leaders</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Player</th>
                          <th className="px-4 py-2 text-left">Team</th>
                          <th className="px-4 py-2 text-left">Position</th>
                          <th className="px-4 py-2 text-right">Home Runs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.leaders.map((leader: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{leader.name}</td>
                            <td className="px-4 py-2">{leader.team}</td>
                            <td className="px-4 py-2">{leader.position}</td>
                            <td className="px-4 py-2 text-right font-medium">{leader.homeRuns}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={testConnection} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Connection Again
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
