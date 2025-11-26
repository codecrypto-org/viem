import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/anvil',
        destination: 'http://127.0.0.1:8545',
      },
    ];
  },
};

export default nextConfig;
