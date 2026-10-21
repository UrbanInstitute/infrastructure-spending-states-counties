// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { base } from "$app/paths";

/** @typedef {Map<string, Record<string, number>>} FundingData */

/**
 * One entry per file. It holds the fetch *promise*, not the resolved Map, so
 * that callers asking for the same file at the same moment share one request
 * — see `get_funding_data`. A miss removes its own entry as it resolves.
 * @type {Map<string, Promise<FundingData>>}
 */
const funding_data_map = new Map();

/**
 * Fetch one program's or category's funding data for a geography level.
 *
 * `option_type` selects the directory, and it is not optional in practice:
 * categories and programs share a namespace of short names and at least one
 * name is in both — `ports` is an infrastructure category *and* a federal
 * program. The generated files used to sit in one flat directory, where the
 * program's `ports_state_funding.json` overwrote the category's, so the
 * Airports and Docks category rendered the ports program's numbers alone.
 * `postprocess_data.js` now writes `client/category/` and `client/program/`.
 *
 * Not every short name has a file at every level, **by design**: programs are
 * published at state and CBSA only, categories at all three. Every map that
 * offers a county view selects *categories* — the state pages' within-state
 * map, and the national county view on the home and category pages — while the
 * program page's map is state and CBSA only, so the program pass writes no
 * county files. A missing file used to leave the caller with a rejected
 * promise: `FundingMap` would never set `has_loaded`, so the map sat in its
 * loading state with an unhandled rejection in the console.
 *
 * A miss now resolves to an empty Map instead. Callers render "no data" rather
 * than hanging, and the failure is visible in the console without being fatal.
 *
 * The cache holds the in-flight promise rather than the resolved Map. The
 * category page's map and beeswarm ask for the same file at the same moment,
 * and caching only once a response had resolved let both calls miss and fetch
 * the file (up to ~96 KB at CBSA level) twice on every toggle. Concurrent
 * callers now get the same promise. A miss — a non-OK response or a network
 * error — deletes its entry as it resolves, so it is never served from the
 * cache and a transient failure can recover on the next call.
 *
 * @param {string} short_name
 * @param {"state" | "county" | "cbsa"} [geo_level]
 * @param {"program" | "category"} [option_type]
 * @returns {Promise<FundingData>}
 */
export function get_funding_data(
  short_name,
  geo_level = "state",
  option_type = "program"
) {
  const cache_key = `${option_type}-${short_name}-${geo_level}`;
  let request = funding_data_map.get(cache_key);
  if (!request) {
    request = fetch_funding_data(short_name, geo_level, option_type).then(
      (data) => {
        if (data) return data;
        funding_data_map.delete(cache_key);
        return new Map();
      }
    );
    funding_data_map.set(cache_key, request);
  }
  return request;
}

/**
 * The request itself, keyed by FIPS on the way out. Resolves to `null` on a
 * miss — a non-OK response, a network error or unparseable content — after
 * logging it, and never rejects; the caching wrapper above turns `null` into
 * the empty Map callers see.
 * @param {string} short_name
 * @param {"state" | "county" | "cbsa"} geo_level
 * @param {"program" | "category"} option_type
 * @returns {Promise<FundingData | null>}
 */
async function fetch_funding_data(short_name, geo_level, option_type) {
  const data_url = `${base}/data/client/${option_type}/${short_name}_${geo_level}_funding.json`;
  try {
    const res = await fetch(data_url);
    if (!res.ok) {
      console.warn(
        `No ${geo_level} funding data for ${option_type} "${short_name}" (${res.status} from ${data_url})`
      );
      return null;
    }
    const funding_data = await res.json();
    return new Map(funding_data.map((/** @type {any} */ d) => [d.fips, d]));
  } catch (err) {
    console.warn(`Could not load funding data from ${data_url}`, err);
    return null;
  }
}
