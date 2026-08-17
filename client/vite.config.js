import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // target: "http://localhost:5000",
        target: "https://afyacare-chronic-disease-management.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
