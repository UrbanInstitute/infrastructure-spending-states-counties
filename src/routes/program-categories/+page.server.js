import programs from "$data/server/programs_simple.json";

const categories = Array.from(
  new Set(programs.flatMap(({ categories }) => categories))
).sort();
/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  return {
    categories,
    programs,
  };
}
