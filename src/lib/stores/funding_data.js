import { base } from "$app/paths";

const funding_data_map = new Map();

/**
 * @param {string} program_name
 * @returns {Promise<Map<string, Record<string, number>>>}
 */
export async function get_funding_data(program_name, geo_level = "state") {
  const cache_key = `${program_name}-${geo_level}`;
  if (funding_data_map.has(cache_key)) {
    return funding_data_map.get(cache_key);
  }
  const data_url = `${base}/data/client/${program_name}_${geo_level}_funding.json`;
  const funding_data = await fetch(data_url).then((res) => res.json());
  const funding_data_location_map = new Map(
    funding_data.map((d) => [d.fips, d])
  );
  funding_data_map.set(cache_key, funding_data_location_map);
  return funding_data_location_map;
}
