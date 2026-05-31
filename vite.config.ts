import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tanstackRouter from "@tanstack/router-plugin/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tanstackRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/infrastructure": path.resolve(__dirname, "./src/infrastructure"),
      "@/config": path.resolve(__dirname, "./src/config"),
    },
  },
  server: {
    port: 3000,
  },
})
