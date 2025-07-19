/**
 * CLI options interface
 */
export interface CliOptions {
  transport: "stdio" | "http" | "sse";
  port: number | string;
  enableSSE: boolean;
  enableHttp: boolean;
  enableStdio: boolean;
  docUrl: string;
}

/**
 * Server configuration interface
 */
export interface ServerConfig extends CliOptions {}

/**
 * Transport configuration interface
 */
export interface TransportConfig {
  type: "stdio" | "http" | "sse";
  options?: {
    port?: number;
    enableSSE?: boolean;
  };
}
