################################################################################
# This script converts the 2026 source data for the PERC data tool
# It reads source files in the format provided by the Urban Institute research
# team and reshapes them into intermediate JSON files for the Node postprocessor.
#
# 2026 update: Data is now primarily category-level (pre-aggregated by the research team).
# Geography pages show category funding; program pages are simplified.
#
# Note: A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
#
# Dependencies:
# install.packages("tidyverse")
# install.packages("readxl")
# install.packages("here")
# install.packages("jsonlite")
# install.packages("janitor")
################################################################################

library(tidyverse)
library(readxl)
library(here)
library(jsonlite)
library(janitor)

input_folder <- here("data", "source-2026")
output_folder <- here("data", "output", "preprocessed")

# Category columns present in funding files
category_cols <- c(
  "broadband", "energy_and_power", "environmental_resilience",
  "housing_and_community_development", "passenger_and_freight_rail",
  "ports", "public_transportation", "roads_and_bridges", "water_conservation"
)

################################################################################
# Helpers
################################################################################

# 2026 source files provide full state names in the `state` column (e.g. "Alabama").
# Derive the abbreviation from the full name; the full name passes through unchanged.
state_abb_lookup <- append(
  setNames(state.abb, state.name),
  setNames(c("PR", "DC"), c("Puerto Rico", "District of Columbia"))
)

################################################################################
# 1.1 — Load table 1: County category funding (raw)
################################################################################

county_category_table <-
  read_csv(here(input_folder, "table1_countycategory.csv"), show_col_types = FALSE) %>%
  mutate(
    fips = str_pad(GEOID, 5, "left", "0"),
    state_abb = unname(state_abb_lookup[state])
  ) %>%
  select(-1, -GEOID) %>%
  clean_names()

################################################################################
# County per-capita category funding
################################################################################

