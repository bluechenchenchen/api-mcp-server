declare module "@modelcontextprotocol/sdk" {
  export interface MCPFunction {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
    handler: (params: any) => Promise<any>;
  }

  export class MCPServer {
    constructor(config: { tools: MCPFunction[] });
    handleRequest(body: any): Promise<any>;
    addTool(tool: MCPFunction): void;
  }
}
