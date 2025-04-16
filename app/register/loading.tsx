import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container py-12 flex justify-center items-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        <p className="text-xl">Loading registration page...</p>
      </div>
    </div>
  )
}
