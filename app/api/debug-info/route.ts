import { NextResponse } from "next/server"

export async function GET() {
  // Collect environment information
  const info = {
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    currentTimestamp: new Date().toISOString(),
    // Add paths that should exist
    expectedPaths: ["/deployment-test", "/api/deployment-test", "/test-simple"],
  }

  return NextResponse.json({
    success: true,
    message: "Debug information",
    info,
  })
}

