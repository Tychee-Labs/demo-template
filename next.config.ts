import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle Node.js polyfills for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    // Force @tychee/sdk to resolve the CJS version (not the broken .mjs)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tychee/sdk': require.resolve('@tychee/sdk'),
    };

    return config;
  },

  // Transpile the SDK package and stellar-wallets-kit
  transpilePackages: [
    '@tychee/sdk',
    '@creit.tech/stellar-wallets-kit',
    '@creit.tech/xbull-wallet-connect',
    'libsodium-wrappers',
  ],

  // Fix ESM/CommonJS interop issues
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
