type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
}

class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }

    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      const logFn =
        level === "error"
          ? console.error
          : level === "warn"
            ? console.warn
            : level === "debug"
              ? console.debug
              : console.log

      logFn(`[${entry.timestamp}] [${this.context}] [${level.toUpperCase()}] ${message}`, data || "")
    }

    // In production, you could send logs to a service like Vercel Logs
    if (process.env.NODE_ENV === "production") {
      // Log to console for Vercel logs
      console.log(
        JSON.stringify({
          ...entry,
          context: this.context,
        }),
      )

      // You could also send logs to a third-party service here
    }
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data)
  }

  info(message: string, data?: any) {
    this.log("info", message, data)
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data)
  }

  error(message: string, error?: any) {
    this.log("error", message, error)
  }
}

export function createLogger(context: string) {
  return new Logger(context)
}
