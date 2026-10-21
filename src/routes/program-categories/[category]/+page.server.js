// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { base } from "$app/paths";
import { error } from "@sveltejs/kit";
import categories_simple from "$data/server/categories_simple.json";
import { slugify_program, deslugify_program } from "$lib/utils";

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return categories_simple.map(({ category }) => ({
    category: slugify_program(category),
  }));
}

// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
  // Convert URL slug back to underscore-based key
  const category_key = deslugify_program(params.category);

  const category_resp = await fetch(
    `${base}/data/server/category/${category_key}.json`
  );
  if (!category_resp.ok) {
    error(404, `Category not found`);
  }
  const category_data = await category_resp.json();
  return { category_data, categories_simple };
}
