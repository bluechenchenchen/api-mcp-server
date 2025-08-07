import { ParserOptions, BaseSchema, SchemaType } from "../types";
import SwaggerParser from "@apidevtools/swagger-parser";

/**
 * Base Example Generator Class
 * Provides common example generation functionality
 */
export abstract class BaseExampleGenerator {
  protected options: Required<ParserOptions>;
  protected doc: any;

  constructor(options: ParserOptions = {}) {
    this.options = {
      includeReadOnly: true,
      includeWriteOnly: true,
      requiredOnly: false,
      defaultMinItems: 1,
      ...options,
    };
  }

  /**
   * Parse documentation and resolve circular reference issues
   */
  async bundle(doc: any): Promise<void> {
    if (!doc) throw new Error("API documentation is not initialized");
    this.doc = await SwaggerParser.bundle(doc);
  }

  /**
   * Resolve references
   */
  protected resolveRef(
    ref: string,
    visited: Set<string> = new Set()
  ): BaseSchema {
    if (!ref.startsWith("#/")) {
      throw new Error(`Unsupported reference format: ${ref}`);
    }

    if (visited.has(ref)) {
      console.warn(`Circular reference detected: ${decodeURIComponent(ref)}`);
      return {};
    }
    visited.add(ref);

    const path = ref.substring(2).split("/");
    let schema: any = this.doc;

    for (let segment of path) {
      segment = decodeURIComponent(segment);
      if (!schema[segment]) {
        const keys = Object.keys(schema);
        const matchingKey = keys.find(
          (key) => decodeURIComponent(key) === segment
        );
        if (matchingKey) {
          segment = matchingKey;
        }
      }
      schema = schema[segment];
      if (!schema) {
        throw new Error(
          `Unable to resolve reference: ${ref}, segment: ${segment}`
        );
      }
    }

    const resolvedSchema = { ...schema };

    if (resolvedSchema.properties) {
      const resolvedProperties: Record<string, BaseSchema> = {};
      for (const [key, prop] of Object.entries<BaseSchema>(
        resolvedSchema.properties
      )) {
        if (prop.$ref) {
          resolvedProperties[key] = this.resolveRef(
            prop.$ref,
            new Set([...visited])
          );
        } else {
          const clonedProp = { ...prop };
          if (clonedProp.items?.$ref) {
            clonedProp.items = this.resolveRef(
              clonedProp.items.$ref,
              new Set([...visited])
            );
          }
          resolvedProperties[key] = clonedProp;
        }
      }
      resolvedSchema.properties = resolvedProperties;
    }

    if (resolvedSchema.items?.$ref) {
      resolvedSchema.items = this.resolveRef(
        resolvedSchema.items.$ref,
        new Set([...visited])
      );
    }

    return resolvedSchema;
  }

  /**
   * Generate example value for basic types
   */
  protected generateBasicType(type: SchemaType, schema: BaseSchema = {}): any {
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;
    if (schema.enum?.length) return schema.enum[0];

    switch (type) {
      case "string": {
        if (schema.format) {
          switch (schema.format) {
            case "email":
              return "user@example.com";
            case "uri":
            case "url":
              return "http://example.com";
            case "date":
              return new Date().toISOString().split("T")[0];
            case "date-time":
              return new Date().toISOString();
            case "password":
              return "********";
            case "binary":
              return "(binary)";
            case "byte":
              return "U3dhZ2dlciByb2Nrcw==";
            case "uuid":
              return "123e4567-e89b-12d3-a456-426614174000";
            default:
              return schema.pattern || "string";
          }
        }
        return schema.pattern || "string";
      }
      case "number":
      case "integer": {
        if (schema.minimum !== undefined) return schema.minimum;
        if (schema.maximum !== undefined) return schema.maximum;
        return 0;
      }
      case "boolean":
        return schema.default !== undefined ? schema.default : true;
      default:
        return undefined;
    }
  }

  /**
   * Generate example value for array types
   */
  protected generateArrayExample(schema: BaseSchema): any[] {
    let items = schema.items || {};
    const minItems = schema.minItems || this.options.defaultMinItems;
    const result = [];

    if (items.$ref) {
      items = this.resolveRef(items.$ref);
    }

    for (let i = 0; i < minItems; i++) {
      result.push(this.generateExample(items));
    }

    return result;
  }

  /**
   * Generate example value for object types
   */
  protected generateObjectExample(schema: BaseSchema): Record<string, any> {
    const result: Record<string, any> = {};
    const properties = schema.properties || {};
    const required = schema.required || [];

    for (const [key, prop] of Object.entries<BaseSchema>(properties)) {
      if (this.options.requiredOnly && !required.includes(key)) continue;
      if (!this.options.includeReadOnly && prop.readOnly) continue;
      if (!this.options.includeWriteOnly && prop.writeOnly) continue;

      let resolvedProp = prop;
      if (prop.$ref) {
        resolvedProp = this.resolveRef(prop.$ref);
      }

      result[key] = this.generateExample(resolvedProp);
    }

    return result;
  }

  /**
   * Generate example value for any type
   */
  protected generateExample(schema: BaseSchema): any {
    if (!schema) return undefined;

    if (schema.$ref) {
      const resolvedSchema = this.resolveRef(schema.$ref);
      return this.generateExample(resolvedSchema);
    }

    const type = schema.type || this.inferType(schema);

    switch (type) {
      case "array":
        return this.generateArrayExample(schema);
      case "object":
        return this.generateObjectExample(schema);
      default:
        return this.generateBasicType(type, schema);
    }
  }

  /**
   * Infer schema type
   */
  protected inferType(schema: BaseSchema): SchemaType {
    if (schema.type) return schema.type;
    if (schema.properties) return "object";
    if (schema.items) return "array";
    return "object";
  }

  /**
   * Merge two schemas
   */
  protected mergeSchemas(target: BaseSchema, source: BaseSchema): BaseSchema {
    if (!source || typeof source !== "object") {
      return target;
    }

    const result = { ...target };

    // Merge basic properties
    if (source.type) result.type = source.type;
    if (source.format) result.format = source.format;
    if (source.pattern) result.pattern = source.pattern;
    if (source.example) result.example = source.example;
    if (source.default) result.default = source.default;
    if (source.minimum !== undefined) result.minimum = source.minimum;
    if (source.maximum !== undefined) result.maximum = source.maximum;
    if (source.minLength !== undefined) result.minLength = source.minLength;
    if (source.maxLength !== undefined) result.maxLength = source.maxLength;
    if (source.minItems !== undefined) result.minItems = source.minItems;
    if (source.maxItems !== undefined) result.maxItems = source.maxItems;
    if (source.uniqueItems !== undefined)
      result.uniqueItems = source.uniqueItems;
    if (source.enum)
      result.enum = [...new Set([...(result.enum || []), ...source.enum])];

    // Merge object properties
    if (source.properties) {
      result.properties = result.properties || {};
      for (const [key, prop] of Object.entries(source.properties)) {
        if (result.properties[key]) {
          result.properties[key] = this.mergeSchemas(
            result.properties[key],
            prop
          );
        } else {
          result.properties[key] = prop;
        }
      }
    }

    // Merge required fields
    if (source.required) {
      result.required = [
        ...new Set([...(result.required || []), ...source.required]),
      ];
    }

    // Merge array items
    if (source.items) {
      result.items = this.mergeSchemas(result.items || {}, source.items);
    }

    return result;
  }
}
