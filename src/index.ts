#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import { z } from "zod";
import { createServer } from "http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"; // 导入HTTP流传输类
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Command } from "commander";
import { fetchDocumentation } from "./fetchDocumentation";

import { parseApiDoc } from "./parser";

const program = new Command()
  .option("--transport <stdio|http|sse>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP/SSE transport", "3000")
  .option("--doc-url <url>", "document url", "")
  .allowUnknownOption()
  .parse(process.argv);

const cliOptions = program.opts<{
  transport: string;
  port: string;
  docUrl: string;
}>();

const allowedTransports = ["stdio", "http", "sse"];

// Validate transport option
function validateOptions() {
  if (!allowedTransports.includes(cliOptions.transport)) {
    console.error(
      `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, http, sse.`
    );
    process.exit(1);
  }

  if (!cliOptions.docUrl) {
    console.error("Please provide a valid --doc-url");
    process.exit(1);
  }
}

validateOptions();

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || "stdio") as
  | "stdio"
  | "http"
  | "sse";

const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? undefined : parsed;
})();

// Store SSE transports by session ID
const sseTransports: Record<string, SSEServerTransport> = {};

function createServerInstance() {
  const server = new McpServer(
    {
      name: "API MCP Server",
      version: "1.0.6",
    },
    {
      instructions:
        "This is a API MCP Server, you can use the tool to get the API documentation",
    }
  );

  server.tool(
    "get-api-doc",
    `Fetches and parses Swagger/OpenAPI documentation from the specified URL (provided via --doc-url).
    
Returns the complete API documentation in JSON format, including:
- All API endpoints and their HTTP methods
- Request parameters and body schemas
- Response formats and status codes
- API authentication requirements
- Data models and definitions
- API descriptions and examples

Note: The URL must be provided when starting the server using the --doc-url parameter.
Example: --doc-url=https://api.example.com/swagger.json`,
    async () => {
      try {
        const doc = await fetchDocumentation(cliOptions.docUrl);
        const data = (await parseApiDoc(doc)) || {};
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
        };
      } catch (error) {
        console.error("Error fetching documentation:", error);
        return {
          content: [{ type: "text", text: "Error fetching documentation" }],
        };
      }
    }
  );

  return server;
}

async function main() {
  const transportType = TRANSPORT_TYPE;

  if (transportType === "http" || transportType === "sse") {
    // Get initial port from environment or use default
    const initialPort = CLI_PORT ?? 3000;
    // Keep track of which port we end up using
    let actualPort = initialPort;
    const httpServer = createServer(async (req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`).pathname;

      // Set CORS headers for all responses
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, MCP-Session-Id, mcp-session-id"
      );

      // Handle preflight OPTIONS requests
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      try {
        // Create new server instance for each request
        const requestServer = createServerInstance();

        if (url === "/mcp") {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
          await requestServer.connect(transport);
          await transport.handleRequest(req, res);
        } else if (url === "/sse" && req.method === "GET") {
          // Create new SSE transport for GET request
          const sseTransport = new SSEServerTransport("/messages", res);
          // Store the transport by session ID
          sseTransports[sseTransport.sessionId] = sseTransport;
          // Clean up transport when connection closes
          res.on("close", () => {
            delete sseTransports[sseTransport.sessionId];
          });
          await requestServer.connect(sseTransport);
        } else if (url === "/messages" && req.method === "POST") {
          // Get session ID from query parameters

          const sessionId =
            new URL(
              req.url || "",
              `http://${req.headers.host}`
            ).searchParams.get("sessionId") ?? "";

          if (!sessionId) {
            res.writeHead(400);
            res.end("Missing sessionId parameter");
            return;
          }

          // Get existing transport for this session
          const sseTransport = sseTransports[sessionId];
          if (!sseTransport) {
            res.writeHead(400);
            res.end(`No transport found for sessionId: ${sessionId}`);
            return;
          }

          // Handle the POST message with the existing transport
          await sseTransport.handlePostMessage(req, res);
        } else if (url === "/ping") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("pong");
        } else {
          res.writeHead(404);
          res.end("Not found");
        }
      } catch (error) {
        console.error("Error handling request:", error);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
      }
    });

    // Function to attempt server listen with port fallback
    const startServer = async (
      port: number,
      maxAttempts = 10
    ): Promise<void> => {
      try {
        await new Promise<void>((resolve, reject) => {
          httpServer.once("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE" && port < initialPort + maxAttempts) {
              console.warn(
                `Port ${port} is in use, trying port ${port + 1}...`
              );
              httpServer.close(() => {
                startServer(port + 1, maxAttempts)
                  .then(resolve)
                  .catch(reject);
              });
            } else {
              reject(new Error(`Failed to start server: ${err.message}`));
            }
          });

          httpServer.listen(port, () => {
            actualPort = port;
            console.info(
              `API MCP Server running on ${transportType.toUpperCase()} at http://localhost:${actualPort}/mcp and legacy SSE at /sse`
            );
            resolve();
          });
        });
      } catch (error) {
        console.error(`Failed to start server:`, error);
        process.exit(1);
      }
    };

    // Start the server with initial port
    await startServer(initialPort);
  } else {
    // Stdio transport - this is already stateless by nature
    const server = createServerInstance();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.info("API MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
