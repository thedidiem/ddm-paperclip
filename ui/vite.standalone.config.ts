import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/ddm-paperclip/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      lexical: path.resolve(__dirname, "./node_modules/lexical/Lexical.mjs"),
    },
  },
  build: {
    outDir: "dist-standalone",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "standalone.html"),
    },
  },
});
