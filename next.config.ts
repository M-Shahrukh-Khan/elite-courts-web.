import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Offline builds must not replace the normal build with bundled test content.
  distDir:
    process.env.ELITE_OFFLINE_PREVIEW === "true"
      ? ".next-offline"
      : process.env.ELITE_QA_PREVIEW === "true" &&
          process.env.NODE_ENV !== "production"
        ? ".next-qa"
        : ".next",
  serverExternalPackages: ["tesseract.js", "@tesseract.js-data/eng", "pdfkit"],
  // Tesseract starts a Node worker at runtime. Static tracing sees the worker
  // entry file, but not the files it loads through its relative require("..")
  // call. Include the complete OCR runtime only with the checkout endpoint so
  // the Vercel function has the worker, WASM core and English language data.
  outputFileTracingIncludes: {
    "/api/orders": [
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
      "./node_modules/@tesseract.js-data/eng/**/*",
      // These are loaded inside Tesseract's worker thread, outside Next.js's
      // normal module graph, so Vercel cannot discover them automatically.
      "./node_modules/bmp-js/**/*",
      "./node_modules/wasm-feature-detect/**/*",
    ],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  images: {
    qualities: [75, 82, 85, 90, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "elitecourts.com.pk",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Stock photography still referenced by a few Cafe menu items until
        // they are replaced with Elite Courts photos through the portal.
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // TikTok cover images are served from rotating CDN hostnames, so they
      // are rendered unoptimised rather than allow-listed here.
    ],
  },
};

export default nextConfig;
