/*
 * @Author: blue
 * @Date: 2025-07-02 16:21:21
 * @FilePath: /mcp_server_ts/src/tools/demo.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * 注册加法工具
 */
export function registerDemoTool(mcp: McpServer) {
  mcp.registerTool(
    "add",
    {
      title: "加法工具",
      description: "两个数相加",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(a + b) }],
    })
  );
}
