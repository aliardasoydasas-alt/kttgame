import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist"
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
