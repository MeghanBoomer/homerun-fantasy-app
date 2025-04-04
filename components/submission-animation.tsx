"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BeerIcon as Baseball } from "lucide-react"

interface SubmissionAnimationProps {
  isOpen: boolean
  teamName: string
  onClose: () => void
}

export function SubmissionAnimation({ isOpen, teamName, onClose }: SubmissionAnimationProps) {
  const router = useRouter()
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (isOpen) {
      // Stage 0: Initial animation
      const timer1 = setTimeout(() => setStage(1), 1500)
      // Stage 1: Show team name
      const timer2 = setTimeout(() => setStage(2), 3000)
      // Stage 2: Show success message
      const timer3 = setTimeout(() => {
        setStage(3)
        // Redirect to leaderboards after animation
        setTimeout(() => {
          console.log("Animation complete, redirecting to leaderboards")
          onClose()
          router.push("/leaderboards")

          // Force redirect as a fallback
          setTimeout(() => {
            if (window.location.pathname.includes("/create-team")) {
              console.log("Forcing redirect to leaderboards")
              window.location.href = "/leaderboards"
            }
          }, 500)
        }, 1000)
      }, 4500)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isOpen, router, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6 text-center">
        {stage === 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <Baseball className="h-20 w-20 text-primary" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-xl font-medium"
            >
              Submitting your team...
            </motion.p>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <Baseball className="h-20 w-20 text-primary" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <h2 className="text-2xl font-bold mb-2">{teamName}</h2>
              <p className="text-muted-foreground">is ready to hit some homers!</p>
            </motion.div>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{
                y: [0, -100],
                x: [0, 100],
                scale: [1, 0.5],
                opacity: [1, 0],
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
            >
              <Baseball className="h-20 w-20 text-primary" />
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <h2 className="text-3xl font-bold mb-4">Team Created!</h2>
              <p className="text-xl text-muted-foreground">Your team has been added to the contest</p>
            </motion.div>
          </motion.div>
        )}

        {stage === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <p className="text-xl">Heading to leaderboards...</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

