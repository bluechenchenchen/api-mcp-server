/*
 * @Author: blue
 * @Date: 2025-07-04 10:12:40
 * @FilePath: /api-mcp-server/src/server-sse.ts
 */
import { Logger } from "./utils/logger";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// SSE模式开关
let sseEnabled = false;

// SSE传输记录
export const sseTransports: Record<string, SSEServerTransport> = {};

/**
 * 设置SSE模式状态
 * @param enabled 是否启用SSE模式
 */
export function setSSEMode(enabled: boolean) {
  sseEnabled = enabled;
  Logger.log(`SSE模式已${enabled ? "启用" : "禁用"}`);
}

/**
 * 获取SSE模式状态
 * @returns SSE模式是否启用
 */
export function isSSEEnabled(): boolean {
  return sseEnabled;
}

/**
 * 处理SSE连接的GET请求
 */
export async function handleSSEConnection(
  req: express.Request,
  res: express.Response,
  mcpServer: McpServer
) {
  if (!sseEnabled) {
    res.status(403).send("SSE模式当前已禁用");
    return;
  }

  const transport = new SSEServerTransport("/messages", res);
  Logger.log(`新的SSE连接建立: ${transport.sessionId}`);
  Logger.log("/sse 请求头:", req.headers);
  Logger.log("/sse 请求体:", req.body);

  sseTransports[transport.sessionId] = transport;
  res.on("close", () => {
    delete sseTransports[transport.sessionId];
  });

  await mcpServer.connect(transport);
}

/**
 * 处理SSE消息的POST请求
 */
export async function handleSSEMessage(
  req: express.Request,
  res: express.Response
) {
  if (!sseEnabled) {
    res.status(403).send("SSE模式当前已禁用");
    return;
  }

  const sessionId = req.query.sessionId as string;
  const transport = sseTransports[sessionId];
  if (transport) {
    Logger.log(`收到SSE消息: ${sessionId}`);
    Logger.log("/messages 请求头:", req.headers);
    Logger.log("/messages 请求体:", req.body);
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send(`没有找到会话ID为 ${sessionId} 的传输`);
    return;
  }
}

/**
 * 关闭所有SSE传输
 */
export async function closeSSETransports() {
  for (const sessionId in sseTransports) {
    try {
      await sseTransports[sessionId]?.close();
      delete sseTransports[sessionId];
    } catch (error) {
      Logger.error(`关闭SSE传输对象时出错: ${sessionId}:`, error);
    }
  }
}
