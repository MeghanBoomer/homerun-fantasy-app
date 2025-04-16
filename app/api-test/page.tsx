"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"

export default function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [endpoint, setEndpoint] = useState<string>("")

  const testApi = async (endpoint: string) => {
    setIsLoading(true)
    setResult(null)
    setEndpoint(endpoint)

    try {
      const method = endpoint.includes("update-stats") ? "POST" : "GET"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      })

      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        setResult({
          success: true,
          status: response.status,
          statusText: response.statusText,
          endpoint,
          data,
        })
      } else {
        const text = await response.text()
        setResult({
          success: false,
          status: response.status,
          statusText: response.statusText,
          endpoint,
          error: "Response is not JSON",
          text: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        endpoint,
        error: error.message,
        stack: error.stack,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-6">API Test Page</h1>
      <p className="text-muted-foreground mb-8">Use this page to test various API endpoints</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Endpoints</CardTitle>
            <CardDescription>Click a button to test an API endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => testApi("/api/standalone-mlb-data")} disabled={isLoading} className="w-full">
              Test MLB Data
            </Button>
            <Button onClick={() => testApi("/api/standalone-update-stats")} disabled={isLoading} className="w-full">
              Test Stats Update
            </Button>
            <Button onClick={() => testApi("/api/run-stats-update")} disabled={isLoading} className="w-full">
              Test Run Stats Update
            </Button>
            <Button onClick={() => testApi("/api/test-mlb-connection")} disabled={isLoading} className="w-full">
              Test MLB API Connection
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>API response will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <p>Testing API: {endpoint}</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>
                    {result.success ? "Success" : "Error"} - {result.status} {result.statusText}
                  </AlertTitle>
                  <AlertDescription>
                    Endpoint: {result.endpoint}
                    {result.error && <div className="mt-2 font-medium">Error: {result.error}</div>}
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">
                    {result.data
                      ? JSON.stringify(result.data, null, 2)
                      : result.text
                        ? result.text
                        : JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No results yet. Click a button to test an API.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
