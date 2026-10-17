import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// In local development, /api/proxy is forwarded to the upstream API so the
// browser never makes a cross-origin request. In production the same path is
// served by the Vercel Function in api/proxy.ts.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/proxy": {
        target: "https://studyapkmod.free.nf",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, "/tbapi/api.php"),
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
