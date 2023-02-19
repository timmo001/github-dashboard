/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(graphql|gql|txt)$/,
      exclude: /node_modules/,
      loader: "raw-loader",
    });
    return config;
  },
};

module.exports = nextConfig;
