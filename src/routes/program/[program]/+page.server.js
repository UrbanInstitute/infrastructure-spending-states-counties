import { base } from "$app/paths";
import { error } from "@sveltejs/kit";
import programs_list from "$data/server/programs_simple.json";
import { slugify_program, deslugify_program } from "$lib/utils";

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return programs_list.map(({ short_name }) => ({
    program: slugify_program(short_name),
  }));
}

// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
  // find the matching county and include all of the fields by default
  /** @ts-ignore */
  const program = await fetch(
    `${base}/data/server/program/${deslugify_program(params.program)}.json`
  ).then((res) => res.json());
  if (!program) {
    error(404, `Program not found`);
  }
  return program;
}
