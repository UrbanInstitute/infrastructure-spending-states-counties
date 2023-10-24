import states_data from "$data/states.json";
import counties_data from "$data/counties.json";
import { error } from "@sveltejs/kit";
import { median } from "d3-array";
import { get_state_equity_scores } from "$lib/equity_scores_state_server.js";

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return states_data.map(({ fips }) => ({ fips: fips }));
}

function get_funding(detail) {
  const per_cap_cols = Object.keys(detail).filter((key) =>
    key.includes("_per_1k")
  );
  // create a map based on the filtered_data to make it easier to access the funding data for each county

  /** @type {Record<string, number>} */
  let funding = { fips: detail.fips, state: detail.name };
  for (const col of per_cap_cols) {
    const total_name = col.replace("_per_1k", "");
    funding[col] = detail[col];
    funding[total_name] = detail[total_name];
  }
  return funding;
}

const state_funding_data = new Map();
for (const state of states_data) {
  state_funding_data.set(state.fips, get_funding(state));
}

const funding_keys = Object.keys(states_data[0]).filter((key) =>
  key.includes("per_1k")
);
const state_funding_medians = new Map();
for (const funding_key of funding_keys) {
  state_funding_medians.set(
    funding_key,
    median(states_data, (d) => d[funding_key])
  );
  state_funding_medians.set(
    funding_key + "_funded",
    median(states_data.filter((d) => d[funding_key] > 0), (d) => d[funding_key])
  );
}
// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const state_data = states_data.find((d) => d.fips === params.fips);
  const counties_funding = counties_data
    .filter(({ state_fips }) => state_fips == params.fips)
    .map(get_funding);
  if (!state_data) {
    throw error(404, `State not found`);
    return;
  }
  return {
    detail: {
      name: state_data.name,
      fips: state_data.fips
    },
    state_funding_data,
    counties_funding,
    state_funding_medians,
    equity_scores: get_state_equity_scores(params.fips)
  };
}
