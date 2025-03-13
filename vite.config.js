import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import archieml from "rollup-plugin-archieml";

export default defineConfig({
  plugins: [sveltekit(), archieml()],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
});