county_category_per_1k <-
  read_csv(here(input_folder, "county_category_list_per_1000_ppl.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 5, "left", "0")) %>%
  select(-1, -state, -county, -year, -total_county_pop, -GEOID) %>%
  rename_with(~ str_c(., "_per_1k"), .cols = !fips)

county_with_funding <- county_category_table %>%
  left_join(county_category_per_1k, by = "fips")

################################################################################
# 1.1 — Load table 2: State category funding (raw)
################################################################################

state_category_table <-
  read_csv(here(input_folder, "table2_statecategory.csv"), show_col_types = FALSE) %>%
  mutate(
    fips = str_pad(GEOID, 2, "left", "0"),
    state_abb = unname(state_abb_lookup[state])
  ) %>%
  select(-1, -GEOID) %>%
  clean_names()

################################################################################
# State per-capita category funding
################################################################################

state_category_per_1k <-
  read_csv(here(input_folder, "state_category_list_per_1000_ppl.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 2, "left", "0")) %>%
  select(-1, -state, -year, -total_state_pop, -GEOID) %>%
  rename_with(~ str_c(., "_per_1k"), .cols = !fips)

state_with_funding <- state_category_table %>%
  left_join(state_category_per_1k, by = "fips")

################################################################################
# 1.1 — Load CBSA category funding (raw)
################################################################################

cbsa_category_table <-
  read_csv(here(input_folder, "cbsa_category_list.csv"), show_col_types = FALSE) %>%
  mutate(fips = as.character(GEOID)) %>%
  select(-1, -GEOID) %>%
  clean_names()

################################################################################
# CBSA per-capita category funding
################################################################################

cbsa_category_per_1k <-
  read_csv(here(input_folder, "cbsa_category_list_per_1000_ppl.csv"), show_col_types = FALSE) %>%
  mutate(fips = as.character(GEOID)) %>%
  select(-1, -cbsa, -year, -total_cbsa_pop, -GEOID) %>%
  rename_with(~ str_c(., "_per_1k"), .cols = !fips)

cbsa_with_funding <- cbsa_category_table %>%

  left_join(cbsa_category_per_1k, by = "fips")

################################################################################
# 1.4 — Load indicator tables
################################################################################

county_indicator_table <-
  read_csv(here(input_folder, "table3_county-indicator.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 5, "left", "0")) %>%
  rename(id = 1) %>%
  select(-GEOID, -county, -ALAND, -AWATER, -state) %>%
  mutate(across(any_of(c(
    "metro", "nonmetro", "persistent_poverty_county", "disadvantaged_county", "urban", "rural"
  )), as.logical)) %>%
  clean_names()

state_indicator_table <-
  read_csv(here(input_folder, "table4_state-indicator.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 2, "left", "0")) %>%
  rename(id = 1) %>%
  select(-GEOID, -ALAND, -AWATER) %>%
  clean_names()

cbsa_indicator_table <-
  read_csv(here(input_folder, "cbsa-indicator.csv"), show_col_types = FALSE) %>%
  rename(id = 1, fips = GEOID) %>%
  mutate(fips = as.character(fips)) %>%
  select(-ALAND, -AWATER, -id) %>%
  clean_names()

################################################################################
# Join funding + indicators into combined geography tables
################################################################################

county_data_joined <- county_with_funding %>%
  left_join(county_indicator_table, by = "fips") %>%
  mutate(state_fips = str_sub(fips, 1, 2))

state_data_joined <- state_with_funding %>%
  left_join(state_indicator_table, by = "fips")

cbsa_data_joined <- cbsa_with_funding %>%
  left_join(cbsa_indicator_table, by = "fips")

################################################################################
# 1.4 — Funding percentile ranks (NEW)
################################################################################

county_funding_percentile_ranks <-
  read_csv(here(input_folder, "county_category_list_percentile_rank.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 5, "left", "0")) %>%
  select(-1, -state, -county, -year, -total_county_pop, -GEOID)

state_funding_percentile_ranks <-
  read_csv(here(input_folder, "state_category_list_percentile_rank.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 2, "left", "0")) %>%
  select(-1, -state, -year, -total_state_pop, -GEOID)

cbsa_funding_percentile_ranks <-
  read_csv(here(input_folder, "cbsa_category_list_percentile_rank.csv"), show_col_types = FALSE) %>%
  mutate(fips = as.character(GEOID)) %>%
  select(-1, -cbsa, -year, -total_cbsa_pop, -GEOID)

################################################################################
# 1.4 — Indicator percentile ranks (NEW)
################################################################################

county_indicator_percentile_ranks <-
  read_csv(here(input_folder, "county_indicator_percentile_rank.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 5, "left", "0")) %>%
  select(-1, -NAME, -county, -state, -GEOID) %>%
  rename_with(~ str_remove(., "percent_rank_"), .cols = starts_with("percent_rank_"))

state_indicator_percentile_ranks <-
  read_csv(here(input_folder, "state_indicator_percentile_rank.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 2, "left", "0")) %>%
  select(-1, -NAME, -GEOID) %>%
  rename_with(~ str_remove(., "percent_rank_"), .cols = starts_with("percent_rank_"))

cbsa_indicator_percentile_ranks <-
  read_csv(here(input_folder, "cbsa_indicator_percentile_rank.csv"), show_col_types = FALSE) %>%
  mutate(fips = as.character(GEOID)) %>%
  select(-1, -NAME, -GEOID) %>%
  rename_with(~ str_remove(., "percent_rank_"), .cols = starts_with("percent_rank_"))

################################################################################
# 1.5 — Equity directions (sign of equity metric per category×indicator×location)
################################################################################

derive_equity_directions <- function(df, fips_width = NULL) {
  # Equity metric columns are named: category_{cat}-percent_rank_{indicator}
  # We extract the sign: positive → "higher", negative → "lower", zero → "neutral"
  df <- df %>% select(-1, -NAME, -any_of(c("county", "state")))

  if (!is.null(fips_width)) {
    df <- df %>% mutate(fips = str_pad(GEOID, fips_width, "left", "0")) %>% select(-GEOID)
  } else {
    df <- df %>% mutate(fips = as.character(GEOID)) %>% select(-GEOID)
  }

  metric_cols <- names(df)[names(df) != "fips"]

  df %>%
    mutate(across(all_of(metric_cols), ~ case_when(
      . > 0 ~ "higher",
      . < 0 ~ "lower",
      TRUE ~ "neutral"
    ))) %>%
    # Simplify column names: category_{cat}-percent_rank_{indicator} → {cat}-{indicator}
    # (remove only "percent_rank_" so the "-" separating category from indicator is kept)
    rename_with(
      ~ str_remove(., "category_") %>% str_remove("percent_rank_"),
      .cols = all_of(metric_cols)
    )
}

county_equity_directions <-
  read_csv(here(input_folder, "county_equity_metrics.csv"), show_col_types = FALSE) %>%
  derive_equity_directions(fips_width = 5)

state_equity_directions <-
  read_csv(here(input_folder, "state_equity_metrics.csv"), show_col_types = FALSE) %>%
  derive_equity_directions(fips_width = 2)

cbsa_equity_directions <-
  read_csv(here(input_folder, "cbsa_equity_metrics.csv"), show_col_types = FALSE) %>%
  derive_equity_directions()

################################################################################
# 1.6 — Concentration scores (category-level, ratio-based)
################################################################################

county_concentration_scores <-
  read_csv(here(input_folder, "county_concentration_score_all.csv"), show_col_types = FALSE) %>%
  select(-1)

state_concentration_scores <-
  read_csv(here(input_folder, "state_concentration_score_all.csv"), show_col_types = FALSE) %>%
  select(-1)

cbsa_concentration_scores <-
  read_csv(here(input_folder, "cbsa_concentration_score_all.csv"), show_col_types = FALSE) %>%
  select(-1)

################################################################################
# 1.6 — Disadvantaged / persistent poverty scores (category-level)
################################################################################

disadvantaged_poverty_scores <-
  read_csv(here(input_folder, "disadvantaged_persistent_poverty_scores.csv"), show_col_types = FALSE) %>%
  select(-1)

################################################################################
# 1.2 — Mapping tables (table5a, 5b, 5c)
################################################################################

# Table 5a: old → new program name mapping (for redirects)
table5a <- read_excel(here(input_folder, "table5a_old_to_new_program.xlsx")) %>%
  clean_names()

old_to_new_program_map <- table5a %>%
  select(
    old_program_short_name,
    new_program_short_name = program_short_name
  )

# Table 5b: program → category binary matrix (71 active programs)
table5b <- read_excel(here(input_folder, "table5b_program_to_category.xlsx")) %>%
  clean_names()

# Table 5c: category → indicator binary matrix (9 categories)
table5c <- read_excel(here(input_folder, "table5c_category_to_indicator.xlsx")) %>%
  clean_names()

################################################################################
# 1.7 — Program information (table6a)
################################################################################

program_information_table <-
  read_csv(here(input_folder, "table6a_programinformation.csv"), show_col_types = FALSE) %>%
  select(-1) %>%
  clean_names()

# Create wide version: 1 row per program with per-year funding columns
program_information_wide <- program_information_table %>%
  arrange(program_name) %>%
  pivot_wider(
    values_from = total_award_amount,
    names_from = year,
    names_glue = "fy_{year}_funding"
  )

# Total funding per program (sum across years)
program_total_funding <- program_information_table %>%
  group_by(program_short_name) %>%
  summarise(total_funding = sum(total_award_amount), .groups = "drop")

# Build programs.json: full program metadata
program_data <- program_information_wide %>%
  left_join(program_total_funding, by = "program_short_name") %>%
  left_join(
    table5b %>% select(program_short_name, iija_flag, ira_flag),
    by = "program_short_name"
  )

################################################################################
# Build programs_simple.json: 71 active programs with category associations
################################################################################

programs_with_categories <- table5b %>%
  select(program_short_name, program_name, all_of(category_cols)) %>%
  pivot_longer(
    cols = all_of(category_cols),
    names_to = "category",
    values_to = "include"
  ) %>%
  filter(include == 1) %>%
  group_by(program_short_name, program_name) %>%
  summarise(categories = list(category), .groups = "drop") %>%
  left_join(
    program_information_wide %>% select(program_short_name, agency_name, formula, competitive),
    by = "program_short_name"
  ) %>%
  rename(short_name = program_short_name, name = program_name)

################################################################################
# 1.3 — Category metadata (table6b) → categories.json
################################################################################

table6b <- read_csv(here(input_folder, "table6b_categoryinformation.csv"), show_col_types = FALSE) %>%
  select(-1) %>%
  clean_names()

# Canonical category dictionary: the snake_case slug is the unique identifier (primary key)
# for every category across the pipeline. table6b is the single source of truth — the only
# file declaring both slug (`category_short_name`) and display name (`category_name`) for all
# 9 categories. Assert its slug set matches the expected list so a source rename fails loudly.
stopifnot(setequal(unique(table6b$category_short_name), category_cols))

# Display-name override hook: keyed by slug. Empty = pass through table6b's category_name
# unchanged. The data team must confirm the canonical label for `ports` (table6b currently
# says "Airports and Docks" — see UPDATE_PLAN Open Item #5); when decided, add it here.
category_display_overrides <- c()

# Build per-year funding as a nested list, then join with totals
category_yearly <- table6b %>%
  group_by(category_name, category_short_name) %>%
  summarise(
    per_year_funding = list(setNames(as.list(total_award_amount), year)),
    .groups = "drop"
  )

categories_data <- table6b %>%
  group_by(category_name, category_short_name) %>%
  summarise(total_award_amount = sum(total_award_amount), .groups = "drop") %>%
  left_join(category_yearly, by = c("category_name", "category_short_name")) %>%
  rename(category = category_short_name) %>%
  mutate(category_name = ifelse(
    category %in% names(category_display_overrides),
    unname(category_display_overrides[category]),
    category_name
  )) %>%
  relocate(category)

################################################################################
# 1.3 — categories_simple.json: category list with programs and indicators
################################################################################

# Programs per category (from table5b)
category_programs <- table5b %>%
  select(program_short_name, all_of(category_cols)) %>%
  pivot_longer(cols = all_of(category_cols), names_to = "category", values_to = "include") %>%
  filter(include == 1) %>%
  group_by(category) %>%
  summarise(programs = list(program_short_name), .groups = "drop")

# Indicators per category (from table5c).
# table5c declares categories by display name only, so map each label to the canonical slug
# EXPLICITLY (not by string-munging) — a future label change then fails the stopifnot below
# instead of silently dropping indicators. Note "Ports" here is the slug `ports`, i.e. the
# same category table6b labels "Airports and Docks".
table5c_to_slug <- c(
  "Housing and Community Development" = "housing_and_community_development",
  "Roads and Bridges"                 = "roads_and_bridges",
  "Public Transportation"             = "public_transportation",
  "Passenger and Freight Rail"        = "passenger_and_freight_rail",
  "Broadband"                         = "broadband",
  "Environmental Resilience"          = "environmental_resilience",
  "Ports"                             = "ports",
  "Water Conservation"                = "water_conservation",
  "Energy and Power"                  = "energy_and_power"
)

indicator_cols_5c <- names(table5c)[names(table5c) != "category"]
table5c_mapped <- table5c %>%
  mutate(category = unname(table5c_to_slug[category]))
# Every table5c label must resolve to a known slug.
stopifnot(!anyNA(table5c_mapped$category))

category_indicators <- table5c_mapped %>%
  pivot_longer(cols = all_of(indicator_cols_5c), names_to = "indicator", values_to = "include") %>%
  filter(include == 1) %>%
  group_by(category) %>%
  summarise(indicators = list(indicator), .groups = "drop")
# Every canonical category must end up with indicators.
stopifnot(setequal(category_indicators$category, category_cols))

categories_simple <- categories_data %>%
  select(category, category_name) %>%
  left_join(category_programs, by = "category") %>%
  left_join(category_indicators, by = "category")

################################################################################
# 1.4 — Per-program per-capita funding (state + CBSA) for program page maps
################################################################################

state_program_funding_per_1k <-
  read_csv(here(input_folder, "state_program_list_per_1000_ppl.csv"), show_col_types = FALSE) %>%
  mutate(fips = str_pad(GEOID, 2, "left", "0")) %>%
  select(-1, -state, -year, -total_state_pop, -GEOID)

cbsa_program_funding_per_1k <-
  read_csv(here(input_folder, "cbsa_program_list_per_1000_ppl.csv"), show_col_types = FALSE) %>%
  mutate(fips = as.character(GEOID)) %>%
  select(-1, -cbsa, -year, -total_cbsa_pop, -GEOID)

################################################################################
# 1.4 — Funding medians by bucket (county + CBSA)
################################################################################

county_funding_medians <-
  read_csv(here(input_folder, "county_funding_medians_by_buckets.csv"), show_col_types = FALSE) %>%
  mutate(level = as.character(level)) %>%
  select(-1)

cbsa_funding_medians <-
  read_csv(here(input_folder, "cbsa_funding_medians_by_buckets.csv"), show_col_types = FALSE) %>%
  mutate(level = as.character(level)) %>%
  select(-1)

# Compute county medians for "across the state" comparisons (state_bucket rows)
county_state_medians <- county_data_joined %>%
  group_by(state_fips) %>%
  summarise(
    across(ends_with("_per_1k"), ~ median(.x, na.rm = TRUE), .names = "{.col}_median"),
    across(ends_with("_per_1k"), ~ median(.x[.x > 0], na.rm = TRUE), .names = "{.col}_funded_median"),
    .groups = "drop"
  ) %>%
  rename(level = state_fips) %>%
  mutate(bucket = "state_bucket") %>%
  relocate(bucket, .before = level)

county_funding_medians <- bind_rows(county_state_medians, county_funding_medians)

################################################################################
# Compute state funding medians (no source file provided — derive from data)
################################################################################

state_per_1k_cols <- names(state_with_funding)[str_detect(names(state_with_funding), "_per_1k$")]
state_funding_medians <- list()
for (k in state_per_1k_cols) {
  vals <- state_with_funding %>% pull(!!sym(k))
  state_funding_medians[[paste0(k, "_median")]] <- median(vals, na.rm = TRUE)
  state_funding_medians[[paste0(k, "_funded_median")]] <- median(vals[vals > 0], na.rm = TRUE)
}

################################################################################
# 1.8 — Quantile and t-test data (category-level)
################################################################################

category_quantile_funding <-
  read_csv(here(input_folder, "category_quantile_funding.csv"), show_col_types = FALSE) %>%
  select(-1)

category_t_test <-
  read_csv(here(input_folder, "category_t_test_data.csv"), show_col_types = FALSE) %>%
  select(-1)

################################################################################
# 1.9 — Search index
################################################################################

states_for_search <- state_data_joined %>%
  select(name = state, fips) %>%
  mutate(category = "state") %>%
  select(name, route_param = fips, category)

counties_for_search <- county_data_joined %>%
  select(county, fips, state_fips) %>%
  left_join(states_for_search, by = c("state_fips" = "route_param")) %>%
  mutate(
    state = name,
    name = paste(county, state, sep = ", "),
    category = "county"
  ) %>%
  select(name, state, category, route_param = fips)

cbsas_for_search <- cbsa_data_joined %>%
  select(cbsa, fips) %>%
  mutate(state = NA, name = cbsa, category = "cbsa") %>%
  select(name, state, category, route_param = fips)

programs_for_search <- programs_with_categories %>%
  select(short_name) %>%
  mutate(
    name = short_name,
    category = "program",
    route_param = str_replace_all(short_name, "_", "-")
  ) %>%
  select(name, category, route_param)

categories_for_search <- categories_simple %>%
  select(category_name, category) %>%
  mutate(
    name = category_name,
    # Compute route_param from the slug BEFORE overwriting `category` with the record type.
    route_param = str_replace_all(category, "_", "-"),
    category = "category"
  ) %>%
  select(name, category, route_param)

search_data <- bind_rows(
  categories_for_search,
  programs_for_search,
  states_for_search,
  counties_for_search,
  cbsas_for_search
)

################################################################################
# Output to JSON
################################################################################

if (!dir.exists(output_folder)) {
  dir.create(output_folder, recursive = TRUE)
}

# Geography combined tables (funding + indicators)
county_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "counties.json"))

state_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "states.json"))

cbsa_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsas.json"))

# Funding percentile ranks (NEW)
county_funding_percentile_ranks %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "county_funding_percentile_ranks.json"))

state_funding_percentile_ranks %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "state_funding_percentile_ranks.json"))

cbsa_funding_percentile_ranks %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsa_funding_percentile_ranks.json"))

# Indicator percentile ranks (NEW)
county_indicator_percentile_ranks %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "county_indicator_percentile_ranks.json"))

state_indicator_percentile_ranks %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "state_indicator_percentile_ranks.json"))

cbsa_indicator_percentile_ranks %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsa_indicator_percentile_ranks.json"))

# Equity directions (NEW)
county_equity_directions %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "county_equity_directions.json"))

state_equity_directions %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "state_equity_directions.json"))

