import { parseApiDoc } from "../parser";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const openAiOpenApi3Data = require("./openAi-openapi3-data.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const openAiSwagger2Data = require("./openAi-swagger2-data.js");

// Usage Example
async function example() {
  // Parse Swagger 2.0 documentation
  const swagger2Result = await parseApiDoc(openAiSwagger2Data);
  console.log("Swagger 2.0 Parsing Result:", swagger2Result);

  // Parse OpenAPI 3.0 documentation
  const openApi3Result = await parseApiDoc(openAiOpenApi3Data);
  console.log("OpenAPI 3.0 Parsing Result:", openApi3Result);
}

example().catch(console.error);
