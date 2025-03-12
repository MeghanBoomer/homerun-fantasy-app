import Header from "../components/Header"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center">Welcome to Home Run Fantasy</h1>
          <p className="text-xl mb-8 text-center">Create your MLB home run fantasy team and compete with others!</p>
          <div className="flex justify-center">
            <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-4">
              Get Started
            </Link>
            <Link
              href="/leaderboard"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

