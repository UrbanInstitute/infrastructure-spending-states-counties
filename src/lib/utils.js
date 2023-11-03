import site_content from "$data/site_content.json";
import program_language from "$data/program_language.json";
import {format} from "d3-format";
/**
 * Round a number and conver to string to display as dollars.
 * @param {number} dollars
 * @return {string} The dollars formatted as a string.
 */
export function dollarsToString(dollars) {
  return "$" + round_number(dollars, 0).toLocaleString("en-US");
}

/**
 * Round a number to a specified number of decimal places.
 * @param {number} number
 * @param {number} decimalPlaces
 * @return {number} The number rounded to the specified number of decimal places.
 */
export function round_number(number, decimalPlaces) {
  if (decimalPlaces) {
    return Math.round(number * decimalPlaces) / decimalPlaces;
  }
  return Math.round(number);
}

/**
 * @param {string} program_short_name
 * @returns {string}
 */
export function slugify_program(program_short_name) {
  return program_short_name.replaceAll("_", "-");
}

/**
 * @param {string} program_slug
 * @returns {string}
 */
export function deslugify_program(program_slug) {
  return program_slug.replaceAll("-", "_");
}
/**
 * Move an element to the last child. Adapted from d3-selection `.raise`: https://github.com/d3/d3-selection#selection_raise
 * @param {Element} el The element to raise.
 */
export function raise(el) {
  if (el.nextSibling) el.parentNode.appendChild(el);
}

/**
 * Generates an array of equity scores for the table
 * @param {string} program_short_name - The short name of the program to get scores for
 * @param {Record<string, number>} equity_score_data - The map of equity scores
 * @returns {{short_name: string, indicator: string, score: number | undefined}[]} The formatted equity score data
 */
export function get_equity_scores_by_program(program_short_name, equity_score_data) {
  const program_keys = Array.from(Object.keys(equity_score_data)).filter((key) => {
    const [program_key_name, _] = key.split("-");
    return program_key_name === program_short_name;
  }
  );
  return program_keys.map((key) => ({
    short_name: key,
    indicator: key.split("-")[1],
    score: equity_score_data[key],
  }));
}

/**
 * Generates an array of equity scores for the table
 * @param {string} text_template - The template with one or more dynamic variables to swap in
 * @param {Record<string, string | null>} vars - Key-value pairs of variables to swap into the template
 * @returns {string} The formatted text string
 */
export function format_text_template(text_template, vars) {
  let result = text_template;
  for (const key in vars) {
    if (vars[key] === null) {
      continue;
    }
    result = result.replaceAll(`[${key}]`, vars[key]);
  }
  return result;;
}

/**
 * Formats a string to be displayed as a category name
 * @param {string} category_name - The snake_case category name
 * @returns {string} The formatted text string
 */
export function format_category_name(category_name) {
  let name = category_name.replace(/_/g, " ");
  return `${name.charAt(0).toUpperCase()}${name.substring(1)}`;
}

/**
  * Formats an indicator string to be displayed as a human friendly label
  * @param {string} indicator - The indicator string
  * @returns {string} The formatted indicator label
*/
export function get_indicator_label(indicator) {
  const { indicator_labels } = site_content;
  if (Object.keys(indicator_labels).includes(indicator)) {
    return indicator_labels[indicator];
  }
  console.log(`No label found for indicator: ${indicator}`);
  return "";
}

/**
  * Formats a bucket name to be displayed as a human friendly label
  * @param {string} bucket_name - The bucket name
  * @returns {string} The formatted bucket label
*/
export function get_bucket_label(bucket_name) {
  if (bucket_name == "across_the_state") {
    return "Other counties in the state";
  }
  let label = get_indicator_label(bucket_name.replace("_bucket", ""));
  return `Counties with a similar ${label.toLowerCase()}`;
}

const number_fmts = {
  pct: ".1%",
  pct_small: ".4%",
  decimal: ",.2f",
  decimal_small: ",.4f",
  integer: ",.0f",
  dollar: "$,.2~s",
}

const per_cap_indicators = [
  "pub_transit_stops",
  "freq_fatal_accidents",
  "contaminated_sites",
  "superfund_site",
  "water_system_violations",
  "power_generation",
  "grid_disturbances",
  "housing_units",
  "capacity_housing",
  "permits",
  "capacity_environment",
  "capacity_transport",
  "airports_primary",
  "bridges",
  "docks",
  "stations_elevated",
  "stations_subway",
  "rr_incident_killed",
  "rr_incident_number",
  "rr_freight_route_miles",
  "transport_trade_jobs",
  "rr_pax_route_miles",
  "hud_pbs8",
  "hud_ph",
  "hud_202",
  "rail_transit_km",
  "highway_miles",
];

