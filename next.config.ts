import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pure static export: no server runtime, no API routes, nothing for a
  // pasted secret to be sent to. `next build` emits the site into `out/`.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
