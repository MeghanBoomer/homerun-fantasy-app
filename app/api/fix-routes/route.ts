import { NextResponse } from "next/server"

export async function GET() {
  // Get the correct base URL
  const baseUrl = getBaseUrl()

  // Test if routes are accessible
  const testRoutes = ["/deployment-test", "/api/deployment-test", "/test-simple"]

  const results = await Promise.all(
    testRoutes.map(async (route) => {
      try {
        const fullUrl = `${baseUrl}${route}`
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        return {
          route,
          fullUrl,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        }
      } catch (error) {
        return {
          route,
          fullUrl: `${baseUrl}${route}`,
          error: error.message,
        }
      }
    }),
  )

  return NextResponse.json({
    baseUrl,
    vercelUrl: process.env.VERCEL_URL,
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    host: process.env.HOST,
    routeTests: results,
    timestamp: new Date().toISOString(),
  })
}

// Improved getBaseUrl function
function getBaseUrl(): string {
  // For browser-side code
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // For server-side code in production
  if (process.env.VERCEL_URL) {
    // Fix the localhost issue by ensuring it's a full URL
    if (process.env.VERCEL_URL.includes("localhost")) {
      return `https://v0-homerun-fantasy-app.vercel.app`
    }
    return `https://${process.env.VERCEL_URL}`
  }

  // For server-side code with explicit site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Fallback to the custom domain we know exists
  return "https://homerun-fantasy.vercel.app"
}
