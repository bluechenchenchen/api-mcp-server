/*
 * @Author: blue
 * @Date: 2025-07-04 10:40:00
 * @FilePath: /mcp_server_ts/src/config.ts
 */
export function getServerConfig() {
  return {
    port: process.env.PORT || 3000,
  };
}
