import { SwaggerDoc } from "./types/index.js";
import axios from "axios";

// https://github.com/APIDevTools/swagger-parser

export async function fetchDocumentation(url: string): Promise<SwaggerDoc> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const response = await axios.get(url, {
    headers,
    timeout: 15000,
  });
  return simplifySwaggerDoc(response.data);
}

/**
 * Simplify Swagger documentation by converting it to a flat API list format
 */
export async function simplifySwaggerDoc(
  doc: any
): Promise<Promise<SwaggerDoc>> {
  const simplified: SwaggerDoc = {
    openapi: doc.openapi || doc.swagger,
    info: {
      title: doc.info?.title,
      description: doc.info?.description,
      version: doc.info?.version,
    },
    apiList: [],
  };

  // Build tag name mapping
  const tagMap = new Map<string, string>();
  (doc.tags || []).forEach((tag: any) => {
    tagMap.set(tag.name, tag.name);
  });

  // Convert paths to apiList
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
        tags.length > 0 ? tagMap.get(tags[0]) || tags[0] : "Uncategorized";

      // Convert parameters
      const parameters = (specAny.parameters || []).map((param: any) => ({
        name: param.name,
        in: param.in,
        required: param.required || false,
        type: param.schema?.type || "string",
      }));

      // Build response example
      const responseExample = {
        code: 0,
        data: {},
        msg: "",
      };

      // If there's a response schema, try to build example data
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
 * Build example data based on schema
 */
function buildExampleFromSchema(
  schema: any,
  schemas: any,
  depth: number = 0
): any {
  if (!schema || depth > 3) return {}; // Add depth limit

  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    if (!schemas[refName]) return {}; // Return empty object if reference doesn't exist
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
    if (depth > 2) return []; // Array depth limit
    return [buildExampleValue(schema.items, schemas, depth + 1)];
  }

  return buildExampleValue(schema, schemas, depth + 1);
}

/**
 * Build example value
 */
function buildExampleValue(schema: any, schemas: any, depth: number = 0): any {
  if (!schema || depth > 3) return ""; // Add depth limit

  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    if (!schemas[refName]) return ""; // Return empty string if reference doesn't exist
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
      if (depth > 2) return []; // Array depth limit
      return [buildExampleValue(schema.items, schemas, depth + 1)];
    case "object":
      return buildExampleFromSchema(schema, schemas, depth + 1);
    default:
      return "";
  }
}
