const webpack = require('webpack');

module.exports = function override(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": require.resolve("crypto-browserify"),
      "util": require.resolve("util/"),
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "os": require.resolve("os-browserify/browser"),
      "fs": false,
      "dns": false,
      "net": false,
      "tls": false,
    };
   config.plugins.push(
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    );
   config.ignoreWarnings = [/Failed to parse source map/];
   config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
    });
   config.module.rules.push({
        test: /pg-native/,
          loader: 'null-loader'
    });
  return config;
};