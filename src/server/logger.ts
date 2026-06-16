type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = Record<string, unknown>;

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...context,
  };
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const line = formatLog(level, message, context);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
  debug: (message: string, context?: LogContext) => {
    if (process.env.LOG_LEVEL === "debug") {
      log("debug", message, context);
    }
  },
};

export function logApiRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  context?: LogContext,
) {
  logger.info("api_request", { method, path, status, duration_ms: durationMs, ...context });
}

export function logApiError(
  method: string,
  path: string,
  error: unknown,
  context?: LogContext,
) {
  logger.error("api_error", {
    method,
    path,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}
