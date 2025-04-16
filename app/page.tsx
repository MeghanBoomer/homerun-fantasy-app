import Link from "next/link"
import { BeerIcon } from "lucide-react"
import { Button } from "../components/ui/button"

export default function HomePage() {
  // Get the upcoming season year (current year + 1 if we're past the World Series, which typically ends in October)
  const getUpcomingSeasonYear = () => {
    return 2025 // Explicitly set to 2025
  }

  const upcomingSeasonYear = getUpcomingSeasonYear()

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12 md:px-8">
      <div className="flex flex-col items-center justify-center text-center space-y-8">
        <div className="flex items-center space-x-2">
          <BeerIcon className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Homerun Fantasy</h1>
        </div>

        <p className="text-xl text-muted-foreground max-w-2xl">
          Welcome to Homerun Fantasy! Create your team of MLB sluggers and compete to see who can predict the most home
          runs in the {upcomingSeasonYear} season.
        </p>

        <div className="grid gap-4 md:grid-cols-2 max-w-md w-full">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/register">Register</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl w-full mt-8">
          <div className="bg-card border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Create Your Team</h3>
            <p className="text-muted-foreground">
              Select 6 players from different tiers to build your dream home run lineup.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Track Performance</h3>
            <p className="text-muted-foreground">
              Watch the leaderboard as your players hit homers throughout the season.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Win Prizes</h3>
            <p className="text-muted-foreground">
              Compete for cash prizes and bragging rights in our seasonal contest.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <ol className="text-left max-w-2xl mx-auto space-y-4">
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">
                1
              </span>
              <span>Register for an account and sign in</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">
                2
              </span>
              <span>Create your team by selecting players from each tier</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">
                3
              </span>
              <span>Pay the $10 entry fee via Venmo</span>
            </li>
            <li className="flex items-start">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5">
                4
              </span>
              <span>Track your team's performance on the leaderboard throughout the season</span>
            </li>
          </ol>
        </div>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/create-team">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
