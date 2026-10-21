// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { base } from "$app/paths";
import { error } from "@sveltejs/kit";
import county_bucket_map from "$data/server/county_bucket_map.json";
import cbsa_bucket_map from "$data/server/cbsa_bucket_map.json";
import state_fips_list from "$data/server/state_fips_list.json";

/**
 * @typedef {{bucket: string, fips_list: any, funding_medians: Map<any, any>}} ComparisonBucket
 */

export default class PlaceData {
  /**
   * @param {"state" | "county" | "cbsa"} geo_level
   * @param { string } id
   * @param { typeof fetch } fetch
   */
  constructor(geo_level, id, fetch) {
    this.geo_level = geo_level;
    this.id = id;
    this.fetch = fetch;
    if (geo_level === "county") {
      this.bucket_map = county_bucket_map;
    } else if (geo_level === "cbsa") {
      this.bucket_map = cbsa_bucket_map;
    }
  }

  /**
   * @returns {Promise<any>}
   */
  async get_data() {
    if (!this.data) {
      const place_data_resp = await this.fetch(
        `${base}/data/server/${this.geo_level}/${this.id}.json`
      );
      // a missing file is a 404, not a SyntaxError from parsing its "not
      // found" body as JSON
      if (!place_data_resp.ok) {
        error(
          404,
          this.geo_level === "state" ? `State not found` : `Place not found`
        );
      }
      this.data = await place_data_resp.json();
    }
    return this.data;
  }

  /** @returns {Promise<ComparisonBucket[]>} */
  async get_comparison_buckets() {
    if (!this.data) {
      this.data = await this.get_data();
    }

    // get category funding per-1k keys
    const funding_keys = Object.keys(this.data.category_funding).filter((key) =>
      key.endsWith("_per_1k")
    );

    // State branch: single synthetic "All States" bucket from state_funding_medians.json
    if (this.geo_level === "state") {
      const medians_url = `${base}/data/server/state/state_funding_medians.json`;
      const median_data = await this.fetch(medians_url).then((res) =>
        res.json()
      );
      const funding_medians = new Map();
      for (const funding_key of funding_keys) {
        funding_medians.set(funding_key, median_data[`${funding_key}_median`]);
        funding_medians.set(
          `${funding_key}_funded`,
          median_data[`${funding_key}_funded_median`]
        );
      }
      return [
        {
          bucket: "all_states",
          fips_list: state_fips_list,
          funding_medians: funding_medians,
        },
      ];
    }

    // County/CBSA branch: discover bucket names from indicator_values.
    // Skip buckets with no level (null/undefined) — those places have no
    // comparison group for that indicator, and no median file is generated
    // for them (e.g. county 48243 has a null med_hh_income_bucket).
    const place_comparison_bucket_names = Object.keys(
      this.data.indicator_values
    ).filter(
      (key) =>
        key.endsWith("_bucket") && this.data.indicator_values[key] != null
    );

    // loop through list of buckets, and generate an object for each bucket
    // this returns an array of promise-wrapped objects
    const place_comparison_buckets_promises = place_comparison_bucket_names.map(
      async (bucket_name) => {
        const bucket_level = this.data.indicator_values[bucket_name];
        // find the median funding values for the corresponding bucket
        const median_data_url = `${base}/data/server/${this.geo_level}/${bucket_name}-${bucket_level}.json`;
        const median_data_resp = await this.fetch(median_data_url);
        // if the median file is missing, drop this bucket rather than failing
        // the build (res.json() on a "not found" body throws a SyntaxError)
        if (!median_data_resp.ok) {
          return null;
        }
        const median_data = await median_data_resp.json();
        // map to hold the medians for each category
        const funding_medians = new Map();

        // calculate the median of each category's funding for each bucket
        for (const funding_key of funding_keys) {
          funding_medians.set(
            funding_key,
            median_data[`${funding_key}_median`]
          );
          funding_medians.set(
            `${funding_key}_funded`,
            median_data[`${funding_key}_funded_median`]
          );
        }

        // return the bucket object
        return {
          bucket: bucket_name,
          fips_list: this.get_bucket_list(bucket_name, bucket_level),
          funding_medians: funding_medians,
        };
      }
    );

    // await the list of promises to resolve to the resulting objects
    const place_comparison_buckets = await Promise.all(
      place_comparison_buckets_promises
    );

    // guard: drop dropped buckets (null) and any whose fips_list is not a
    // non-empty array. The predicate removes the nulls, but `filter` does not
    // narrow the type on its own, so assert the narrowed shape for callers.
    return /** @type {ComparisonBucket[]} */ (
      place_comparison_buckets.filter(
        (b) => b && Array.isArray(b.fips_list) && b.fips_list.length > 0
      )
    );
  }

  /**
   * @param {string} bucket
   * @param {any} bucket_level
   */
  get_bucket_list(bucket, bucket_level) {
    const bucket_lookup_key = `${bucket}-${bucket_level}`;
    return /** @type {Record<string, any>} */ (this.bucket_map)[
      bucket_lookup_key
    ];
  }
}

/**
 * Load a geography page's data. Shared by the state, county and CBSA routes:
 * builds the place's `PlaceData` (which 404s when there is no file for the
 * place) and adds its comparison buckets.
 * @param {"state" | "county" | "cbsa"} geo_level
 * @param {string} fips
 * @param {typeof fetch} fetch
 */
export async function load_place(geo_level, fips, fetch) {
  const place_data = new PlaceData(geo_level, fips, fetch);
  const place = await place_data.get_data();
  const comparison_buckets = await place_data.get_comparison_buckets();

  // Surface county flags from indicator_values to top level for LocationDetails
  if (geo_level === "county" && place.indicator_values) {
    place.disadvantaged_county =
      place.indicator_values.disadvantaged_county || false;
    place.persistent_poverty_county =
      place.indicator_values.persistent_poverty_county || false;
  }

  return {
    place,
    comparison_buckets,
  };
}
