import { Logger } from "./logger";

/**
 * Setup global error handlers for uncaught exceptions and unhandled rejections
 */
export function setupErrorHandlers(): void {
  process.on("uncaughtException", (error: Error) => {
    Logger.error("Uncaught Exception:", error);
  });

  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    Logger.error("Unhandled Rejection:", promise, "Reason:", reason);
  });
}

/**
 * Custom error class for server-related errors
 */
export class ServerError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "ServerError";
  }
}

/**
 * Custom error class for configuration-related errors
 */
export class ConfigError extends Error {
  constructor(message: string, public readonly parameter?: string) {
    super(message);
    this.name = "ConfigError";
  }
}
