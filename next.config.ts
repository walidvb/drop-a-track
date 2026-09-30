import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Printed QRs encode the whole URL in uppercase (smaller QR: alphanumeric
  // mode), so /S/<TOKEN> must reach the scan route at /s/[token].
  async rewrites() {
    return [{ source: "/S/:token", destination: "/s/:token" }];
  },
};

export default nextConfig;
