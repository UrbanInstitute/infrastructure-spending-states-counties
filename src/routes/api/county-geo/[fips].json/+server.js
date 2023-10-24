import { feature } from "topojson-client";
import topojson from "topojson";
import { error, json } from "@sveltejs/kit"
import county_topo from "$data/cb_2020_us_county_500k.json";

const county_geojson = feature(county_topo, county_topo.objects.counties);

export const prerender = true;

export function entries() {
  return Array.from(new Set(county_geojson.features.map(({properties}) => ({fips: properties.state_fips}))));
}

/** @type {import('./$types').RequestHandler} */
export function GET({ params }) {
  const state_features = county_geojson.features.filter(({properties}) => properties.state_fips == params.fips);
  if (state_features.length < 1) {
    throw error(404, `Geographic data not found`);
  }
  const feature_collection = {type: "FeatureCollection", features: state_features};
  const state_topojson = topojson.topology({counties: feature_collection});
  return json(state_topojson);
}

