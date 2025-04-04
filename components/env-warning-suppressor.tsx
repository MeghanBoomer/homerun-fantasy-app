"use client"

import { useEffect } from "react"

export function EnvWarningSuppressor() {
  useEffect(() => {
    // Suppress VERCEL_URL warnings
    const removeWarning = () => {
      const warningElements = document.querySelectorAll('[role="alert"]')
      warningElements.forEach((element) => {
        if (element.textContent?.includes("VERCEL_URL")) {
          element.remove()
        }
      })
    }

    // Try immediately
    removeWarning()

    // Also try after a short delay to catch dynamically added warnings
    const timer = setTimeout(removeWarning, 500)

    // Set up an observer to catch any new warnings
    const observer = new MutationObserver((mutations) => {
      removeWarning()
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return null
}

