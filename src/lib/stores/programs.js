// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { readable } from "svelte/store";
import programs_simple from "$data/server/programs_simple.json";

/** @typedef {{name: string, short_name: string, type: string, categories: string[], county_level: number}} ProgramInfo */

/** @type {import("svelte/store").Readable<Array<ProgramInfo>>}*/
export const program_list = readable(
  /** @type {Array<ProgramInfo>} */ (/** @type {unknown} */ (programs_simple))
);

const p_map = new Map();
for (const p of programs_simple) {
  p_map.set(p.short_name, p);
}
/** @type {import("svelte/store").Readable<Map<string, any>>}*/
export const program_map = readable(p_map);
