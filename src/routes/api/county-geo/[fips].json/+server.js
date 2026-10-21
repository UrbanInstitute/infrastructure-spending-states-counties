// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { feature } from "topojson-client";
import { topology } from "topojson-server";
import { error, json } from "@sveltejs/kit";
import county_topo from "$data/cb_2023_us_county_500k.json";

/** @type {any} */
const county_geojson = feature(
  /** @type {any} */ (county_topo),
  /** @type {any} */ (county_topo.objects.counties)
);

export const prerender = true;

export function entries() {
  /** @type {Set<string>} */
  const state_fips = new Set(
    county_geojson.features.map(
      (/** @type {any} */ f) => f.properties.state_fips
    )
  );
  return Array.from(state_fips, (fips) => ({ fips }));
}

/** @type {import('./$types').RequestHandler} */
export function GET({ params }) {
  const state_features = county_geojson.features.filter(
    (/** @type {any} */ f) => f.properties.state_fips == params.fips
  );
  if (state_features.length < 1) {
    error(404, `Geographic data not found`);
  }
  const feature_collection = {
    type: "FeatureCollection",
    features: state_features,
  };
  const state_topojson = topology({
    counties: /** @type {any} */ (feature_collection),
  });
  return json(state_topojson);
}
