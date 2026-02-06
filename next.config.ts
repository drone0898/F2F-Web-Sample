import type { NextConfig } from "next";
import path from "path";

const sdkPath = path.resolve(__dirname, "../F2F-Engine/packages/sdk-ts/src/index.ts");

const nextConfig: NextConfig = {
  // React Compiler (stable in Next.js 16)
  reactCompiler: true,

  // Standalone output for Docker deployment
  output: "standalone",

  // Transpile local SDK package (TypeScript source only, no build step)
  transpilePackages: ["@f2f-engine/sdk"],

  // Turbopack config for resolving local symlinked SDK
  turbopack: {
    resolveAlias: {
      "@f2f-engine/sdk": [sdkPath],
    },
  },

  // Webpack config (fallback for `next build --webpack`)
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@f2f-engine/sdk": sdkPath,
      },
    };
    return config;
  },
};

export default nextConfig;
