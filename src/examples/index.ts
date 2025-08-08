import { parseApiDoc } from "../parser";
import type { Swagger2Document, OpenAPI3Document } from "../parser/types";

import openAiOpenApi3Data from "./openAi-openapi3-data";
import openAiSwagger2Data from "./openAi-swagger2-data";

// Usage Example
async function example() {
  // Parse Swagger 2.0 documentation
  const swagger2Result = await parseApiDoc(
    openAiSwagger2Data as unknown as Swagger2Document
  );
  console.log("Swagger 2.0 Parsing Result:", swagger2Result);

  // Parse OpenAPI 3.0 documentation
  const openApi3Result = await parseApiDoc(
    openAiOpenApi3Data as unknown as OpenAPI3Document
  );
  console.log("OpenAPI 3.0 Parsing Result:", openApi3Result);
}

example().catch(console.error);
