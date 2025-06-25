import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Resolver los problemas de ethers con Next.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      zlib: require.resolve("browserify-zlib"),
      path: require.resolve("path-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      assert: require.resolve("assert"),
      os: require.resolve("os-browserify"),
      url: require.resolve("url"),
      buffer: require.resolve("buffer"),
      querystring: require.resolve("querystring-es3"),
      util: require.resolve("util/")
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'ethers/lib.esm/crypto': 'ethers/lib.commonjs/crypto',
        'ethers': 'ethers/lib.commonjs',
      };
    }
    
    return config;
  },
};

export default nextConfig;