const pct_int_indicators = [
  "transport_costs",
];
const per_sq_mile_indicators = [
  "highway_miles"
];

const quantile_indicator_formats = {
  percent_poc: number_fmts.pct,
  poverty_rate : number_fmts.pct,            
  pop_density : number_fmts.integer,             
  med_hh_income : number_fmts.dollar,           
  broadband_speed : number_fmts.decimal,        
  hh_int_access : number_fmts.pct,           
  ghg_per_acre : number_fmts.decimal,            
  ozone : number_fmts.decimal,                   
  pm25 : number_fmts.decimal,                    
  diesel_pm : number_fmts.decimal,              
  capacity_environment : number_fmts.decimal,
  contaminated_sites : number_fmts.decimal,      
  superfund_site : number_fmts.decimal,          
  water_system_violations : number_fmts.decimal, 
  energy_cost_hh : number_fmts.pct,         
  grid_disturbances : number_fmts.decimal,       
  power_generation : number_fmts.decimal,        
  cnw_500 : number_fmts.decimal,                 
  housing_cost_burden : number_fmts.pct,     
  housing_units : number_fmts.decimal,          
  capacity_housing : number_fmts.decimal,        
  overcrowded_housing : number_fmts.pct,     
  vacancy_rate : number_fmts.pct,            
  homelessness : number_fmts.pct,            
  incomplete_plumbing : number_fmts.pct,    
  incomplete_kitchen : number_fmts.pct,      
  permits : number_fmts.decimal,                 
  hud_hcv : number_fmts.decimal,                 
  hud_pbs8 : number_fmts.decimal,                
  hud_ph : number_fmts.decimal,                 
  hud_202 : number_fmts.decimal,                 
  age_over_64 : number_fmts.pct,             
  annual_vehicle_mi_per_hh : number_fmts.integer,
  freq_fatal_accidents : number_fmts.decimal,    
  avg_hh_person_trips : number_fmts.decimal,    
  access_to_car : number_fmts.pct,           
  highway_miles : number_fmts.decimal,           
  capacity_transport : number_fmts.decimal,      
  transport_costs : number_fmts.pct,         
  commute_time : number_fmts.pct,           
  pub_transit_commute : number_fmts.pct,     
  green_commute : number_fmts.pct,           
  pub_transit_stops : number_fmts.decimal,       
  employment_access_index : number_fmts.decimal, 
  bridges : number_fmts.decimal,                
  bridges_poor_condition : number_fmts.pct,  
  rail_transit_km : number_fmts.decimal,
  airports_primary : number_fmts.decimal,        
  freq_train_use : number_fmts.pct,          
  freq_bus_use : number_fmts.pct,           
  rr_freight_route_miles : number_fmts.decimal,  
  transport_trade_jobs : number_fmts.decimal,    
  rr_pax_route_miles : number_fmts.decimal,      
  rr_incident_number : number_fmts.decimal,      
  rr_incident_killed : number_fmts.decimal,     
  docks : number_fmts.decimal,                   
  stations_subway : number_fmts.decimal,         
  stations_elevated : number_fmts.decimal,       
  age_under_18: number_fmts.pct,
}

export function is_indicator_per_capita(indicator) {
  return per_cap_indicators.includes(indicator);
}

export function is_indicator_per_sq_mile(indicator) {
  return per_sq_mile_indicators.includes(indicator);
}

export function format_indicator_value(raw_value, indicator) {
  if (!Object.keys(quantile_indicator_formats).includes(indicator)) {
    console.log("Warning: no format found for indicator: " + indicator);
    return raw_value;
  }
  const f = format(quantile_indicator_formats[indicator]);
  if (is_indicator_per_capita(indicator) && is_indicator_per_sq_mile(indicator)) {
    return f(raw_value * 10000 * 1000);
  }
  if (is_indicator_per_capita(indicator)) {
    return f(raw_value * 10000);
  }
  if (pct_int_indicators.includes(indicator)) {
    return f(raw_value / 100);
  }
  return f(raw_value, quantile_indicator_formats[indicator]);
}

export function get_site_url(path) {
  const staging = import.meta.env.MODE == "staging";
  const base_url = staging ? site_content.meta.url_staging : site_content.meta.url;
  if (path) {
    return `${base_url}/${path}/`;
  }
  return `${base_url}/`;
}

export function get_program_language_vars(input_program_short_name) {
  return program_language.find(({ program_short_name }) => program_short_name === input_program_short_name);
}

export function get_program_name(program_short_name) {
  const { program_name } = get_program_language_vars(program_short_name);
  return program_name;
}
