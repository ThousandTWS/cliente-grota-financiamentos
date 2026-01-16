import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  /**
   * Standalone output makes it easier to copy only the runtime
   * dependencies into the production container image.
   */
  output: "standalone",
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
