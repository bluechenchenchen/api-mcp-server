/*
 * @Author: blue
 * @Date: 2025-06-27 13:42:31
 * @FilePath: /mcp_server_ts/src/tools/api.ts
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

interface SwaggerTag {
  name?: string;
}

interface SwaggerParameter {
  name?: string;
  in?: string;
  required?: boolean;
  schema?: {
    $ref?: string;
  };
}

interface SwaggerResponse {
  description?: string;
}

interface SwaggerMethodSpec {
  summary?: string;
  operationId?: string;
  parameters?: SwaggerParameter[];
  responses?: {
    "200"?: SwaggerResponse;
  };
}

interface SwaggerProperty {
  type?: string;
  description?: string;
  items?: {
    $ref?: string;
    type?: string;
  };
  enum?: any[];
}

interface SwaggerDefinition {
  title?: string;
  description?: string;
  properties?: Record<string, SwaggerProperty>;
}

interface SwaggerDoc {
  swagger?: string;
  info?: SwaggerInfo;
  tags?: SwaggerTag[];
  paths?: Record<string, Record<string, SwaggerMethodSpec>>;
  definitions?: Record<string, SwaggerDefinition>;
}

/**
 * 精简Swagger文档，只保留关键信息
 */
function simplifySwaggerDoc(doc: any): SwaggerDoc {
  const simplified: SwaggerDoc = {
    swagger: doc.swagger,
    info: {
      title: doc.info?.title,
      description: doc.info?.description,
      version: doc.info?.version,
    },
    tags: doc.tags?.map((tag: any) => ({ name: tag.name })) || [],
    paths: {},
    definitions: {},
  };

  // 精简paths
  for (const [path, methods] of Object.entries(doc.paths || {})) {
    const simplifiedMethods: Record<string, SwaggerMethodSpec> = {};

    for (const [method, spec] of Object.entries(methods as any)) {
      // 只保留HTTP方法 (GET/POST等)，忽略其他属性
      if (
        !["get", "post", "put", "delete", "patch"].includes(
          method.toLowerCase()
        )
      ) {
        continue;
      }

      const specAny = spec as any;
      const simplifiedSpec: SwaggerMethodSpec = {
        summary: specAny.summary,
        operationId: specAny.operationId,
      };

      // 精简参数
      if (specAny.parameters) {
        const simplifiedParams: SwaggerParameter[] = [];
        for (const param of specAny.parameters) {
          const paramInfo: SwaggerParameter = {
            name: param.name,
            in: param.in,
            required: param.required || false,
          };

          // 处理body参数schema
          if (param.schema) {
            const ref = param.schema.$ref;
            if (ref) {
              const refName = ref.split("/").pop();
              paramInfo.schema = { $ref: `#/definitions/${refName}` };
            }
          }

          simplifiedParams.push(paramInfo);
        }
        simplifiedSpec.parameters = simplifiedParams;
      }

      // 只保留200响应
      const responses = specAny.responses;
      if (responses) {
        const okResponse =
          responses["200"] ||
          Object.entries(responses).find(([code]) => code.startsWith("2"))?.[1];

        if (okResponse) {
          simplifiedSpec.responses = {
            "200": {
              description: okResponse.description || "OK",
            },
          };
        }
      }

      simplifiedMethods[method] = simplifiedSpec;
    }

    if (Object.keys(simplifiedMethods).length > 0) {
      simplified.paths![path] = simplifiedMethods;
    }
  }

  // 精简definitions
  for (const [defName, defSchema] of Object.entries(doc.definitions || {})) {
    const defSchemaAny = defSchema as any;
    const simplifiedDef: SwaggerDefinition = {
      title: defSchemaAny.title,
      description: defSchemaAny.description,
      properties: {},
    };

    for (const [propName, propSchema] of Object.entries(
      defSchemaAny.properties || {}
    )) {
      const propSchemaAny = propSchema as any;
      const simplifiedProp: SwaggerProperty = {
        type: propSchemaAny.type,
        description: propSchemaAny.description,
      };

      // 特殊处理数组类型
      if (simplifiedProp.type === "array" && propSchemaAny.items) {
        const items = propSchemaAny.items;
        if (items.$ref) {
          const refName = items.$ref.split("/").pop();
          simplifiedProp.items = { $ref: `#/definitions/${refName}` };
        } else {
          simplifiedProp.items = { type: items.type };
        }
      }

      // 处理枚举值 (简明显示)
      if (propSchemaAny.enum) {
        simplifiedProp.enum = propSchemaAny.enum;
      }

      simplifiedDef.properties![propName] = simplifiedProp;
    }

    if (Object.keys(simplifiedDef.properties!).length > 0) {
      simplified.definitions![defName] = simplifiedDef;
    }
  }

  return simplified;
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
