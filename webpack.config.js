/* eslint-disable @typescript-eslint/no-var-requires */

const isDev = process.env.NODE_ENV === "development";

const webpack = require("webpack");
const path = require("path");

module.exports = {
  mode: isDev ? "development" : "production",

  entry: ["@babel/polyfill", "./src/index.ts"],

  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",
    filename: "bundle.js",
  },

  module: {
    rules: [
      {
        exclude: /node_modules/,
        use: ["babel-loader", "ts-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  devtool: "source-map",
  watchOptions: {
    ignored: /node_modules/,
  },

  plugins: [
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true),
    }),
  ],
};
