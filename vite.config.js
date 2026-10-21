// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import archieml from "rollup-plugin-archieml";

export default defineConfig({
  plugins: [sveltekit(), archieml()],
});
