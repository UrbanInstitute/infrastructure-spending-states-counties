import { error } from "@sveltejs/kit";
import county_data from "$data/counties.json";
import bucket_funding_medians from "$data/bucket_funding_medians.json";
import { median } from "d3-array";


// tell sveltekit what pages to prerender
// temporarily limiting to a few states
/** @type {import('./$types').EntryGenerator} */
export function entries() {
  const states_to_include = ["24", "36", "48"];
  return county_data
    .map(({ fips }) => ({
      fips,
    }));
}

// this function loads data for the page
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  // find the matching county and include all of the fields by default
  /** @ts-ignore */
  const county = county_data.find((county) => county.fips === params.fips);
  if (!county) {
    throw error(404, `County not found`);
  }

  const { state_fips } = county;


  // get just the funding per 1k keys
  const funding_keys = Object.keys(county).filter((key) =>
    key.includes("per_1k")
  );

  // get list of all of the comparison buckets
  const county_comparison_bucket_names = Object.keys(county).filter((key) =>
    key.includes("bucket")
  );
  // use list of comparison buckets to create lists of counties for each bucket
  const county_comparison_buckets = county_comparison_bucket_names.map(
    (bucket_name) => {
      /** @ts-ignore */
      // get list of all counties and their data that are in the same bucket for a given key
      const bucket_counties = county_data.filter(
        (loop_county) => county[bucket_name] === loop_county[bucket_name]
      );

      // find the median funding values for the corresponding bucket
      const median_data = bucket_funding_medians.find(
        (bucket_data) =>
          bucket_data.bucket == bucket_name &&
          bucket_data.level == county[bucket_name]
      );

      // map to hold the medians for each program
      const funding_medians = new Map();

      // calculate the median of each program's funding for each bucket
      for (var i = 0; i < funding_keys.length; i++) {
        const funding_key = funding_keys[i];
        funding_medians.set(funding_key, median_data[`${funding_key}_median`]);
        funding_medians.set(`${funding_key}_funded`, median_data[`${funding_key}_funded_median`]);
      }
      // return the bucket object, which includes the bucket key, the list of counties in the bucket,
      // and the funding medians for each program for the bucket
      return {
        bucket: bucket_name,
        counties: bucket_counties
          /** @ts-ignore */
          .map((loop_county) => loop_county.fips),
        funding_medians: funding_medians,
      };
    }
  );

  /** @ts-ignore */
  // append the state bucket, which we are calculating manually
  const state_counties = county_data.filter(
    (loop_county) => county.state_fips == loop_county.state_fips
  );
  // and repeat the funding median calculation for the state bucket
  const state_funding_medians = new Map();
  for (var i = 0; i < funding_keys.length; i++) {
    const funding_key = funding_keys[i];
    state_funding_medians.set(
      funding_key,
      median(state_counties, (d) => d[funding_key])
    );
    state_funding_medians.set(
      funding_key + "_funded",
      median(state_counties.filter((d) => d[funding_key] > 0), (d) => d[funding_key])
    );
  }
  // add state bucket to the beginning of the bucket list
  county_comparison_buckets.unshift({
    bucket: "across_the_state",
    /** @ts-ignore */
    counties: state_counties.map((c) => c.fips),
    funding_medians: state_funding_medians,
  });

  /** @ts-ignore */
  // create a list of all the relevant county fips codes across all buckets
  const county_data_fips_list = Array.from(
    new Set(
      county_comparison_buckets.reduce(
        (all_fips, { counties }) => all_fips.concat(counties),
        []
      )
    )
  );

  /** @ts-ignore */
  // create a filtered list of county data to include on the page based on all possible comparison counties
  const filtered_county_data = county_data.filter((c) =>
    county_data_fips_list.includes(c.fips)
  );

  // create a map based on the filtered_county_data to make it easier to access the funding data for each county
  const county_funding_data = new Map();
  for (var i = 0; i < filtered_county_data.length; i++) {
    const county = filtered_county_data[i];

    /** @type {Record<string, number>} */
    let county_funding = {
      county: county.county,
      state: county.state,
    };

    // loop through funding keys to add relevant data
    for (var j = 0; j < funding_keys.length; j++) {
      const col = funding_keys[j];
      county_funding[col] = county[col];
      const total_name = col.replace("_per_1k", "");
      county_funding[total_name] = county[total_name];
    }

    county_funding_data.set(county.fips, county_funding);
  }

  // get county equity scores
  // const county_equity_scores_current = get_county_equity_scores(county.fips);

  return {
    detail: {
      state: county.state,
      county: county.county,
      year: county.year,
      state_fips: county.state_fips,
      fips: county.fips,
    },
    comparison_buckets: county_comparison_buckets,
    county_funding_data,
  };
}
