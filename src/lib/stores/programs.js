import { base } from "$app/paths";
import { readable } from "svelte/store";
import programs_simple from "$data/server/programs_simple.json";

/** @typedef {{name: string, short_name: string, type: string, categories: string[], county_level: number}} ProgramInfo */

/** @type {import("svelte/store").Writable<Array<ProgramInfo>>}*/
export const program_list = readable(programs_simple);

const p_map = new Map();
for (const p of programs_simple) {
  p_map.set(p.short_name, p);
}
/** @type {import("svelte/store").Writable<Map<string, any>>}*/
export const program_map = readable(p_map);
