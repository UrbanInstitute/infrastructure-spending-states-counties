import { base } from "$app/paths";
import county_bucket_map from "$data/server/county_bucket_map.json";
import cbsa_bucket_map from "$data/server/cbsa_bucket_map.json";



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

  async get_data() {
    if (!this.data) {
      const place_data_resp = await this.fetch(
        `${base}/data/server/${this.geo_level}/${this.id}.json`
      );
      const place_data = await place_data_resp.json();
      this.data = place_data;
    }
    return this.data;
  }


  async get_comparison_buckets() {
    if (!this.data) {
      this.data = await this.get_data();
    }
    // get just the funding per 1k keys
    const funding_keys = Object.keys(this.data).filter((key) =>
      key.includes("per_1k")
    );

    // get list of all of the comparison buckets
    const place_comparison_bucket_names = Object.keys(this.data).filter((key) =>
      key.includes("bucket")
    );

    // loop through list of buckets, and generate an object for each bucket
    // this returns an array of promise-wrapped objects
    const place_comparison_buckets_promises = place_comparison_bucket_names.map(
      async (bucket_name) => {
        const bucket_level = this.data[bucket_name];
        // find the median funding values for the corresponding bucket
        const median_data_url = `${base}/data/server/${this.geo_level}/${bucket_name}-${bucket_level}.json`;
        const median_data = await this.fetch(median_data_url).then((res) =>
          res.json()
        );
        // map to hold the medians for each program
        const funding_medians = new Map();

        // calculate the median of each program's funding for each bucket
        for (var i = 0; i < funding_keys.length; i++) {
          const funding_key = funding_keys[i];
          funding_medians.set(funding_key, median_data[`${funding_key}_median`]);
          funding_medians.set(
            `${funding_key}_funded`,
            median_data[`${funding_key}_funded_median`]
          );
        }

        // return the bucket object, which includes the bucket key, the list of counties in the bucket, and the funding medians
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

    // return the list
    return place_comparison_buckets;

  }

  get_bucket_list(bucket, bucket_level) {
    const bucket_lookup_key = `${bucket}-${bucket_level}`;
    return this.bucket_map[bucket_lookup_key];
  }
}
