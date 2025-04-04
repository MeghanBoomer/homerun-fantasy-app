export function getBaseUrl(): string {
  // Browser-side
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // Server-side with explicit environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Server-side with Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local development fallback
  return "http://localhost:3000"
}

// Suppress the VERCEL_URL warning by ensuring it exists
export function ensureEnvironmentVariables() {
  if (typeof process !== "undefined" && process.env && !process.env.VERCEL_URL) {
    // @ts-ignore - Intentionally modifying process.env
    process.env.VERCEL_URL = "localhost:3000"
  }
}

// Call this function immediately
ensureEnvironmentVariables()

