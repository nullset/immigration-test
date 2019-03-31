import copy from "rollup-plugin-cpy";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import scss from "rollup-plugin-scss";
import postcss from "rollup-plugin-postcss";

module.exports = {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "iife"
  },
  plugins: [
    babel(),
    // scss(),
    postcss({
      use: ["sass"]
      // exec: true,
    }),
    copy({
      files: ["src/index.html"],
      dest: "dist"
    }),
    resolve(),
    commonjs({
      include: ["node_modules/**"]
    })
  ]
};
