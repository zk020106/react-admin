import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { zip } from "zip-a-folder";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

function zipAfterBuildPlugin(): Plugin {
  return {
    name: "zip-after-build",
    apply: "build",
    async closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const zipPath = path.resolve(__dirname, "dist.zip");

      if (!existsSync(distDir)) {
        return;
      }

      await rm(zipPath, { force: true });
      await zip(distDir, zipPath, { compression: "high" });
    },
  };
}

function vendorChunk(id: string) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  const normalizedId = id.replaceAll("\\", "/");

  if (
    normalizedId.includes("/node_modules/react/") ||
    normalizedId.includes("/node_modules/react-dom/") ||
    normalizedId.includes("/node_modules/scheduler/")
  ) {
    return "vendor-react";
  }

  if (normalizedId.includes("/node_modules/@tanstack/")) {
    return "vendor-tanstack";
  }

  if (normalizedId.includes("/node_modules/radix-ui/")) {
    return "vendor-radix";
  }

  if (normalizedId.includes("/node_modules/lucide-react/")) {
    return "vendor-icons";
  }

  if (
    normalizedId.includes("/node_modules/ahooks/") ||
    normalizedId.includes("/node_modules/@ahooksjs/")
  ) {
    return "vendor-hooks";
  }

  if (
    normalizedId.includes("/node_modules/cmdk/") ||
    normalizedId.includes("/node_modules/next-themes/") ||
    normalizedId.includes("/node_modules/sonner/")
  ) {
    return "vendor-ui";
  }

  return "vendor";
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    zipAfterBuildPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
