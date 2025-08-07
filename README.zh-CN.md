# api-mcp-server

[English](README.md) | 简体中文

<div align="center">
  <h1> API MCP 服务器</h1>
  <p>基于MCP（模型上下文协议）的Swagger/OpenAPI文档获取工具</p>
  <br />
</div>

<br/>

这是一个基于 MCP（模型上下文协议）的 Swagger/OpenAPI 文档获取工具。它可以从指定的 URL 获取并解析 Swagger/OpenAPI 文档，对文档进行智能清洗和优化以减少 token 消耗，并通过标准化格式提供给智能 IDE（如 Cursor）使用。该工具支持多种传输方式，使 IDE 能够轻松获取和理解 API 文档，从而实现接口的智能提示、自动补全和代码生成等功能。

## ✨ 特性

- 智能文档处理

  - 从远程 URL 获取 Swagger/OpenAPI 文档
  - 支持 Swagger 2.0 和 OpenAPI 3.x 格式
  - 智能清洗和优化文档结构，减少 token 消耗
  - 提取关键 API 信息，包括端点、参数、响应格式等

- IDE 友好设计

  - 标准化的 API 描述格式
  - 自动生成示例请求和响应
  - 智能参数提示和类型推断
  - 支持代码自动补全和生成

- 多样化传输方式

  - stdio：标准输入/输出模式，适用于命令行工具
  - http：HTTP 服务器模式，支持 RESTful 接口
  - sse：服务器发送事件模式，实现实时通信

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

### 使用示例

#### 1. 基本使用

```bash
# 使用 stdio 模式（默认）
npx -y api-mcp-server --doc-url https://api.example.com/swagger.json

# 使用 HTTP 模式
npx -y api-mcp-server --transport http --doc-url https://api.example.com/swagger.json

# 使用 SSE 模式并指定端口
npx -y api-mcp-server --transport sse --port 3001 --doc-url https://api.example.com/swagger.json
```

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

## 调试

使用 @modelcontextprotocol/inspector

```
npx @modelcontextprotocol/inspector
```

![](./src/images/inspector.png)

## 运行示例

```bash
pnpm example
```

## 📋 要求

- Node.js >= 16.0.0
- npm >= 6.0.0 或 pnpm >= 6.0.0

## 📄 许可证

MIT
