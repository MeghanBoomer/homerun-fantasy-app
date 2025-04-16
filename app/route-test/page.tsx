"use client"

import { useState, useEffect } from "react"

export default function RouteTestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testRoutes() {
      try {
        const response = await fetch("/api/fix-routes")
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        const data = await response.json()
        setTestResults(data)
      } catch (err: any) {
        setError(err.message || "Failed to test routes")
      } finally {
        setLoading(false)
      }
    }

    testRoutes()
  }, [])

  return (
    <div style={{ padding: "20px" }}>
      <h1>Route Testing Page</h1>

      {loading && <p>Testing routes...</p>}

      {error && (
        <div style={{ color: "red", padding: "10px", border: "1px solid red", marginBottom: "20px" }}>
          Error: {error}
        </div>
      )}

      {testResults && (
        <div>
          <h2>Base URL Information</h2>
          <ul>
            <li>
              <strong>Base URL:</strong> {testResults.baseUrl}
            </li>
            <li>
              <strong>VERCEL_URL:</strong> {testResults.vercelUrl}
            </li>
            <li>
              <strong>NEXT_PUBLIC_SITE_URL:</strong> {testResults.nextPublicSiteUrl}
            </li>
            <li>
              <strong>Timestamp:</strong> {testResults.timestamp}
            </li>
          </ul>

          <h2>Route Test Results</h2>
          <div style={{ marginTop: "20px" }}>
            {testResults.routeTests.map((result: any, index: number) => (
              <div
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderLeft: `5px solid ${result.ok ? "green" : "red"}`,
                }}
              >
                <p>
                  <strong>Route:</strong> {result.route}
                </p>
                <p>
                  <strong>Full URL:</strong> {result.fullUrl}
                </p>
                {result.ok !== undefined ? (
                  <>
                    <p>
                      <strong>Status:</strong> {result.status} ({result.statusText})
                    </p>
                    <p>
                      <strong>Success:</strong> {result.ok ? "Yes" : "No"}
                    </p>
                  </>
                ) : (
                  <p>
                    <strong>Error:</strong> {result.error}
                  </p>
                )}
              </div>
            ))}
          </div>

          <h2>Manual Test Links</h2>
          <ul>
            <li>
              <a href="/deployment-test" target="_blank" rel="noreferrer">
                Test /deployment-test
              </a>
            </li>
            <li>
              <a href="/api/deployment-test" target="_blank" rel="noreferrer">
                Test /api/deployment-test
              </a>
            </li>
            <li>
              <a href="/test-simple" target="_blank" rel="noreferrer">
                Test /test-simple
              </a>
            </li>
            <li>
              <a href="/api/test-routes" target="_blank" rel="noreferrer">
                Test /api/test-routes
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
