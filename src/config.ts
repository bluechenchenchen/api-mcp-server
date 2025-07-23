/*
 * @Author: blue
 * @Date: 2025-07-04 11:26:48
 * @FilePath: /api-mcp-server/src/config.ts
 */
import { ServerConfig, CliOptions } from "./types/config";
import { ConfigError } from "./utils/errorHandlers";

/**
 * Validate server configuration
 */
function validateConfig(config: Partial<ServerConfig>): void {
  if (!config.port || isNaN(Number(config.port))) {
    throw new ConfigError("Invalid port number", "port");
  }

  if (!config.transport) {
    throw new ConfigError("Transport type is required", "transport");
  }

  if (!["stdio", "http", "sse"].includes(config.transport)) {
    throw new ConfigError("Invalid transport type", "transport");
  }
}

/**
 * Get server configuration with environment variables and validation
 */
export function getServerConfig(): ServerConfig {
  const config: ServerConfig = {
    port: Number(process.env.PORT) || 3000,
    transport: (process.env.TRANSPORT as "stdio" | "http" | "sse") || "stdio",
    docUrl: process.env.DOC_URL || "http://localhost:3000/api-docs",
    enableSSE: process.env.ENABLE_SSE === "true",
    enableHttp: process.env.ENABLE_HTTP === "true",
    enableStdio: process.env.ENABLE_STDIO !== "false",
  };

  validateConfig(config);
  return config;
}

/**
 * Update configuration with CLI options
 */
export function updateConfigWithCliOptions(
  config: ServerConfig,
  cliOptions: CliOptions
): ServerConfig {
  return {
    ...config,
    port: Number(cliOptions.port) || config.port,
    transport: cliOptions.transport || config.transport,
    docUrl: cliOptions.docUrl || config.docUrl,
    enableSSE: cliOptions.enableSSE,
    enableHttp: cliOptions.enableHttp,
    enableStdio: cliOptions.enableStdio,
  };
}
