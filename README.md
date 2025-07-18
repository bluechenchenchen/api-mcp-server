<!--
 * @Author: blue
 * @Date: 2025-07-02 16:17:14
 * @FilePath: /api-mcp-server/README.md
-->

# MCP Server TypeScript

基于 TypeScript 实现的 Model Context Protocol (MCP) 服务器。支持 SSE（Server-Sent Events）连接，用于实时数据传输。

## 功能特性

- 基于 Express 框架的 HTTP 服务器
- 支持 MCP 协议的工具函数实现
- 支持 SSE 实时数据传输
- 包含示例工具：

  - API 文档查询

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 使用 nodemon 热重载
pnpm dev

# 或使用 ts-node 直接运行
pnpm start:dev
```

### 调试

```bash
yarn ui
```

npm error notarget No matching version found for @floating-ui/utils@^0.2.10.

```bash
npm cache clean --force
```

### 构建

```bash
pnpm build
```

### 生产环境运行

```bash
pnpm start
```

## API 接口

### SSE 连接

#### GET /sse

### MCP 消息

#### POST /messages

处理 MCP 协议请求的主要端点。

请求体格式：

```json
{
  "name": "工具名称",
  "parameters": {
    // 工具所需参数
  }
}
```

## 可用工具

### 1. get_api_list

- 描述：获取所有可用的 API 接口文档
- 参数：
  ```json
  {
    "random_string": "string" // 占位参数
  }
  ```
- 返回：API 文档内容字符串

## 开发说明

- 使用 TypeScript 进行开发
- 使用 nodemon 实现热重载
- 使用 Express 作为 Web 框架
- 使用 express-sse 实现 SSE
- 使用 @modelcontextprotocol/sdk 实现 MCP 协议

## 环境变量

- `PORT`: 服务器端口号（默认：18081）
- `HOST`: 服务器主机地址（默认：0.0.0.0）
- `DOC_URL`: 文档 URL（可选）

## 贡献指南

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

ISC
