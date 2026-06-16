import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` emits an `out/` directory deployable
  // anywhere (including Vercel) with zero environment variables.
  output: "export",
  reactStrictMode: true,
  // Static export cannot use the on-demand Image Optimization API.
  images: { unoptimized: true },
};

export default nextConfig;
