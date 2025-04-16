import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint")

    if (!endpoint) {
      return NextResponse.json({ error: "Missing 'endpoint' parameter" }, { status: 400 })
    }

    // MLB Stats API base URL
    const MLB_API_BASE_URL = "https://statsapi.mlb.com/api/v1"
    const apiUrl = `${MLB_API_BASE_URL}/${endpoint}`

    console.log(`Proxying request to MLB API: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Homerun-Fantasy-App/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 0 }, // Don't cache
    })

    if (!response.ok) {
      throw new Error(`MLB API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in MLB proxy:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch from MLB API" }, { status: 500 })
  }
}
