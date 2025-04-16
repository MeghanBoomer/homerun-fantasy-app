import { NextResponse } from "next/server"
import { adminDb } from "../../../lib/firebase-admin"
import { createLogger } from "../../../lib/logger"

const logger = createLogger("test-mlb-data")

export async function GET() {
  try {
    logger.info("Testing MLB data API with Admin SDK")

    // Try to fetch from the MLB cache
    const cacheDoc = await adminDb.collection("mlb-cache").doc("latest").get()

    if (!cacheDoc.exists) {
      logger.warn("No cached MLB data found")
      return NextResponse.json({
        success: false,
        message: "No cached MLB data found",
        timestamp: new Date().toISOString(),
      })
    }

    const cacheData = cacheDoc.data()
    logger.info("Successfully retrieved MLB data from cache", {
      source: cacheData.source,
      fetchedAt: cacheData.fetchedAt.toDate(),
    })

    // Return a sample of the data
    return NextResponse.json({
      success: true,
      message: "Successfully retrieved MLB data using Admin SDK",
      source: cacheData.source,
      fetchedAt: cacheData.fetchedAt.toDate(),
      playerCount: cacheData.players?.length || 0,
      samplePlayers: cacheData.players?.slice(0, 5) || [],
    })
  } catch (error) {
    logger.error("Error testing MLB data API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to test MLB data API",
      },
      { status: 500 },
    )
  }
}
