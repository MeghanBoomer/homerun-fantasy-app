import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware runs before any request is processed
export function middleware(request: NextRequest) {
  // This is a hack to suppress the VERCEL_URL warning
  // It adds the environment variable to the process.env object
  if (!process.env.VERCEL_URL && typeof window === "undefined") {
    // @ts-ignore - Intentionally modifying process.env
    process.env.VERCEL_URL = request.headers.get("host") || "localhost:3000"
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all routes
    "/(.*)",
  ],
}

