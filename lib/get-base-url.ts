export function getBaseUrl(): string {
  // For production, use the hardcoded URL
  if (process.env.NODE_ENV === "production") {
    return "https://homerun-fantasy.vercel.app"
  }

  // For development
  return "http://localhost:3000"
}

