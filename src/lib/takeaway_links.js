// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.

/**
 * The quintile-chart characteristic each landing-page takeaway links to, per
 * the link comments in the editorial copy deck. Three of these are queried with
 * editorial (EQ-1) because their takeaways were rewritten; each is a one-line
 * change if revised.
 * @type {Record<string, string>}
 */
export const takeaway_indicators = {
  ports: "airports_primary",
  broadband: "hh_int_access",
  environmental_resilience: "poverty_rate", // EQ-1
  energy_and_power: "capacity_environment", // EQ-1
  housing_and_community_development: "housing_cost_burden",
  roads_and_bridges: "annual_vehicle_mi_per_hh",
  passenger_and_freight_rail: "rr_freight_route_miles", // EQ-1
  public_transportation: "transport_costs",
  water_conservation: "water_system_violations",
};

/**
 * The query string that preselects a category page's quintile chart on the
 * takeaway's characteristic at county level, or "" for a category with no
 * configured characteristic. Either way the card links to the page's top (L-3).
 * @param {string} category category short name
 * @returns {string}
 */
export function takeaway_link_suffix(category) {
  const indicator = takeaway_indicators[category];
  if (!indicator) return "";
  const params = new URLSearchParams({
    characteristic: indicator,
    geography: "county",
  });
  return `?${params}`;
}
