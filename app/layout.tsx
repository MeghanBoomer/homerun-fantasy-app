import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react" // Import React

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Home Run Fantasy",
  description: "Create your MLB home run fantasy team and compete!",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-green-800 bg-opacity-80 min-h-screen`}>
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('/baseball-stadium.jpg')" }}
        ></div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}



import './globals.css'