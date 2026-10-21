// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import categories_simple from "$data/server/categories_simple.json";
import programs_simple from "$data/server/programs_simple.json";
import old_to_new_program_map from "$data/server/old_to_new_program_map.json";

/**
 * Resolving a map deep-link value to an infrastructure category.
 *
 * The geography maps select **categories** and their links say `?category=`,
 * but the value cannot be assumed to be one. The param was `?program=` through
 * the program-centric version of the tool, and the geography routes still
 * accept that spelling — so a bookmark or a shared link can arrive carrying a
 * program short name, including one of the 51 programs that no longer have a
 * page. Those are exactly the links the param was kept alive for.
 *
 * Unresolvable values fall back to the caller's default rather than surfacing
 * an error: the visitor did nothing wrong, and a correctly-labelled default is
 * friendlier than an error state. The miss is logged, like `get_funding_data`'s.
 */

/**
 * The category a geography page opens on when the URL names none, or names one
 * the place received no funding for.
 */
export const DEFAULT_GEOGRAPHY_CATEGORY = "roads_and_bridges";

const category_slugs = new Set(
  categories_simple.map(({ category }) => category)
);

// Every program in `programs_simple.json` carries exactly one category, so this
// mapping needs no tie-breaking. (Checked against all 71; the field is an array
// because the pipeline allows for more, not because any program uses more.)
/** @type {Map<string, string>} */
const program_categories = new Map();
for (const { short_name, categories } of programs_simple) {
  if (short_name && categories?.length) {
    program_categories.set(short_name, categories[0]);
  }
}

// Programs from past releases that no longer exist, mapped to their successor
// (null when there is none). These are the slugs an old bookmark is most likely
// to carry, which is the case the param was added for in the first place.
// `+page.server.js` builds the same set for the program route's 308 redirects.
/** @type {Map<string, string | null>} */
const removed_programs = new Map();
for (const {
  old_program_short_name,
  new_program_short_name,
} of old_to_new_program_map) {
  if (
    old_program_short_name &&
    !program_categories.has(old_program_short_name)
  ) {
    removed_programs.set(old_program_short_name, new_program_short_name);
  }
}

/**
 * The category a live program belongs to.
 *
 * @param {string | null} short_name
 * @returns {string | null} The category slug, or null if `short_name` is not a
 *   current program.
 */
export function program_to_category(short_name) {
  if (!short_name) return null;
  return program_categories.get(short_name) ?? null;
}

/**
 * Resolve a deep-link value to the category the map should select.
 *
 * Categories win over programs on a tie. `ports` is the one slug that is both
 * an infrastructure category and a federal program, and on a category-driven
 * map the category is what it has always meant.
 *
 * @param {string | null} value The raw query param value.
 * @returns {string | null} A category slug, or null if the value names nothing
 *   the map can show.
 */
export function resolve_map_category(value) {
  if (!value) return null;
  if (category_slugs.has(value)) return value;

  const direct = program_to_category(value);
  if (direct) return direct;

  // A removed program: follow it to its successor, then to that program's
  // category. Eight of the 111 entries have no successor and end here.
  if (removed_programs.has(value)) {
    return program_to_category(removed_programs.get(value) ?? null);
  }

  return null;
}
