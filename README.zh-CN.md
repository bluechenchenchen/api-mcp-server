# api-mcp-server

[English](README.md) | 简体中文

<div align="center">
  <h1> API MCP 服务器</h1>
  <p>基于MCP（模型上下文协议）的Swagger/OpenAPI文档获取工具</p>
  <br />
</div>

<br/>

这是一个基于 MCP（模型上下文协议）的 Swagger/OpenAPI 文档获取工具。它可以从指定的 URL 获取并解析 Swagger/OpenAPI 文档，并支持多种传输方式。

## ✨ 特性

- 从远程 URL 获取 Swagger/OpenAPI 文档
- 支持 Swagger 2.0 和 OpenAPI 3.x 格式
- 多种传输方式：
  - stdio：标准输入/输出模式
  - http：HTTP 服务器模式
  - sse：服务器发送事件模式
- 自动端口分配和故障转移
- CORS 支持
- 全面的错误处理

## 开始使用

### MacOS / Linux

```json
{
  "mcpServers": {
    "api-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "api-mcp-server",
        "--transport",
        "stdio",
        "--doc-url",
        "xxx"
      ]
    }
  }
}
```

### Windows

```json
{
  "mcpServers": {
    "api-mcp-server": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "api-mcp-server",
        "--transport",
        "stdio",
        "--doc-url",
        "xxx"
      ]
    }
  }
}
```

### 命令行参数

- `--transport <stdio|http|sse>`：选择传输方式（默认：stdio）
- `--port <number>`：HTTP/SSE 服务器端口（默认：3000）
- `--doc-url <url>`：Swagger/OpenAPI 文档 URL（必需）

## 💻 开发

```bash
# 克隆仓库
git clone https://github.com/bluechenchenchen/api-mcp-server.git

# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建
pnpm build
```

## 📋 要求

- Node.js >= 16.0.0
- npm >= 6.0.0 或 pnpm >= 6.0.0

## 📄 许可证

MIT
