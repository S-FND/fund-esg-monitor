
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Set default environment if not specified
  const env = process.env.VITE_APP_ENV || 'dev';
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Make environment available at build time
      __APP_ENV__: JSON.stringify(env),
    },
    build: {
      outDir: `dist-${env}`,
      sourcemap: env !== 'prod',
    },
  };
});
