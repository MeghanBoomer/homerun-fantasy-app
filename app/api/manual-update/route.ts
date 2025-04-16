import { NextResponse } from "next/server"
import { auth } from "../../../lib/firebase"
import { getDoc, doc } from "firebase/firestore"
import { db } from "../../../lib/firebase"
import { getBaseUrl } from "../../../lib/get-base-url"

// This endpoint allows admins to manually trigger a home run data update
export async function POST(request: Request) {
  try {
    // Get the current user from the session
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if the user is an admin
    const isAdmin = await checkAdminStatus(user.uid)

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    // Get the base URL for API calls
    const baseUrl = getBaseUrl()

    // Call the update-home-runs API
    const response = await fetch(`${baseUrl}/api/update-home-runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to update home runs: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Home run data updated successfully",
      details: data,
    })
  } catch (error: any) {
    console.error("Error in manual update:", error)
    return NextResponse.json(
      {
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Check if user is admin
async function checkAdminStatus(uid: string) {
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid))
    return adminDoc.exists()
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