cbsa_equity_directions %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "cbsa_equity_directions.json"))

# Program data
program_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "programs.json"))

programs_with_categories %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "programs_simple.json"))

# Per-program per-capita funding by geography (for program-page maps)
state_program_funding_per_1k %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "state_program_funding_per_1k.json"))

cbsa_program_funding_per_1k %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsa_program_funding_per_1k.json"))

# Category metadata
categories_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "categories.json"))

categories_simple %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "categories_simple.json"))

# Concentration scores
county_concentration_scores %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "county_concentration_scores.json"))

state_concentration_scores %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "state_concentration_scores.json"))

cbsa_concentration_scores %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsa_concentration_scores.json"))

# Funding medians
county_funding_medians %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "county_funding_medians.json"))

cbsa_funding_medians %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsa_funding_medians.json"))

state_funding_medians %>%
  toJSON(na = "null", auto_unbox = TRUE) %>%
  write_lines(here(output_folder, "state_funding_medians.json"))

# Disadvantaged / poverty scores
disadvantaged_poverty_scores %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "disadvantaged_poverty_scores.json"))

# Quantile and t-test
category_quantile_funding %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "category_quantile_funding.json"))

category_t_test %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "category_t_test.json"))

# Search index
search_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "search.json"))

# Old-to-new program redirect map
old_to_new_program_map %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "old_to_new_program_map.json"))

cat("✓ Preprocessing complete. Output written to:", output_folder, "\n")
