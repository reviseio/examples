import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths, so the build works from any subdirectory.
  base: "./",
  plugins: [react()],
  // Yjs identifies its own types with `instanceof`, so this app and the SDK
  // must load the same copy. Keep them on the same side of the optimizer.
  resolve: { dedupe: ["yjs", "y-protocols"] },
  optimizeDeps: { exclude: ["@reviseio/editor", "yjs", "y-protocols"] },
  build: { chunkSizeWarningLimit: 4000 },
});
