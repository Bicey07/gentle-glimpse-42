// The Lovable config already provides React, TanStack, Tailwind and Nitro.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    {
      name: "quiet-space-buffer",
      enforce: "post",
      config(_config, environment) {
        // Nitro aliases builtins late. Keep the Solana browser SDK's Buffer bundled.
        const buffer = fileURLToPath(new URL("./node_modules/buffer/index.js", import.meta.url));
        const find =
          environment.command === "build" ? /^(node:)?buffer(?:\/index\.js)?$/ : /^(node:)?buffer$/;
        return { resolve: { alias: [{ find, replacement: buffer }] } };
      },
    },
  ],
  vite: {
    // Action routes supply their own CORS headers, including preflight responses.
    server: { cors: false },
    environments: {
      // Solana packages expose browser/node conditions; Workers use the browser builds.
      nitro: { resolve: { conditions: ["workerd", "browser", "module", "import", "default"] } },
    },
  },
  tanstackStart: { server: { entry: "server" } },
});
