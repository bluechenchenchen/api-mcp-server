/*
 * @Author: blue
 * @Date: 2025-07-04 10:40:00
 * @FilePath: /mcp_server_ts/src/tools/index.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerApiTool } from "./api.ts";
import { registerTimeTool } from "./time.ts";
import { registerDemoTool } from "./demo.ts";
import { registerWeatherTool } from "./weather.ts";

export function registerTools(server: McpServer) {
  registerApiTool(server);
  // registerTimeTool(server);
  // registerDemoTool(server);
  registerWeatherTool(server);
}
