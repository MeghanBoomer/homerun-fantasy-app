"use client"

import { Construction, Info, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"

interface NoHomeRunsTodayProps {
  isDebugging: boolean
  debugHomeRuns: () => void
  debugInfo: any
}

export function NoHomeRunsToday({ isDebugging, debugHomeRuns, debugInfo }: NoHomeRunsTodayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Construction className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="font-medium mb-2">No Recent Home Runs</p>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        None of your players have hit home runs in the last 7 days. Check back later for updates!
      </p>
      <Button variant="outline" size="sm" onClick={debugHomeRuns} disabled={isDebugging} className="mt-4">
        {isDebugging ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Debugging...
          </>
        ) : (
          <>
            <Info className="mr-2 h-4 w-4" />
            Debug API
          </>
        )}
      </Button>

      {debugInfo && (
        <div className="mt-4 text-left bg-muted p-4 rounded-md overflow-auto max-h-60 text-xs">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
