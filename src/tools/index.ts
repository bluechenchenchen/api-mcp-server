/*
 * @Author: blue
 * @Date: 2025-07-04 10:40:00
 * @FilePath: /api-mcp-server/src/tools/index.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerApiTool } from "./api";

export function registerTools(server: McpServer) {
  registerApiTool(server);
}
