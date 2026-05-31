type LogLevel = "debug" | "info" | "warn" | "error"

function log(level: LogLevel, message: string, meta?: unknown) {
  const prefix = `[${level.toUpperCase()}]`

  if (meta === undefined) {
    console[level](prefix, message)
    return
  }

  console[level](prefix, message, meta)
}

export const logger = {
  debug(message: string, meta?: unknown) {
    log("debug", message, meta)
  },
  info(message: string, meta?: unknown) {
    log("info", message, meta)
  },
  warn(message: string, meta?: unknown) {
    log("warn", message, meta)
  },
  error(message: string, meta?: unknown) {
    log("error", message, meta)
  },
}
