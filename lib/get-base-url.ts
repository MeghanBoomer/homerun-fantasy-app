export function getBaseUrl(): string {
  // For browser-side code
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // For server-side code, prioritize the custom domain
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // If VERCEL_URL is set, use it with https
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback to the custom domain
  return "https://homerunfantasy.app"
}
