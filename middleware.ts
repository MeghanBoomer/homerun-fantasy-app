import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware runs before any request is processed
export function middleware(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname)

  // Just pass through all requests without modification
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all routes
    "/(.*)",
  ],
}
