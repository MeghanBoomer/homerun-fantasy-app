"use client"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function AdminAccessPage() {
  const router = useRouter()

  return (
    <div className="container py-12 flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>This page provides direct access to the admin panel for testing purposes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>
            Click the button below to access the admin panel where you can manage teams, update payment status, and
            delete teams.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild size="lg" variant="destructive">
            <Link href="/admin">Access Admin Panel</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
