/*
 * @Author: blue
 * @Date: 2025-07-02 16:21:21
 * @FilePath: /mcp_server_ts/src/tools/time.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * 获取当前时间
 *
 * Returns:
 *     str: 格式化的当前时间字符串
 */
const tool = {
  name: "get_current_time",
  description: `
        获取当前时间
        
        Returns:
            str: 当前时间，格式为yyyy-MM-dd HH:mm:ss
        `,
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  handler: async (): Promise<string> => {
    const now = new Date();
    return now
      .toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\//g, "-");
  },
};

/**
 * 注册时间工具
 */
export function registerTimeTool(mcp: McpServer) {
  mcp.registerTool(
    tool.name,
    {
      title: "get_current_time",
      description: "获取当前时间",
      inputSchema: {},
    },
    async () => {
      const result = await tool.handler();
      return {
        content: [{ type: "text", text: result }],
      };
    }
  );
}
