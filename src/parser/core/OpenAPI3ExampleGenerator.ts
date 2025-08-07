import { BaseExampleGenerator } from "./BaseExampleGenerator";
import { OpenAPI3Document, BaseSchema } from "../types";

/**
 * OpenAPI 3.0 Example Generator
 */
export class OpenAPI3ExampleGenerator extends BaseExampleGenerator {
  protected declare doc: OpenAPI3Document;

  /**
   * Generate examples from OpenAPI 3.0 documentation
   */
  generateFromOpenAPI(
    path: string,
    method: string,
    type: "request" | "response" = "response",
    statusCode: string = "200"
  ) {
    if (!this.doc) throw new Error("OpenAPI documentation is not initialized");

    try {
      const pathObj = this.doc.paths[path];
      if (!pathObj) throw new Error(`Path not found: "${path}"`);

      const methodObj = pathObj[method.toLowerCase()];
      if (!methodObj)
        throw new Error(`Method "${method}" not found for path "${path}"`);

      if (type === "request") {
        // Process header parameters
        const headerParams = methodObj.parameters?.filter(
          (p) => p.in === "header"
        );
        if (headerParams?.length) {
          const headerSchema: BaseSchema = {
            type: "object",
            properties: {},
            required: [],
          };
          headerParams.forEach((param) => {
            if (headerSchema.properties && param.schema) {
              headerSchema.properties[param.name] = param.schema;
            }
            if (param.required && headerSchema.required) {
              headerSchema.required.push(param.name);
            }
          });
          return {
            data: this.generateExample(headerSchema),
            reqType: "header",
          };
        }

        // Process query parameters
        const queryParams = methodObj.parameters?.filter(
          (p) => p.in === "query"
        );
        if (queryParams?.length) {
          const querySchema: BaseSchema = {
            type: "object",
            properties: {},
            required: [],
          };
          queryParams.forEach((param) => {
            if (querySchema.properties && param.schema) {
              querySchema.properties[param.name] = param.schema;
            }
            if (param.required && querySchema.required) {
              querySchema.required.push(param.name);
            }
          });
          return {
            data: this.generateExample(querySchema),
            reqType: "query",
          };
        }

        // Process request body
        if (methodObj.requestBody) {
          const content = methodObj.requestBody.content;
          const mediaType = Object.keys(content)[0]; // Get the first media type
          if (mediaType && content[mediaType].schema) {
            return {
              data: this.generateExample(content[mediaType].schema),
              reqType: "body",
            };
          }
        }

        return {};
      } else {
        // Process response
        const response = methodObj.responses?.[statusCode];
        if (!response)
          throw new Error(`Status code not found: "${statusCode}"`);

        if (response.content) {
          const mediaType = Object.keys(response.content)[0];
          if (mediaType && response.content[mediaType].schema) {
            return this.generateExample(response.content[mediaType].schema);
          }
        }

        return {};
      }
    } catch (error) {
      console.error("Error generating example:", error);
      return {};
    }
  }
}
