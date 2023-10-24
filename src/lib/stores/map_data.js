import { writable } from "svelte/store";
import { base } from "$app/paths";
import { browser } from "$app/environment";
import { feature } from "topojson-client";

/** @type {import("svelte/store").Writable<GeoJSON|null>} */
export const states_geo = writable(null);

export const states_geo_promise = writable(new Promise(() => {}))

async function fetch_state_geo() {
  const url = `${base}/data/cb_2020_us_state_500k.json`;
  const data = await (await fetch(url)).json();
  const geo_data = feature(data, data.objects.states);
  states_geo.set(geo_data);
  return geo_data;
}

if (browser) {
  fetch_state_geo();
}
