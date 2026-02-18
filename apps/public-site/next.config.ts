import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Vercel already traces runtime files; standalone is only needed for custom containers.
  ...(isVercel ? {} : { output: "standalone" }),
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
