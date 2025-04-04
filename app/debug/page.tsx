"use client"

import { useState, useEffect } from "react"

export default function DebugPage() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        const response = await fetch("/api/debug-info")
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        const data = await response.json()
        setInfo(data)
      } catch (err: any) {
        setError(err.message || "Failed to fetch debug info")
      } finally {
        setLoading(false)
      }
    }

    fetchDebugInfo()
  }, [])

  return (
    <div style={{ padding: "20px" }}>
      <h1>Debug Information</h1>

      {loading && <p>Loading debug information...</p>}

      {error && (
        <div style={{ color: "red", padding: "10px", border: "1px solid red", marginBottom: "20px" }}>
          Error: {error}
        </div>
      )}

      {info && (
        <div>
          <h2>Environment Information</h2>
          <pre style={{ background: "#f0f0f0", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
            {JSON.stringify(info, null, 2)}
          </pre>

          <h2>Browser Information</h2>
          <p>Current URL: {window.location.href}</p>
          <p>Hostname: {window.location.hostname}</p>
          <p>Origin: {window.location.origin}</p>

          <h2>Test Links</h2>
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
          </ul>
        </div>
      )}
    </div>
  )
}

