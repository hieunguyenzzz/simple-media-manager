import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "minio-api.hieunguyen.dev",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
