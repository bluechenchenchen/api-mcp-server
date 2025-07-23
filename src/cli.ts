#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startHttpServer } from "./server";
import { getServerConfig } from "./config";
import { createServer } from "./mcp";
import { config } from "dotenv";
import { resolve } from "path";
import { Command } from "commander";
import { CliOptions, ServerConfig } from "./types/config";
import { setupErrorHandlers } from "./utils/errorHandlers";
import { Logger } from "./utils/logger";

config({ path: resolve(process.cwd(), ".env") });

const program = new Command()
  .name("api-mcp-server")
  .version("1.0.0")
  .option("--transport <stdio|http|sse>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP/SSE transport", "3000")
  .option("--enable-sse", "enable SSE transport", false)
  .option("--enable-http", "enable HTTP transport", false)
  .option("--enable-stdio", "enable stdio transport", true)
  .option("--doc-url <url>", "document url", "http://localhost:3000/api-docs")
  .allowUnknownOption()
  .parse(process.argv);

const cliOptions = program.opts<CliOptions>();

const updateEnvironment = (options: CliOptions): void => {
  process.env.TRANSPORT = options.transport;
  process.env.PORT = (options.port || getServerConfig().port) as string;
  process.env.DOC_URL = options.docUrl;
};

const initializeServer = async (config: ServerConfig): Promise<void> => {
  const server: McpServer = createServer();

  if (isStdioMode(config)) {
    await setupStdioServer(server);
  } else {
    await setupHttpServer(config, server);
  }
};

const isStdioMode = (config: ServerConfig): boolean => {
  return (
    config.transport === "stdio" ||
    process.env.NODE_ENV === "cli" ||
    process.argv.includes("--stdio")
  );
};

const setupStdioServer = async (server: McpServer): Promise<void> => {
  const transport = new StdioServerTransport();
  Logger.log("Running in stdio mode");
  await server.connect(transport);
};

const setupHttpServer = async (
  config: ServerConfig,
  server: McpServer
): Promise<void> => {
  Logger.log("Running in HTTP mode");
  await startHttpServer(config.port, server, { enableSSE: config.enableSSE });
};

export async function startServer(): Promise<void> {
  try {
    updateEnvironment(cliOptions);
    setupErrorHandlers();

    const config = getServerConfig();
    await initializeServer(config);
  } catch (error) {
    Logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  Logger.log("Starting server directly");
  startServer();
}
