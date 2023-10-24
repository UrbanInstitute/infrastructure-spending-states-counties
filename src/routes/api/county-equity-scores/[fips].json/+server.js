import county_equity_scores_raw from "$data/county_equity_scores.json";
import { get_county_equity_scores } from "$lib/equity_scores_county_server.js";
import { error, json } from "@sveltejs/kit"

export const prerender = true;

export function entries() {
  return county_equity_scores_raw.fips.map((fips) => ({fips}));
}

/** @type {import('./$types').RequestHandler} */
export function GET({ params }) {
  const scores = get_county_equity_scores(params.fips);
  if (!scores) {
    throw error(404, `County not found`);
  }
  return json(scores);
}
