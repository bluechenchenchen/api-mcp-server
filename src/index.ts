/**
 * @fileoverview MCP (Model Context Protocol) 服务器主入口文件
 * @description 实现了一个支持多种传输方式的 MCP 服务器，包括 stdio、HTTP 和 SSE
 * @author blue
 * @date 2025-01-14
 * @version 1.0.0
 */

// 导入 MCP SDK 相关模块
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

/**
 * 创建 MCP 服务器实例
 * @description 初始化一个 MCP 服务器，配置服务器名称和版本信息
 */
const server = new McpServer({
  name: "mcp-server-ts",
  version: "1.0.0",
});

/**
 * 注册示例工具：加法计算器
 * @description 演示如何注册一个简单的工具函数，该工具接受两个数字参数并返回它们的和
 */
server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  })
);

/**
 * 启动 MCP 服务器 - stdio 传输方式
 * @description 创建标准输入输出传输通道，用于命令行环境下的 MCP 通信
 */
const transport = new StdioServerTransport();

// 将服务器连接到 stdio 传输通道
server.connect(transport);

/**
 * 创建 Express 应用实例
 * @description 用于处理 HTTP 请求和 SSE 连接
 */
const app = express();

// 配置 Express 中间件，解析 JSON 请求体
app.use(express.json());

/**
 * POST /mcp - 处理 MCP 协议的 HTTP 请求
 * @description 支持流式 HTTP 传输方式，每个请求创建独立的传输通道
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 */
app.post("/mcp", async (req: Request, res: Response) => {
  try {
    // 为每个请求创建新的流式 HTTP 传输通道
    const transport: StreamableHTTPServerTransport =
      new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // 使用默认的会话 ID 生成器
      });

    // 监听请求关闭事件，清理资源
    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });

    // 将服务器连接到传输通道
    await server.connect(transport);
    // 处理 MCP 请求
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    // 错误处理：返回 JSON-RPC 2.0 格式的错误响应
    res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603, // 内部错误代码
        message: "Internal server error",
      },
      id: null,
    });
  }
});

/**
 * GET /mcp - 处理 GET 请求（不允许）
 * @description 返回 405 Method Not Allowed 错误，因为 MCP 协议只支持 POST 请求
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 */
app.get("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000, // 方法不允许错误代码
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

/**
 * DELETE /mcp - 处理 DELETE 请求（不允许）
 * @description 返回 405 Method Not Allowed 错误，因为 MCP 协议只支持 POST 请求
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 */
app.delete("/mcp", async (req: Request, res: Response) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000, // 方法不允许错误代码
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

/**
 * 传输通道管理器
 * @description 用于管理不同类型的传输通道实例，支持会话级别的连接管理
 */
const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>, // 流式 HTTP 传输通道
  sse: {} as Record<string, SSEServerTransport>, // SSE 传输通道
};

/**
 * GET /sse - 建立 SSE (Server-Sent Events) 连接
 * @description 创建 SSE 传输通道，支持实时双向通信
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 */
app.get("/sse", async (req, res) => {
  // 创建新的 SSE 传输通道
  const transport = new SSEServerTransport("/messages", res);
  // 将传输通道存储到管理器中，使用会话 ID 作为键
  transports.sse[transport.sessionId] = transport;

  // 监听连接关闭事件，清理资源
  res.on("close", () => {
    delete transports.sse[transport.sessionId];
  });

  // 将服务器连接到 SSE 传输通道
  await server.connect(transport);
});

/**
 * POST /messages - 处理 SSE 消息
 * @description 接收客户端发送的消息并通过对应的 SSE 传输通道处理
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 */
app.post("/messages", async (req, res) => {
  // 从查询参数中获取会话 ID
  const sessionId = req.query.sessionId as string;
  // 根据会话 ID 查找对应的传输通道
  const transport = transports.sse[sessionId];

  if (transport) {
    // 找到对应的传输通道，记录日志并处理消息
    console.log(`Received SSE message for sessionId ${sessionId}`);
    console.log("/messages request headers:", req.headers);
    console.log("/messages request body:", req.body);
    await transport.handlePostMessage(req, res);
  } else {
    // 未找到对应的传输通道，返回错误
    res.status(400).send(`No transport found for sessionId ${sessionId}`);
    return;
  }
});

/**
 * 启动 HTTP 服务器
 * @description 在端口 3000 上启动 Express 服务器，监听 MCP 请求
 * @param error - 启动错误对象
 */
app.listen(3000, (error) => {
  if (error) {
    // 启动失败，记录错误并退出进程
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  // 启动成功，记录服务器信息
  console.log(`MCP Stateless Streamable HTTP Server listening on port 3000`);
});
