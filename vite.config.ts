import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

const conditionalPlugins: [string, Record<string, any>][] = [];

// @ts-ignore
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "development"
      ? "/"
      : process.env.VITE_BASE_PATH || "/",
  define: {
    // Polyfill for Node.js Buffer used by sequelize and other packages
    global: {},
    "process.env": {},
    Buffer: ["buffer", "Buffer"],
  },
  build: {
    commonjsOptions: {
      // Explicitly exclude Node.js modules that cause issues in the browser
      exclude: ["sequelize", "mysql2", "pg-hstore", "ws", "bcryptjs"],
    },
  },
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
    exclude: ["pg-hstore", "sequelize", "mysql2", "ws", "bcryptjs"],
  },
  plugins: [
    react({
      plugins: conditionalPlugins,
    }),
    tempo(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
      stream: "stream-browserify",
      util: "util/",
      process: "process/browser",
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
