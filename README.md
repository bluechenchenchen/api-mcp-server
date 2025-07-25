# api-mcp-server

English | [简体中文](README.zh-CN.md)

<div align="center">
  <h1>API MCP Server</h1>
  <p>A Swagger/OpenAPI Documentation Retrieval Tool Based on MCP (Model Context Protocol)</p>
  <br />
</div>

<br/>

This is a Swagger/OpenAPI documentation retrieval tool based on MCP (Model Context Protocol). It can fetch and parse Swagger/OpenAPI documentation from specified URLs and supports multiple transport methods.

## ✨ Features

- Fetch Swagger/OpenAPI documentation from remote URLs
- Support for Swagger 2.0 and OpenAPI 3.x formats
- Multiple transport methods:
  - stdio: Standard input/output mode
  - http: HTTP server mode
  - sse: Server-Sent Events mode
- Automatic port allocation and failover
- CORS support
- Comprehensive error handling

## Getting Started

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

### Command Line Arguments

- `--transport <stdio|http|sse>`: Choose transport method (default: stdio)
- `--port <number>`: HTTP/SSE server port (default: 3000)
- `--doc-url <url>`: Swagger/OpenAPI documentation URL (required)

## 💻 Development

```bash
# Clone the repository
git clone https://github.com/bluechenchenchen/api-mcp-server.git

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build
```

## 📋 Requirements

- Node.js >= 16.0.0
- npm >= 6.0.0 or pnpm >= 6.0.0

## 📄 License

MIT
