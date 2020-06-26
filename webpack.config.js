/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/main.ts",
  target: "node",
  node: {
    fsevents: "empty",
  },
  externals: [
    nodeExternals(),
    {
      fsevents: "fsevents",
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
