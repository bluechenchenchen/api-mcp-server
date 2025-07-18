<!--
 * @Author: blue
 * @Date: 2025-07-02 16:17:14
 * @FilePath: /mcp_server_ts/README.md
-->

# MCP Server TypeScript

基于 TypeScript 实现的 Model Context Protocol (MCP) 服务器。支持 SSE（Server-Sent Events）连接，用于实时数据传输。

## 功能特性

- 基于 Express 框架的 HTTP 服务器
- 支持 MCP 协议的工具函数实现
- 支持 SSE 实时数据传输
- 包含示例工具：
  - 获取当前时间
  - 查询城市天气
  - 查询员工绩效
  - Figma 设计稿操作
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

建立 SSE 连接的端点。

请求参数：

- `doc_url` (query string): 可选，文档 URL
- `x-mcp-env` (header): 可选，JSON 格式的环境变量

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

### 1. getCurrentTime

- 描述：获取当前时间
- 参数：
  ```json
  {
    "random_string": "string" // 占位参数
  }
  ```
- 返回：格式化的时间字符串 (YYYY-MM-DD HH:mm:ss)

### 2. get_api_list

- 描述：获取所有可用的 API 接口文档
- 参数：
  ```json
  {
    "random_string": "string" // 占位参数
  }
  ```
- 返回：API 文档内容字符串

### 3. get_figma_data

- 描述：获取 Figma 文件或节点数据
- 参数：
  ```json
  {
    "fileKey": "string", // Figma 文件 key
    "nodeId": "string", // 可选，节点 ID
    "depth": "number" // 可选，遍历深度
  }
  ```
- 返回：Figma 数据对象

### 4. download_figma_images

- 描述：下载 Figma 文件中的图片
- 参数：
  ```json
  {
    "fileKey": "string", // Figma 文件 key
    "nodes": [
      {
        // 要下载的节点列表
        "nodeId": "string", // 节点 ID
        "fileName": "string", // 保存的文件名
        "imageRef": "string" // 可选，图片引用
      }
    ],
    "localPath": "string", // 保存路径
    "pngScale": "number", // 可选，PNG 缩放比例
    "svgOptions": {
      // 可选，SVG 选项
      "includeId": "boolean",
      "outlineText": "boolean",
      "simplifyStroke": "boolean"
    }
  }
  ```
- 返回：下载结果对象

## 项目结构

```
src/
├── dev.ts              # 开发服务器入口
├── sse/
│   └── server.ts      # SSE 服务器实现
├── tools/
│   ├── api.ts         # API 工具
│   ├── time.ts        # 时间工具
│   └── figma.ts       # Figma 工具
└── types/
    └── mcp.d.ts       # MCP 类型定义
```

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
