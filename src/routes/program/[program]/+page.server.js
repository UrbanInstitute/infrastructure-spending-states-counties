import program_data from "$data/programs.json";
import state_data from "$data/states.json";
import program_quantile_funding_data from "$data/program_quantile_funding.json";
import program_t_test_data from "$data/program_t_test.json";
import { error } from "@sveltejs/kit";
import { slugify_program } from "$lib/utils";
import equity_scores_county from "$data/program_equity_scores_county.json";
import equity_scores_state from "$data/program_equity_scores_state.json";

// tell sveltekit what pages to prerender
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return program_data.map(({ short_name }) => ({
    program: slugify_program(short_name),
  }));
}

function get_state_data(program) {
  return state_data.map(({ fips, name, ...rest }) => ({
    fips,
    state: name,
    funding: rest[program],
    funding_per_1k: rest[`${program}_per_1k`],
  }));
}

/**
 * @param {string} program
 * @returns {{indicator: string, score: number, metric: string, level: string | null, subset: string}[]}}
 */
function get_equity_scores(program) {
  //@TODO this could be cleaned up a bit i'm sure
  const state_scores = equity_scores_state.find(
    ({ program: p }) => p === program
  );
  const county_scores = equity_scores_county.find(
    ({ program: p }) => p === program
  );
  let clean_scores = [];
  // variability score
  clean_scores.push(
    { score: state_scores?.variability_score, metric: "variability", level: null, subset: "all", indicator: "variability" },
  );
  // state concentration
  clean_scores = clean_scores.concat(Object.keys(state_scores)
    .filter((score_key) => score_key.endsWith("_concentration"))
    .map((score_key) => ({
      score: state_scores[score_key],
      level: "state",
      metric: "concentration",
      subset: "all",
      indicator: score_key.replace("_concentration", ""),
    })));
  // county concentration
  if (county_scores) {
    clean_scores = clean_scores.concat(Object.keys(county_scores)
      .filter((score_key) => score_key.endsWith("_concentration"))
      .map((score_key) => ({
        score: county_scores[score_key],
        level: "county",
        metric: "concentration",
        subset: "all",
        indicator: score_key.replace("_concentration", ""),
      })));
  }
  //state high need
  clean_scores = clean_scores.concat(Object.keys(state_scores)
    .filter((score_key) => !score_key.endsWith("_concentration") && score_key !== "program" && !score_key.includes("variability"))
    .map((score_key) => ({
      score: state_scores[score_key],
      level: "state",
      metric: "high_need",
      subset: score_key.endsWith("_funded") ? "funded" : "all",
      indicator: score_key.replace("_funded", ""),
    })));
  // county high need
  if (county_scores) {
    clean_scores =  clean_scores.concat(Object.keys(county_scores)
      .filter((score_key) => !score_key.endsWith("_concentration") && score_key !== "program")
      .map((score_key) => ({
        score: county_scores[score_key],
        level: "county",
        metric: "high_need",
        subset: score_key.endsWith("_funded") ? "funded" : "all",
        indicator: score_key.replace("_funded", ""),
      })));
  }
  return clean_scores;
}

// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  // find the matching county and include all of the fields by default
  /** @ts-ignore */
  const program = program_data.find(
    (program) => slugify_program(program.short_name) === params.program
  );
  if (!program) {
    throw error(404, `Program not found`);
  }
  const quantile_funding = program_quantile_funding_data.filter((item) => slugify_program(item.program) == params.program);
  const t_test_data = program_t_test_data.filter((item) => slugify_program(item.program) == params.program);
  const equity_scores = get_equity_scores(program.short_name);
  const variability_scores = equity_scores_state.map(({ program, variability_score }) => ({ program, score: variability_score })).filter(({score}) => score !== null);
  const state_data = get_state_data(program.short_name);
  return {
    detail: program,
    state_data,
    equity_scores,
    quantile_funding,
    t_test_data,
    variability_scores
  };
}
