// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { readable } from "svelte/store";
import categories_simple from "$data/server/categories_simple.json";

/** @typedef {{category: string, category_name: string, programs: string[], indicators: string[]}} CategoryInfo */

/** @type {import("svelte/store").Readable<Array<CategoryInfo>>} */
export const category_list = readable(categories_simple);

const c_map = new Map();
for (const c of categories_simple) {
  c_map.set(c.category, c);
}
/** @type {import("svelte/store").Readable<Map<string, CategoryInfo>>} */
export const category_map = readable(c_map);

// Dictionary lookup: slug → canonical display name
const display_name_map = new Map();
for (const c of categories_simple) {
  display_name_map.set(c.category, c.category_name);
}

/**
 * Look up the canonical display name for a category slug.
 * Falls back to format_category_name style if slug is missing from dictionary.
 * @param {string} slug - The category slug (e.g., "ports", "broadband")
 * @returns {string} The display name (e.g., "Airports and Docks", "Broadband")
 */
export function category_display_name(slug) {
  if (display_name_map.has(slug)) {
    return display_name_map.get(slug);
  }
  // Fallback: capitalize first letter, replace underscores with spaces
  let name = slug.replace(/_/g, " ");
  return `${name.charAt(0).toUpperCase()}${name.substring(1)}`;
}
