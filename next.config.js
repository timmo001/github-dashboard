module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(graphql|gql|txt)$/,
      exclude: /node_modules/,
      loader: "raw-loader",
    });
    return config;
  },
  webpackDevMiddleware: (config) => {
    return config;
  },
};
