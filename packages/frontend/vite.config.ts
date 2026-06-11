import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import nodeStdlibPolyfills from "vite-plugin-node-stdlib-browser";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  define: {
    global: "globalThis",
  },
  resolve: {
    dedupe: ["effect", "@effect/platform"],
    alias: {
      "npm:viem": "viem",
      "npm:viem/accounts": "viem/accounts",
      "npm:viem@2.37.3": "viem",
      "npm:viem@2.37.3/accounts": "viem/accounts",
      "npm:@sinclair/typebox@^0.34.41": "@sinclair/typebox",
      "npm:@sinclair/typebox@0.34.41": "@sinclair/typebox",
      "npm:@sinclair/typebox@^0.34.30": "@sinclair/typebox",
    },
  },
  build: {
    target: "esnext",
    minify: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: [".js", ".cjs"],
      ignoreDynamicRequires: true,
    },
  },
  plugins: [
    nodePolyfills({
      protocolImports: true,
      overrides: {
        fs: "memfs",
        "node:fs": "memfs",
      },
    }),
    nodeStdlibPolyfills(),
    wasm(),
  ],
  optimizeDeps: {
    exclude: ["@midnight-ntwrk/onchain-runtime"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
