// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
      // "/ws": {
      //   target: "http://127.0.0.1:5000",
      //   ws: true,
      //   changeOrigin: true,
      //   secure: false,
      // },
    },
  },
});
