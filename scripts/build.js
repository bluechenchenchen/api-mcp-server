/*
 * @Author: blue
 * @Date: 2025-07-18 17:36:15
 * @FilePath: /api-mcp-server/scripts/build.js
 */
const esbuild = require("esbuild");
const { execSync } = require("child_process");

// 首先生成类型声明文件
console.log("Generating type declarations...");
execSync("tsc --emitDeclarationOnly --declaration --outDir dist", {
  stdio: "inherit",
});

// esbuild 配置
const buildOptions = {
  entryPoints: ["src/cli.ts"],
  bundle: true,
  platform: "node",
  target: "node16",
  outdir: "dist",
  minify: true, // 启用压缩
  sourcemap: true,
  format: "cjs",
  metafile: true,
  treeShaking: true, // 启用 tree shaking
  drop: ["debugger", "console"], // 删除调试代码
  define: {
    "process.env.NODE_ENV": '"production"',
  },
};

// 执行构建
async function build() {
  try {
    console.log("Building with esbuild...");
    const result = await esbuild.build(buildOptions);

    // 输出构建结果分析
    const text = await esbuild.analyzeMetafile(result.metafile);
    console.log("Build analysis:\n" + text);

    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
