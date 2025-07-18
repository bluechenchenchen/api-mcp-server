/*
 * @Author: blue
 * @Date: 2025-06-30 17:37:12
 * @FilePath: /mcp_server_ts/src/utils/logger.ts
 */
/**
 * 日志工具
 * 提供基本的日志记录功能，根据不同模式输出到不同位置
 */
const getTimestamp = () => new Date().toLocaleString();

export const Logger = {
  isHTTP: false,

  /**
   * 记录普通日志信息
   * 在HTTP模式下输出到console.log，否则输出到console.error
   * @param args 要记录的参数
   */
  log: (...args: any[]) => {
    const timestamp = getTimestamp();
    if (Logger.isHTTP) {
      console.log(`[${timestamp}] [INFO]`, ...args);
    } else {
      console.error(`[${timestamp}] [INFO]`, ...args);
    }
  },

  /**
   * 记录错误日志信息
   * 始终输出到console.error
   * @param args 要记录的参数
   */
  error: (...args: any[]) => {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
  },
};
