import copy from "rollup-plugin-cpy";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import scss from "rollup-plugin-scss";
import postcss from "rollup-plugin-postcss";

import workbox from "rollup-plugin-workbox";

module.exports = [
  {
    input: "src/index.js",
    output: {
      file: "dist/index.js",
      format: "iife"
    },
    plugins: [
      // workbox({
      //   mode: "generateSW",
      //   render: ({ swDest, count, size }) =>
      //     console.log("📦", swDest, "#️⃣", count, "🐘", size),
      //   workboxConfig: require("./workbox-config")
      // }),
      babel(),
      // scss(),
      postcss({
        use: ["sass"]
        // exec: true,
      }),
      copy({
        files: ["src/index.html", "src/service-worker.js", "src/manifest.json"],
        dest: "dist"
      }),
      copy({
        files: ["src/images"],
        dest: "dist/images"
      }),
      resolve(),
      commonjs({
        include: ["node_modules/**"]
      })
    ]
  },
  {
    input: "src/service-worker.js",
    output: {
      file: "dist/service-worker.js",
      format: "iife"
    }
  }
];
