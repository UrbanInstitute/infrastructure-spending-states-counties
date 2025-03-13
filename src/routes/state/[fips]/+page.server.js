import fips_list from "$data/server/state_fips_list.json";
import { base } from "$app/paths";
import { error } from "@sveltejs/kit";

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return fips_list.map((fips) => ({ fips }));
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

// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
  const state_data_resp = await fetch(
    `${base}/data/server/state/${params.fips}.json`
  );
  const state_data = await state_data_resp.json();
  // const state_data = states_data.find((d) => d.fips === params.fips);
  if (!state_data) {
    error(404, `State not found`);
    return;
  }
  const median_resp = await fetch(
    `${base}/data/server/state/state_funding_medians.json`
  );
  const funding_medians_raw = await median_resp.json();
  const state_funding_medians = new Map(Object.entries(funding_medians_raw));
  return {
    detail: {
      name: state_data.name,
      fips: state_data.fips,
    },
    funding: get_funding(state_data),
    state_funding_medians,
    equity_scores: state_data.equity_scores,
  };
}
