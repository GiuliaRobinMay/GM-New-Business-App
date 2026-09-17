import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export so the app can be hosted anywhere (Netlify, Vercel, GitHub Pages)
  // and installed on a phone as a PWA. No server needed for v0.1 — data is local-first.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
