/*
 * @Author: blue
 * @Date: 2025-07-04 10:40:00
 * @FilePath: /api-mcp-server/src/mcp.ts
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools/index";

function createServer(): McpServer {
  const server: McpServer = new McpServer({
    name: "api-mcp-server",
    version: "1.0.0",
  });

  registerTools(server);
  return server;
}
// 导出创建服务器函数
export { createServer };
