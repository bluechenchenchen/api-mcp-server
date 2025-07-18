/*
 * @Author: blue
 * @Date: 2025-07-04 10:23:12
 * @FilePath: /api-mcp-server/src/cli.ts
 */
// 导入stdio服务器传输模块，用于标准输入输出通信
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startHttpServer } from "./server";
// 导入服务器配置获取函数，用于获取服务器运行配置
import { getServerConfig } from "./config";
// 导入MCP服务器创建函数，用于创建MCP服务器实例
import { createServer } from "./mcp";
import { config } from "dotenv";
import { resolve } from "path";
import { Command } from "commander";

// 使用resolve函数将当前工作目录与.env文件路径合并
config({ path: resolve(process.cwd(), ".env") });

// 使用commander解析命令行参数
const program = new Command()
  .name("api-mcp-server")
  .version("1.0.0")
  .option("--transport <stdio|http|sse>", "transport type", "stdio") // 设置传输类型选项
  .option("--port <number>", "port for HTTP/SSE transport", "3000") // 设置端口选项
  .option("--enable-sse", "enable SSE transport", false) // 设置SSE选项
  .option("--enable-http", "enable HTTP transport", false) // 设置HTTP选项
  .option("--enable-stdio", "enable stdio transport", true) // 设置stdio选项
  .option("--doc-url <url>", "document url", "http://localhost:3000/api-docs") // 设置文档URL选项
  .allowUnknownOption() // let MCP Inspector / other wrappers pass through extra flags  // 允许未知选项通过
  .parse(process.argv); // 解析命令行参数

const cliOptions = program.opts<{
  // 获取解析后的命令行选项
  transport: string;
  port: string;
  enableSSE: boolean;
  enableHttp: boolean;
  enableStdio: boolean;
  docUrl: string;
}>();

// 设置环境变量
process.env.TRANSPORT = cliOptions.transport;
process.env.PORT = cliOptions.port;
process.env.DOC_URL = cliOptions.docUrl;

export async function startServer() {
  // 检查是否在stdio模式下运行（例如，通过CLI）
  // 通过环境变量NODE_ENV或命令行参数--stdio来判断运行模式
  const isStdioMode =
    process.env.TRANSPORT === "stdio" ||
    process.env.NODE_ENV === "cli" ||
    process.argv.includes("--stdio");

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
