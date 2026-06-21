import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],
    defaultLocale: 'en',
  },
  turbopack: {},

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
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

