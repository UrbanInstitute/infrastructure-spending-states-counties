import { error } from "@sveltejs/kit";
import fips_list from "$data/server/county_fips_list.json";
import PlaceData from "$lib/server/place_data";

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return fips_list.map((fips) => ({
    fips,
  }));
}


/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {

  const place_data = new PlaceData("county", params.fips, fetch);
  const place = await place_data.get_data();

  if (!place) {
    error(404, `Place not found`);
  }
  const comparison_buckets = await place_data.get_comparison_buckets();

  return {
    place,
    comparison_buckets,
  };
}
