import { BaseExampleGenerator } from "./BaseExampleGenerator";
import { Swagger2Document, BaseSchema, Swagger2Parameter } from "../types";

/**
 * Swagger 2.0 Example Generator
 */
export class Swagger2ExampleGenerator extends BaseExampleGenerator {
  protected declare doc: Swagger2Document;

  /**
   * Convert Swagger parameter to BaseSchema
   */
  private convertParamToSchema(param: Swagger2Parameter): BaseSchema {
    if (param.schema) {
      return param.schema;
    }

    const schema: BaseSchema = {
      type: param.type,
      format: param.format,
      description: param.description,
      default: param.default,
      example: param.example,
      enum: param.enum,
      items: param.items,
    };

    return schema;
  }

  /**
   * Generate examples from Swagger 2.0 API documentation
   */
  generateFromSwagger(
    path: string,
    method: string,
    type: "request" | "response" = "response",
    statusCode: string = "200"
  ) {
    if (!this.doc) throw new Error("Swagger documentation is not initialized");

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
            if (headerSchema.properties) {
              headerSchema.properties[param.name] =
                this.convertParamToSchema(param);
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
            if (querySchema.properties) {
              querySchema.properties[param.name] =
                this.convertParamToSchema(param);
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
        const bodyParam = methodObj.parameters?.find((p) => p.in === "body");
        if (bodyParam?.schema) {
          return {
            data: this.generateExample(bodyParam.schema),
            reqType: "body",
          };
        }

        // Process form parameters
        const formParams = methodObj.parameters?.filter(
          (p) => p.in === "formData"
        );
        if (formParams?.length) {
          const formSchema: BaseSchema = {
            type: "object",
            properties: {},
            required: [],
          };
          formParams.forEach((param) => {
            if (formSchema.properties) {
              formSchema.properties[param.name] =
                this.convertParamToSchema(param);
            }
            if (param.required && formSchema.required) {
              formSchema.required.push(param.name);
            }
          });
          return {
            data: this.generateExample(formSchema),
            reqType: "form",
          };
        }

        return {};
      } else {
        // Process response
        const response = methodObj.responses?.[statusCode];
        if (!response)
          throw new Error(`Status code not found: "${statusCode}"`);

        if (response.schema) {
          return this.generateExample(response.schema);
        }

        return {};
      }
    } catch (error) {
      console.error("Error generating example:", error);
      return {};
    }
  }
}
