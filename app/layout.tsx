import type React from "react"
import { EnvWarningSuppressor } from "../components/env-warning-suppressor"
import type { Metadata } from "next"
import "../app/globals.css"

export const metadata: Metadata = {
  title: "Homerun Fantasy",
  description: "Create your team of MLB sluggers and compete to see who can predict the most home runs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <EnvWarningSuppressor />
        {children}
      </body>
    </html>
  )
}


import './globals.css'