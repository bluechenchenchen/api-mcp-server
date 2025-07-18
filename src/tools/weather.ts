/*
 * @Author: blue
 * @Date: 2025-07-02 16:21:32
 * @FilePath: /mcp_server_ts/src/tools/weather.ts
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import { config } from "dotenv";

interface WeatherParameters {
  city: string;
}

interface LocationAPIResponse {
  code: string;
  location?: Array<{
    id: string;
    name: string;
  }>;
  message?: string;
}

interface WeatherAPIResponse {
  code: string;
  now?: {
    text: string;
    temp: string;
    windDir: string;
  };
  message?: string;
}

/**
 * 通过城市名查询城市ID
 */
async function _getCityLocationId(
  host: string,
  city: string,
  apiKey: string
): Promise<[string | null, string | null]> {
  const geoUrl = `https://${host}/geo/v2/city/lookup`;
  const geoParams = {
    location: city,
    key: apiKey,
  };

  try {
    const geoResp = await axios.get<LocationAPIResponse>(geoUrl, {
      params: geoParams,
      timeout: 5000,
    });

    if (
      geoResp.data.code === "200" &&
      geoResp.data.location &&
      geoResp.data.location.length > 0
    ) {
      const locationInfo = geoResp.data.location[0];
      return [locationInfo.id, locationInfo.name];
    }

    return [null, null];
  } catch (error) {
    throw error;
  }
}

/**
 * 通过城市ID查询天气数据
 */
async function _getWeatherData(
  host: string,
  locationId: string,
  apiKey: string
): Promise<WeatherAPIResponse> {
  const weatherUrl = `https://${host}/v7/weather/now`;
  const weatherParams = {
    location: locationId,
    key: apiKey,
  };

  const weatherResp = await axios.get<WeatherAPIResponse>(weatherUrl, {
    params: weatherParams,
    // timeout: 5000,
  });

  return weatherResp.data;
}

/**
 * 使用和风天气API根据城市名实时查询天气信息（先查城市ID，再查天气）
 */
const tool = {
  name: "get_weather_by_city_cn",
  description: `
        使用和风天气API根据城市名实时查询天气信息（先查城市ID，再查天气）

        Args:
            city (str): 城市名称（如 '深圳'）

        Returns:
            str: 天气描述或错误信息
            
        Examples:
            >>> get_weather_by_city_cn("深圳")
            "深圳 当前天气：阴，气温：25°C，风向：东北风"
        `,

  handler: async ({ city }: WeatherParameters): Promise<string> => {
    const apiKey =
      process.env.QWEATHER_API_KEY || config().parsed?.QWEATHER_API_KEY || "";
    const host =
      process.env.QWEATHER_HOST || config().parsed?.QWEATHER_HOST || "";

    if (!apiKey || !host) {
      return "未配置和风天气API Key或Host";
    }

    try {
      // 1. 先查询城市ID
      const [locationId, cityName] = await _getCityLocationId(
        host,
        city,
        apiKey
      );
      if (!locationId) {
        return `未找到城市：${city}，请检查城市名拼写。`;
      }

      // 2. 用城市ID查询天气
      const weatherData = await _getWeatherData(host, locationId, apiKey);

      if (weatherData.code === "200" && weatherData.now) {
        const now = weatherData.now;
        return `${cityName} 当前天气：${now.text}，气温：${now.temp}°C，风向：${now.windDir}`;
      } else if (weatherData.code === "401") {
        return "认证失败：API Key无效或未授权，请检查和风天气控制台配置。";
      } else if (weatherData.code === "403") {
        return "请求被拒绝：请检查API Key是否有权限、IP白名单或Referer设置。";
      } else if (weatherData.code === "429") {
        return "请求频率超限：请稍后再试，或升级套餐。";
      } else {
        return `查询失败，错误码：${weatherData.code}，信息：${
          weatherData.message || "无详细信息"
        }`;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return `网络请求异常: ${error.message}`;
      } else {
        return `查询天气失败: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    }
  },
};

export function registerWeatherTool(mcp: McpServer) {
  mcp.registerTool(
    tool.name,
    {
      title: "根据城市名实时查询天气信息",
      description: "根据城市名实时查询天气信息",
      inputSchema: { city: z.string().describe("城市名称") },
    },
    async ({ city }) => ({
      content: [{ type: "text", text: await tool.handler({ city }) }],
    })
  );
}
