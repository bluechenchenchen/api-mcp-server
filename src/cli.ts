/*
 * @Author: blue
 * @Date: 2025-07-04 10:23:12
 * @FilePath: /mcp_server_ts/src/cli.ts
 */
// 导入stdio服务器传输模块，用于标准输入输出通信
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startHttpServer } from "./server.ts";
// 导入服务器配置获取函数，用于获取服务器运行配置
import { getServerConfig } from "./config.ts";
// 导入MCP服务器创建函数，用于创建MCP服务器实例
import { createServer } from "./mcp.ts";
import { config } from "dotenv";
import { resolve } from "path";

// 使用resolve函数将当前工作目录与.env文件路径合并
config({ path: resolve(process.cwd(), ".env") });

export async function startServer() {
  // 检查是否在stdio模式下运行（例如，通过CLI）
  // 通过环境变量NODE_ENV或命令行参数--stdio来判断运行模式
  const isStdioMode =
    process.env.NODE_ENV === "cli" || process.argv.includes("--stdio");

  const config = getServerConfig();

  process.on("uncaughtException", (error) => {
    console.error("未捕获的异常:", error);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("unhandledRejection:", promise, "原因:", reason);
  });

  // 创建MCP服务器实例，传入认证信息和配置选项
  const server: McpServer = createServer();

  if (isStdioMode) {
    const transport = new StdioServerTransport();
    console.log("stdio模式");
    server.connect(transport);
  } else {
    console.log("非stdio模式");
    startHttpServer(config.port, server, { enableSSE: false });
  }
}

// 如果直接运行此文件
if (require.main === module) {
  console.log("直接运行 ---- ");
  // 调用启动服务器函数，如果失败则捕获错误
  startServer().catch((error) => {
    // 输出错误信息到控制台
    console.error("Failed to start server:", error);
    // 以错误状态码退出进程
    process.exit(1);
  });
}
