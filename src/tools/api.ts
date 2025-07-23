/*
 * @Author: blue
 * @Date: 2025-06-27 13:42:31
 * @FilePath: /api-mcp-server/src/tools/api.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import axios from "axios";
import { config } from "dotenv";
// import { z } from "zod";

// TypeScript接口定义
interface SwaggerInfo {
  title?: string;
  description?: string;
  version?: string;
}

interface SwaggerDoc {
  openapi?: string;
  info?: SwaggerInfo;
  apiList: Array<{
    module: string;
    path: string;
    method: string;
    summary: string;
    parameters: Array<{
      name: string;
      in: string;
      required: boolean;
      type: string;
    }>;
    responses: {
      code: number;
      data: any;
      msg: string;
    };
  }>;
}

/**
 * 精简Swagger文档，转换为扁平化的API列表格式
 */
function simplifySwaggerDoc(doc: any): SwaggerDoc {
  const simplified: SwaggerDoc = {
    openapi: doc.openapi || doc.swagger,
    info: {
      title: doc.info?.title,
      description: doc.info?.description,
      version: doc.info?.version,
    },
    apiList: [],
  };

  // 构建tag名称映射
  const tagMap = new Map<string, string>();
  (doc.tags || []).forEach((tag: any) => {
    tagMap.set(tag.name, tag.name);
  });

  // 转换paths为apiList
  for (const [path, methods] of Object.entries(doc.paths || {})) {
    for (const [method, spec] of Object.entries(methods as any)) {
      if (
        !["get", "post", "put", "delete", "patch"].includes(
          method.toLowerCase()
        )
      ) {
        continue;
      }

      const specAny = spec as any;
      const tags = specAny.tags || [];
      const module =
        tags.length > 0 ? tagMap.get(tags[0]) || tags[0] : "未分类";

      // 转换参数
      const parameters = (specAny.parameters || []).map((param: any) => ({
        name: param.name,
        in: param.in,
        required: param.required || false,
        type: param.schema?.type || "string",
      }));

      // 构建响应示例
      const responseExample = {
        code: 0,
        data: {},
        msg: "",
      };

      // 如果有响应schema，尝试构建示例数据
      if (specAny.responses?.["200"]?.content?.["*/*"]?.schema?.$ref) {
        const refPath = specAny.responses["200"].content["*/*"].schema.$ref;
        const schemaName = refPath.split("/").pop();
        const schema = doc.components?.schemas?.[schemaName];
        if (schema) {
          responseExample.data = buildExampleFromSchema(
            schema,
            doc.components?.schemas
          );
        }
      }

      simplified.apiList.push({
        module,
        path,
        method,
        summary: specAny.summary || "",
        parameters,
        responses: responseExample,
      });
    }
  }

  return simplified;
}

/**
 * 根据schema构建示例数据
 */
function buildExampleFromSchema(
  schema: any,
  schemas: any,
  depth: number = 0
): any {
  if (!schema || depth > 3) return {}; // 添加深度限制

  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    if (!schemas[refName]) return {}; // 如果引用不存在，返回空对象
    return buildExampleFromSchema(schemas[refName], schemas, depth + 1);
  }

  if (schema.type === "object") {
    const result: any = {};
    for (const [key, prop] of Object.entries(schema.properties || {})) {
      result[key] = buildExampleValue(prop as any, schemas, depth + 1);
    }
    return result;
  }

  if (schema.type === "array") {
    if (depth > 2) return []; // 数组深度限制
    return [buildExampleValue(schema.items, schemas, depth + 1)];
  }

  return buildExampleValue(schema, schemas, depth + 1);
}

/**
 * 构建示例值
 */
function buildExampleValue(schema: any, schemas: any, depth: number = 0): any {
  if (!schema || depth > 3) return ""; // 添加深度限制

  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    if (!schemas[refName]) return ""; // 如果引用不存在，返回空字符串
    return buildExampleFromSchema(schemas[refName], schemas, depth + 1);
  }

  switch (schema.type) {
    case "string":
      return schema.format === "date-time" ? "" : "";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return false;
    case "array":
      if (depth > 2) return []; // 数组深度限制
      return [buildExampleValue(schema.items, schemas, depth + 1)];
    case "object":
      return buildExampleFromSchema(schema, schemas, depth + 1);
    default:
      return "";
  }
}

/**
 * 查询 API 接口文档工具
 */
const tool = {
  name: "get_api_list",
  description: `
    查询 API 接口文档，查看全部api接口并返回
    
    Returns:
        str: 全部API接口文档内容或错误提示
        
    Examples:
        >>> get_api_list()
        "全部API文档内容..."
  `,

  handler: async (url?: string): Promise<string> => {
    try {
      // 从环境变量获取文档URL
      const docUrl = url || process.env.DOC_URL || config().parsed?.DOC_URL;
      if (!docUrl) {
        return "错误：未找到DOC_URL环境变量，请在MCP配置中设置DOC_URL";
      }

      // 验证URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(docUrl);
      } catch {
        return "无效的URL格式，请提供完整的URL（包含http://或https://）";
      }

      if (!parsedUrl.protocol || !parsedUrl.hostname) {
        return "无效的URL格式，请提供完整的URL（包含http://或https://）";
      }

      // 设置请求头
      const headers = {
        Accept: "application/json",
        "User-Agent": "MCP-Swagger-Fetcher/1.0",
      };

      // 发送请求获取文档
      const response = await axios.get(docUrl, {
        headers,
        timeout: 15000,
      });

      // 处理JSON响应
      const contentType = response.headers["content-type"]?.toLowerCase() || "";

      if (contentType.includes("json")) {
        try {
          // 获取原始文档
          const originalDoc = response.data;

          // 精简文档
          const simplifiedDoc = simplifySwaggerDoc(originalDoc);

          // 返回精简后的JSON，不做美化输出以减少体积
          console.log("simplifiedDoc", simplifiedDoc);
          return JSON.stringify(simplifiedDoc);
        } catch (error) {
          console.log("error", error);
          return "API响应格式错误：无效的JSON格式";
        }
      } else {
        // 非JSON格式直接返回文本（可能有精简需求）
        return response.data;
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          return "请求超时，请检查URL是否可访问或稍后重试";
        }
        return `请求API文档失败: ${error.message}`;
      }
      return `获取API文档时发生错误: ${error.message}`;
    }
  },
};

/**
 * 注册API工具
 */
export function registerApiTool(mcp: McpServer) {
  mcp.registerTool(
    "get_api_list",
    {
      title: "获取API文档",
      description: tool.description,
      inputSchema: {
        // url: z
        //   .string()
        //   .url()
        //   .optional()
        //   .describe(
        //     "API文档URL,可选,从根目录的.env读取给我, 比如 DOC_URL = http://localhost:3000/api-docs"
        //   ),
      },
    },
    async ({ url }: { url?: string }) => {
      console.log("url", url);
      const result = await tool.handler(url);
      return {
        content: [{ type: "text", text: result }],
      };
    }
  );
}
