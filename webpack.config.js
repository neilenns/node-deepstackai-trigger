/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Neil Enns. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const path = require("path");

module.exports = {
  entry: "./src/main.ts",
  target: "node",
  node: {
    // From https://github.com/webpack/webpack/issues/1599#issuecomment-186841345
    // This makes __dirname valid in the Docker image and means serve-index
    // can read its files from the public folder.
    __dirname: false,
  },
  externals: {
    fsevents: "fsevents",
  },
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
    fallback: {
      fsevents: false
    },
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
