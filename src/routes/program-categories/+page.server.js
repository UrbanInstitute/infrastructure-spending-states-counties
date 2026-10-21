// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import categories_simple from "$data/server/categories_simple.json";

// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export function load() {
  return { categories_simple };
}
