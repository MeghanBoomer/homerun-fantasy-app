import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    // Check if we have the service account JSON
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.error("FIREBASE_SERVICE_ACCOUNT environment variable is not set")
      throw new Error("Missing Firebase service account credentials")
    }

    let serviceAccount

    try {
      // Parse the service account JSON string
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

      // Verify the service account has the required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error("Invalid service account format: missing required fields")
      }
    } catch (parseError) {
      console.error("Error parsing service account JSON:", parseError)
      throw new Error("Invalid service account JSON format")
    }

    // Initialize the app with the service account
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
    })

    console.log("Firebase Admin SDK initialized successfully")
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error)
    // Don't throw here - we'll handle the error when trying to use adminDb
  }
}

// Get Firestore instance with error handling
let adminDb
try {
  adminDb = getFirestore()
} catch (error) {
  console.error("Error getting Firestore instance:", error)
  // Create a mock adminDb that logs errors when methods are called
  adminDb = new Proxy(
    {},
    {
      get: (target, prop) => () => {
        throw new Error(`Firebase Admin SDK not initialized. Cannot call ${String(prop)}`)
      },
    },
  )
}

export { adminDb }
