import { Swagger2ExampleGenerator } from "./core/Swagger2ExampleGenerator";
import { OpenAPI3ExampleGenerator } from "./core/OpenAPI3ExampleGenerator";
import type {
  ParserOptions,
  ParseResult,
  Swagger2Document,
  OpenAPI3Document,
} from "./types";
import { BaseExampleGenerator } from "./core/BaseExampleGenerator";

/**
 * Parse Swagger/OpenAPI documentation
 * Automatically detect document type and use corresponding parser
 */
export async function parseApiDoc(
  doc: Swagger2Document | OpenAPI3Document,
  options: ParserOptions = {}
): Promise<ParseResult> {
  const parseResult: ParseResult = { apiList: [], apiInfo: {} };

  try {
    if (!doc || !doc.paths) {
      return parseResult;
    }

    // Determine document type
    const isSwagger2 = "swagger" in doc && doc.swagger === "2.0";
    const isOpenApi3 = "openapi" in doc && doc.openapi.startsWith("3");

    if (!isSwagger2 && !isOpenApi3) {
      throw new Error(
        "Unsupported document format. Only Swagger 2.0 and OpenAPI 3.0 are supported."
      );
    }

    if (isSwagger2) {
      const generator = new Swagger2ExampleGenerator(options);
      await generator.bundle(doc);

      for (const path in doc.paths) {
        for (const method in doc.paths[path]) {
          if (method === "parameters") continue; // Skip path-level parameters

          const apiItem = doc.paths[path][method];
          const { data: reqExample, reqType } = generator.generateFromSwagger(
            path,
            method,
            "request"
          );
          const resExample = generator.generateFromSwagger(
            path,
            method,
            "response"
          );

          const apiInfo = {
            path,
            method,
            summary: apiItem.summary || apiItem.description,
          };

          if (reqType) Object.assign(apiInfo, { reqType });
          if (reqExample) Object.assign(apiInfo, { reqExample });
          if (resExample) Object.assign(apiInfo, { resExample });

          parseResult.apiList.push(apiInfo);
        }
      }
    } else {
      const generator = new OpenAPI3ExampleGenerator(options);
      await generator.bundle(doc);

      for (const path in doc.paths) {
        for (const method in doc.paths[path]) {
          if (method === "parameters") continue; // Skip path-level parameters

          const apiItem = doc.paths[path][method];
          const { data: reqExample, reqType } = generator.generateFromOpenAPI(
            path,
            method,
            "request"
          );
          const resExample = generator.generateFromOpenAPI(
            path,
            method,
            "response"
          );

          const apiInfo = {
            path,
            method,
            summary: apiItem.summary || apiItem.description,
          };

          if (reqType) Object.assign(apiInfo, { reqType });
          if (reqExample) Object.assign(apiInfo, { reqExample });
          if (resExample) Object.assign(apiInfo, { resExample });

          parseResult.apiList.push(apiInfo);
        }
      }
    }

    parseResult.apiInfo = doc.info || {};
  } catch (error) {
    console.error("Error parsing API documentation:", error);
  }

  return parseResult;
}

export class BaseParser extends BaseExampleGenerator {
  constructor(doc: Swagger2Document | OpenAPI3Document) {
    super();
    this.doc = doc;
  }

  public async getApiInfoByPath(path: string) {
    await this.bundle(this.doc);
    const apiInfo = this.doc.paths[path];
    return apiInfo || {};
  }
}

export * from "./types";
