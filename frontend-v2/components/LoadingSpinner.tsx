import { Loader2 } from "lucide-react"

export const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-card rounded-lg p-8 flex flex-col items-center border shadow-xl">
        {/* Pulse Dots */}
        <div className="flex space-x-2 mb-4">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
        
        {/* Circular Spinner */}
        <div className="relative w-16 h-16 mb-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-ping" />
        </div>

        {/* Progress Ring */}
        <div className="relative w-20 h-20 mb-4">
          <svg className="animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        <h2 className="text-center text-xl font-semibold mb-2">YTAChunker Processing</h2>
        <p className="text-center text-muted-foreground">
          Processing your video, please wait...
        </p>
      </div>
    </div>
  )
} 