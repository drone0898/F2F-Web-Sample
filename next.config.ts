import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler (stable in Next.js 16)
  reactCompiler: true,

  // Standalone output for Docker deployment
  output: "standalone",

  // Environment variables
  env: {
    F2F_ENGINE_URL: process.env.F2F_ENGINE_URL || "http://localhost:5001",
  },
};

export default nextConfig;
