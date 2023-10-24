import adapter from "@sveltejs/adapter-static";

const dev = process.argv.includes("dev");

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // default options are shown. On some platforms
      // these options are set automatically — see below
      pages: "dist",
      assets: "dist",
      fallback: null,
      precompress: false,
      strict: true,
    }),
    alias: {
      "$components/*": "./src/lib/components/*",
      "$data/*": "./src/data/*",
      "$assets/*": "./src/assets/*",
      "$stores/*": "./src/lib/stores/*",
    },
    paths: {
      base: dev ? "" : process.env.BASE_PATH,
    },
  },
};

export default config;
