import { writable, readable } from "svelte/store";
import { browser } from "$app/environment";
import { base } from "$app/paths";

export const state_info = writable(new Map());

async function fetch_state_info() {
  const url = `${base}/data/state_info.json`;
  const resp = await fetch(url);
  const state_data = await resp.json();
  // Make state info easy to lookup
  const state_map = new Map();
  state_data.forEach((state) => {
    state_map.set(state.state_usps, state);
  });
  state_info.set(state_map);
}

if (browser) {
  fetch_state_info();
}
