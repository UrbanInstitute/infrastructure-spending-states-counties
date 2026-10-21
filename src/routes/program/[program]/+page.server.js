// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { base } from "$app/paths";
import { error, redirect } from "@sveltejs/kit";
import programs_list from "$data/server/programs_simple.json";
import old_to_new_program_map from "$data/server/old_to_new_program_map.json";
import { slugify_program, deslugify_program } from "$lib/utils";

const live_programs = new Set(
  programs_list.map(({ short_name }) => short_name)
);

// programs from past releases that no longer have a page, mapped to their
// successor program (null when there is none)
/** @type {Map<string, string | null>} */
const removed_programs = new Map();
for (const {
  old_program_short_name,
  new_program_short_name,
} of old_to_new_program_map) {
  if (old_program_short_name && !live_programs.has(old_program_short_name)) {
    removed_programs.set(old_program_short_name, new_program_short_name);
  }
}

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return [...live_programs, ...removed_programs.keys()].map((short_name) => ({
    program: slugify_program(short_name),
  }));
}

// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
  const short_name = deslugify_program(params.program);

  // keep old program URLs alive: send them to the successor's page, else home
  if (removed_programs.has(short_name)) {
    const successor = removed_programs.get(short_name);
    redirect(
      308,
      successor ? `${base}/program/${slugify_program(successor)}/` : `${base}/`
    );
  }

  // find the matching program and include all of the fields by default
  const program_resp = await fetch(
    `${base}/data/server/program/${short_name}.json`
  );
  // a missing file is a 404, not a SyntaxError from parsing its "not found"
  // body as JSON
  if (!program_resp.ok) {
    error(404, `Program not found`);
  }
  return program_resp.json();
}
