import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Get the host from the request headers
  const host = request.headers.get("host") || "unknown"
  const url = new URL(request.url)

  return NextResponse.json({
    message: "Route testing endpoint",
    timestamp: new Date().toISOString(),
    requestInfo: {
      host,
      url: request.url,
      pathname: url.pathname,
      origin: url.origin,
    },
    environment: {
      vercelUrl: process.env.VERCEL_URL || "not set",
      nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "not set",
      nodeEnv: process.env.NODE_ENV,
    },
  })
}
