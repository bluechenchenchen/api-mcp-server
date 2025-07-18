/*
 * @Author: blue
 * @Date: 2025-06-27 13:42:31
 * @FilePath: /mcp_server_ts/src/tools/figma.ts
 */
import { MCPFunction, MCPServer } from "@modelcontextprotocol/sdk";

interface GetFigmaDataParameters {
  fileKey: string;
  nodeId?: string;
  depth?: number;
}

interface DownloadFigmaImagesParameters {
  fileKey: string;
  nodes: Array<{
    nodeId: string;
    fileName: string;
    imageRef?: string;
  }>;
  localPath: string;
  pngScale?: number;
  svgOptions?: {
    includeId?: boolean;
    outlineText?: boolean;
    simplifyStroke?: boolean;
  };
}

/**
 * 获取Figma数据
 */
const getFigmaData: MCPFunction = {
  name: "get_figma_data",
  description:
    "When the nodeId cannot be obtained, obtain the layout information about the entire Figma file",
  parameters: {
    type: "object",
    properties: {
      fileKey: {
        type: "string",
        description:
          "The key of the Figma file to fetch, often found in a provided URL like figma.com/(file|design)/<fileKey>/...",
      },
      nodeId: {
        type: "string",
        description:
          "The ID of the node to fetch, often found as URL parameter node-id=<nodeId>, always use if provided",
      },
      depth: {
        type: "number",
        description:
          "OPTIONAL. Do NOT use unless explicitly requested by the user. Controls how many levels deep to traverse the node tree,",
      },
    },
    required: ["fileKey"],
  },
  handler: async (params: GetFigmaDataParameters) => {
    // 这里应该实现实际的Figma API调用
    return {
      status: "success",
      data: {
        fileKey: params.fileKey,
        nodeId: params.nodeId,
        depth: params.depth,
      },
    };
  },
};

/**
 * 下载Figma图片
 */
const downloadFigmaImages: MCPFunction = {
  name: "download_figma_images",
  description:
    "Download SVG and PNG images used in a Figma file based on the IDs of image or icon nodes",
  parameters: {
    type: "object",
    properties: {
      fileKey: {
        type: "string",
        description: "The key of the Figma file containing the node",
      },
      nodes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nodeId: {
              type: "string",
              description:
                "The ID of the Figma image node to fetch, formatted as 1234:5678",
            },
            fileName: {
              type: "string",
              description: "The local name for saving the fetched file",
            },
            imageRef: {
              type: "string",
              description:
                "If a node has an imageRef fill, you must include this variable. Leave blank when downloading Vector SVG images.",
            },
          },
          required: ["nodeId", "fileName"],
        },
      },
      localPath: {
        type: "string",
        description:
          "The absolute path to the directory where images are stored in the project",
      },
      pngScale: {
        type: "number",
        description:
          "Export scale for PNG images. Optional, defaults to 2 if not specified",
      },
      svgOptions: {
        type: "object",
        properties: {
          includeId: {
            type: "boolean",
            description: "Whether to include IDs in SVG exports",
          },
          outlineText: {
            type: "boolean",
            description: "Whether to outline text in SVG exports",
          },
          simplifyStroke: {
            type: "boolean",
            description: "Whether to simplify strokes in SVG exports",
          },
        },
      },
    },
    required: ["fileKey", "nodes", "localPath"],
  },
  handler: async (params: DownloadFigmaImagesParameters) => {
    // 这里应该实现实际的Figma API调用和文件下载
    return {
      status: "success",
      downloaded: params.nodes.map((node) => ({
        nodeId: node.nodeId,
        fileName: node.fileName,
        path: `${params.localPath}/${node.fileName}`,
      })),
    };
  },
};

/**
 * 注册Figma工具
 */
export function registerFigmaTools(mcp: MCPServer) {
  mcp.addTool(getFigmaData);
  mcp.addTool(downloadFigmaImages);
}
