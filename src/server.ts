/*
 * @Author: blue
 * @Date: 2025-07-04 10:12:40
 * @FilePath: /api-mcp-server/src/server.ts
 */
import { Logger } from "./utils/logger";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Server } from "http";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import cors from "cors";
import {
  handleSSEConnection,
  handleSSEMessage,
  closeSSETransports,
  sseTransports,
  setSSEMode,
  isSSEEnabled,
} from "./server-sse";

let httpServer: Server | null = null;

const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>,
};

interface ServerOptions {
  // SSE 默认是关闭
  enableSSE?: boolean;
}

export async function startHttpServer(
  port: number | string,
  mcpServer: McpServer,
  options: ServerOptions = {}
) {
  Logger.isHTTP = false;
  Logger.log("startHttpServer", port);

  // 设置SSE模式状态
  setSSEMode(options.enableSSE ?? false);

  const app = express();

  app.use("/mcp", express.json());

  app.use(cors({ origin: "*", exposedHeaders: ["Mcp-Session-Id"] }));

  // StreamableHTTP
  app.post("/mcp", async (req, res) => {
    Logger.log("收到StreamableHTTP请求");
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.streamable[sessionId]) {
      Logger.log("为会话ID重用现有的StreamableHTTP传输:", sessionId);
      transport = transports.streamable[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      Logger.log("为StreamableHTTP会话ID创建新的初始化请求:", sessionId);
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => {
          const newSessionId = randomUUID();
          Logger.log(`Generated new session ID: ${newSessionId}`);
          return newSessionId;
        },
        onsessioninitialized: (sessionId) => {
          Logger.log(`Session initialized with ID: ${sessionId}`);
          transports.streamable[sessionId] = transport;
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) {
          Logger.log(
            `Closing transport for session ID: ${transport.sessionId}`
          );
          delete transports.streamable[transport.sessionId];
        }
      };

      await mcpServer.connect(transport);
    } else {
      Logger.log("Invalid request:", req.body);
      Logger.log(
        `Session ID ${sessionId} not found in transports.streamable. This may occur after server restart.`
      );
      // 开发环境
      const isDev: boolean = true;
      if (isDev) {
        Logger.log("开发环境，根据mcp协议，返回404，客户端会自动重连");
        res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: `Session ID: ${sessionId} not found in transports.streamable. This may occur after server restart.`,
          },
          id: sessionId,
        });
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Session expired, please reinitialize",
            data: {
              requiresReconnect: true,
            },
          },
          id: null,
        });
      }

      return;
    }

    // 处理可流式HTTP请求
    Logger.log("处理StreamableHTTP请求");
    await transport.handleRequest(req, res, req.body);

    Logger.log("StreamableHTTP请求处理完成");
  });

  // 处理SSE流的GET请求（使用StreamableHTTP的内置支持）
  const handleSessionRequest = async (
    req: express.Request,
    res: express.Response
  ) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.streamable[sessionId]) {
      res.status(400).send("无效或缺失的会话ID");
      return;
    }

    Logger.log(`收到会话终止请求: ${sessionId}`);

    try {
      const transport = transports.streamable[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      Logger.error("处理会话终止请求时出错:", error);
      if (!res.headersSent) {
        res.status(500).send("处理会话终止请求时出错");
      }
    }
  };

  app.get("/mcp", handleSessionRequest);
  app.delete("/mcp", handleSessionRequest);

  // SSE路由
  if (options.enableSSE) {
    app.get("/sse", (req, res) => handleSSEConnection(req, res, mcpServer));
    app.post("/messages", handleSSEMessage);
  }

  httpServer = app.listen(port, () => {
    Logger.log(`HTTP服务器监听端口: ${port}`);
    if (options.enableSSE) {
      Logger.log(`SSE连接可用: http://localhost:${port}/sse`);
      Logger.log(`消息端点可用: http://localhost:${port}/messages`);
    }
    Logger.log(`StreamableHTTP连接可用: http://localhost:${port}/mcp`);
  });

  process.on("SIGINT", async () => {
    Logger.log("关闭服务器...");
    await closeTransports(transports.streamable);
    if (options.enableSSE) {
      await closeSSETransports();
    }

    Logger.log("服务器关闭完成");
    process.exit(0);
  });
}

/**
 * 关闭所有传输对象
 * @param transports 传输对象记录
 */
async function closeTransports(
  transports: Record<string, StreamableHTTPServerTransport>
) {
  for (const sessionId in transports) {
    try {
      await transports[sessionId]?.close();
      delete transports[sessionId];
    } catch (error) {
      Logger.error(`关闭传输对象时出错: ${sessionId}:`, error);
    }
  }
}

/**
 * 停止HTTP服务器
 */
export async function stopHttpServer(): Promise<void> {
  if (!httpServer) {
    throw new Error("HTTP服务器未运行");
  }

  return new Promise((resolve, reject) => {
    httpServer!.close((err: Error | undefined) => {
      if (err) {
        reject(err);
        return;
      }
      httpServer = null;
      if (isSSEEnabled()) {
        const closing = Object.values(sseTransports).map((transport) => {
          return transport.close();
        });
        Promise.all(closing).then(() => {
          resolve();
        });
      }
    });
  });
}
