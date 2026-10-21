// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import fips_list from "$data/server/county_fips_list.json";
import { load_place } from "$lib/server/place_data";

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return fips_list.map((fips) => ({
    fips,
  }));
}

/** @type {import('./$types').PageServerLoad} */
export function load({ params, fetch }) {
  return load_place("county", params.fips, fetch);
}
