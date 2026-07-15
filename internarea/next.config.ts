import type { NextConfig } from "next";
import path from "node:path";

const workspaceRoot = path.resolve(process.cwd(), "..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  i18n: {
    locales: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],
    defaultLocale: 'en',
  },
  outputFileTracingRoot: workspaceRoot,
  outputFileTracingIncludes: {
    "/*": ["./public/locales/**/*.json"],
  },
  turbopack: { root: workspaceRoot },
  webpack(config, { dev }) {
    if (dev) {
      // Use in-memory cache to avoid Windows file-lock errors
      // (.pack.gz_ → .pack.gz atomic rename fails on Windows).
      // The predev script clears .next on every start so _document.js
      // is always written fresh — no stale-cache issues.
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
