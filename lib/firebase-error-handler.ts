/**
 * Helper functions to handle Firebase errors gracefully
 */

// Function to check if an error is a Firebase permission error
export function isFirebasePermissionError(error: any): boolean {
  return (
    error?.code === "permission-denied" ||
    error?.message?.includes("permission-denied") ||
    error?.message?.includes("Permission denied") ||
    error?.message?.includes("Missing or insufficient permissions")
  )
}

// Function to handle Firebase errors with user-friendly messages
export function handleFirebaseError(error: any, operation = "operation"): string {
  console.error(`Firebase error during ${operation}:`, error)

  if (isFirebasePermissionError(error)) {
    return `You don't have permission to ${operation}. This might be due to security rules.`
  }

  if (error?.code === "not-found") {
    return "The requested data was not found."
  }

  if (error?.code === "unavailable") {
    return "The service is currently unavailable. Please try again later."
  }

  // Default error message
  return error?.message || `An error occurred during ${operation}. Please try again.`
}

// Function to log detailed error information for debugging
export function logDetailedError(error: any, context: string): void {
  console.error(`Error in ${context}:`, {
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
    details: error?.details,
    name: error?.name,
  })
}
