import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/v1": {
        target: process.env.REMORA_API_PROXY || "http://127.0.0.1:8443",
        changeOrigin: true,
      },
      "/gateway": {
        target: process.env.REMORA_GATEWAY_PROXY || "http://127.0.0.1:7700",
        changeOrigin: true,
        ws: true,
        rewrite: (p) => p.replace(/^\/gateway/, ""),
      },
    },
  },
});
