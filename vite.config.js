import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
  },
  server: command === "serve" ? {
    proxy: {
      "/decompress": "http://localhost:4000",
    },
  } : undefined,
}));
