import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle libsodium-wrappers - the @tychee/sdk uses it but it doesn't work in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };

      // Alias libsodium-wrappers to a browser-compatible stub
      config.resolve.alias = {
        ...config.resolve.alias,
        'libsodium-wrappers': false,
      };
    }

    return config;
  },

  // Transpile the SDK package
  transpilePackages: ['@tychee/sdk'],
};

export default nextConfig;
