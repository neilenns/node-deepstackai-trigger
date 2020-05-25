const path = require("path");

module.exports = {
  entry: "./src/main.ts",
  target: "node",
  node: {
    fsevents: "empty",
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
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
