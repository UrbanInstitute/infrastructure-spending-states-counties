import state_equity_scores_raw from "$data/state_equity_scores.json";

// takes input data format which is optimized for filesize and converts it to a map
function format_equity_scores(scores) {
  const data_keys = Object.keys(scores);
  let place_lookup = {};
  for (let i = 0; i < scores.fips.length; i++) {
    let score_lookup = {};
    for (const key of data_keys) {
      score_lookup[key] = scores[key][i];
    }
    place_lookup[scores.fips[i]] = score_lookup;
  }
  return place_lookup;
}

export const state_equity_scores_formatted = format_equity_scores(
  state_equity_scores_raw
);

/**
 * Retrieve equity score data for a given state
 * @param {string} fips - The FIPS code of the state to retrieve data for
 * @returns {Map<string, number>} A map of equity score data for the given state
 **/
export function get_state_equity_scores(fips) {
  return state_equity_scores_formatted[fips];
}
