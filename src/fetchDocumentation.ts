/*
 * @Author: blue
 * @Date: 2025-08-07 15:27:25
 * @FilePath: /api-mcp-server/src/fetchDocumentation.ts
 */
import axios from "axios";
import { OpenAPI3Document, Swagger2Document } from "./parser/types";

export async function fetchDocumentation(
  url: string
): Promise<OpenAPI3Document | Swagger2Document> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const response = await axios.get(url, {
    headers,
    timeout: 15000,
  });
  return response.data;
}
