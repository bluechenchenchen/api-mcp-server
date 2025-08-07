/**
 * Parser Configuration Options
 */
export interface ParserOptions {
  /** Whether to include read-only fields */
  includeReadOnly?: boolean;
  /** Whether to include write-only fields */
  includeWriteOnly?: boolean;
  /** Whether to generate only required fields */
  requiredOnly?: boolean;
  /** Default minimum number of items for array types */
  defaultMinItems?: number;
}

/**
 * API Information
 */
export interface ApiInfo {
  /** API path */
  path: string;
  /** HTTP method */
  method: string;
  /** API summary or description */
  summary?: string;
  /** Request type */
  reqType?: "header" | "query" | "body" | "form";
  /** Request example */
  reqExample?: any;
  /** Response example */
  resExample?: any;
}

/**
 * Document Basic Information
 */
export interface DocInfo {
  /** API title */
  title?: string;
  /** API version */
  version?: string;
  /** API description */
  description?: string;
}

/**
 * Parse Result
 */
export interface ParseResult {
  /** API list */
  apiList: ApiInfo[];
  /** API documentation information */
  apiInfo: DocInfo;
}

/**
 * Schema Type
 */
export type SchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object";

/**
 * Base Schema Definition
 */
export interface BaseSchema {
  type?: SchemaType;
  format?: string;
  description?: string;
  default?: any;
  example?: any;
  enum?: any[];
  readOnly?: boolean;
  writeOnly?: boolean;
  required?: string[];
  properties?: Record<string, BaseSchema>;
  items?: BaseSchema;
  $ref?: string;
  allOf?: BaseSchema[];
  // Extended properties
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  multipleOf?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
}

/**
 * Swagger 2.0 Base Parameter Definition
 */
export interface BaseParameter {
  name: string;
  in: "query" | "header" | "path" | "formData" | "body";
  description?: string;
  required?: boolean;
}

/**
 * Swagger 2.0 Parameter Definition
 */
export interface Swagger2Parameter
  extends BaseParameter,
    Omit<BaseSchema, "required"> {
  type?: SchemaType;
  schema?: BaseSchema;
  items?: BaseSchema;
  format?: string;
}

/**
 * OpenAPI 3.0 Parameter Definition
 */
export interface OpenAPI3Parameter extends BaseParameter {
  schema?: BaseSchema;
  content?: Record<string, { schema: BaseSchema }>;
}

/**
 * OpenAPI 3.0 Request Body Definition
 */
export interface OpenAPI3RequestBody {
  description?: string;
  content: Record<string, { schema: BaseSchema }>;
  required?: boolean;
}

/**
 * Swagger 2.0 Document
 */
export interface Swagger2Document {
  swagger: "2.0";
  info?: DocInfo;
  paths: Record<
    string,
    Record<
      string,
      {
        parameters?: Swagger2Parameter[];
        responses?: Record<
          string,
          {
            description?: string;
            schema?: BaseSchema;
          }
        >;
        summary?: string;
        description?: string;
      }
    >
  >;
  definitions?: Record<string, BaseSchema>;
}

/**
 * OpenAPI 3.0 Document
 */
export interface OpenAPI3Document {
  openapi: string;
  info?: DocInfo;
  paths: Record<
    string,
    Record<
      string,
      {
        parameters?: OpenAPI3Parameter[];
        requestBody?: OpenAPI3RequestBody;
        responses?: Record<
          string,
          {
            description?: string;
            content?: Record<string, { schema: BaseSchema }>;
          }
        >;
        summary?: string;
        description?: string;
      }
    >
  >;
  components?: {
    schemas?: Record<string, BaseSchema>;
  };
}
