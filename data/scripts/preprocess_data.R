################################################################################
# This script converts the 2024 source data for the PERC data tool
# It reads source files in the format that have been provided by the
# Urban Institute research team and optimizes the data for the front-end application.

# Dependencies
# Necessary packages for this script can be installed with:

# install.packages("tidyverse")
# install.packages("readxl")
# install.packages("here")
# install.packages("jsonlite")
# install.packages("janitor")
################################################################################

################################################################################
# Load libraries used
################################################################################

library(tidyverse)
library(readxl)
library(here)
library(jsonlite)
library(janitor)

input_folder <- here("data", "source", "tables")
output_folder <- here("data", "output", "preprocessed")

################################################################################
# Load in table 1: county program table
# Make FIPS column a character column and ensure leading zeros for applicable states
# Drop geo columns that are unused
# Clean all columns names with janitor::clean_names()
################################################################################

pr_dc_lookup <- setNames(c("Puerto Rico", "District of Columbia"), c("PR", "DC"))
state_name_lookup <- append(setNames(state.name, state.abb), pr_dc_lookup)
county_program_table <-
  read_csv(here(input_folder, "table1_countyprogram.csv"), show_col_types = F) %>%
  mutate(
    fips = str_pad(GEOID, 5, "left", "0"),
    state_abb = state,
    state = state_name_lookup[state]
  )  %>%
  select(-1, -GEOID) %>%
  clean_names()

## Load county and state per 1k funding and join as new columns
county_program_funding_per_1k <-
  read_csv(here(input_folder, "county_program_list_per_1000_ppl.csv")) %>%
  mutate(
    fips = str_pad(GEOID, 5, "left", "0"),
  ) %>%
  select(
    -1,
    -state,
    -county,
    -year,
    -total_county_pop
    ) %>%
  rename_with(
    ~ str_c(., "_per_1k"),
    .cols = 2:82
  )

county_with_funding_per_cap <- county_program_table %>%
  left_join(county_program_funding_per_1k)

################################################################################
# Load in table 2: state program table
# Make FIPS column a character column and ensure leading zeros for applicable states
# Clean all columns names with janitor::clean_names()
################################################################################

state_program_table <-
  read_csv(here(input_folder, "table2_stateprogram.csv"), show_col_types = F) %>%
  mutate(
    fips = str_pad(GEOID, 2, "left", "0"),
    state_abb = state,
    state = state_name_lookup[state]
  ) %>%
  select(-1, -GEOID) %>%
  clean_names()

state_program_funding_per_1k <-
  read_csv(here(input_folder, "state_program_list_per_1000_ppl.csv")) %>%
  mutate(
    fips = str_pad(GEOID, 2, "left", "0"),
  ) %>%
  select(
    -1,
    -state,
    -year,
    -total_state_pop,
    -GEOID
  ) %>%
  rename_with(
    ~ str_c(., "_per_1k"),
    .cols = 1:110
  )

state_with_funding_per_cap <- state_program_table %>%
  left_join(state_program_funding_per_1k, by="fips")

################################################################################
# Load in: CBSA program table
# Make FIPS column a character column and ensure leading zeros for applicable states
# Clean all columns names with janitor::clean_names()
################################################################################
cbsa_program_table <-
  read_csv(here(input_folder, "cbsa_program_list.csv"), show_col_types = F) %>%
  rename(
    fips = GEOID,
  ) %>%
  mutate(
    fips = as.character(fips)
  ) %>%
  select(-1, -total_cbsa_pop) %>%
  clean_names()

# Load in CBSA funding per capita and join to other CBSA table
cbsa_program_funding_per_1k <-
  read_csv(here(input_folder, "cbsa_program_list_per_1000_ppl.csv")) %>%
  mutate(
    fips = as.character(GEOID),
  ) %>%
  select(
    -1,
    -cbsa,
    -GEOID
  ) %>%
  rename_with(
    ~ str_c(., "_per_1k"),
    .cols = 2:82
  )

cbsa_with_funding_per_cap <- cbsa_program_table %>%
  left_join(cbsa_program_funding_per_1k, by="fips")

################################################################################
# Load in table 3: county indicator table
# Make FIPS column a character column and ensure leading zeros for applicable states
# Drop GEOID and NAME columns, as well as county and state which will come from
# join with county_program_table later
# Convert some columns to logical
# Clean all columns names with janitor::clean_names()
################################################################################

county_indicator_table <-
  read_csv(here(input_folder, "table3_county-indicator.csv"), show_col_types = F) %>%
  mutate(fips = str_pad(GEOID, 5, "left", "0")) %>%
  rename(id = 1) %>%
  select(
    -GEOID,
    -county,
    -ALAND,
    -AWATER,
    -state
  ) %>%
  mutate(across(c(
    metro, nonmetro, persistent_poverty_county, disadvantaged_county, urban, rural
  ), as.logical)) %>%
  clean_names()

################################################################################
# Load in table 4: state indicator table
# Make FIPS column a character column and ensure leading zeros for applicable states
# Clean all columns names with janitor::clean_names()
################################################################################

state_indicator_table <-
  read_csv(here(input_folder, "table4_state-indicator.csv"), show_col_types = F) %>%
  mutate(fips = str_pad(GEOID, 2, "left", "0")) %>%
  rename(id = 1) %>%
  select(-GEOID, -ALAND, -AWATER) %>%
  clean_names()

################################################################################
# Load in: CBSA indicator table
# Make FIPS column a character column
# Drop id, ALAND and AWATER columns
# Clean all columns names with janitor::clean_names()
################################################################################

cbsa_indicator_table <-
  read_csv(here(input_folder, "cbsa-indicator.csv"), show_col_types = F) %>%
  rename(id = 1, fips = GEOID) %>%
  mutate(fips = as.character(fips)) %>%
  select(-ALAND, -AWATER, -id) %>%
  clean_names()


################################################################################
# Load in table 5: Program indicators
# rename columns for easier access
# convert integers to logical where appropriate
# Clean all columns names with janitor::clean_names()
################################################################################

program_indicator_table <-
  read_excel(here(input_folder, "table5_programindicator.xlsx")) %>%
  rename(
    name = "Program Name",
    short_name = "Program Short Name",
    description = "Program Description",
  ) %>%
  arrange(name) %>%
  clean_names() %>%
  select(
    -iija_flag,
    -ira_flag
  )



################################################################################
# Load in table 6: Program information
# Clean all columns names with janitor::clean_names()
# Select relevant columns
# Create wider version of table with 1 row per program
################################################################################

program_information_table <-
  read_csv(here(input_folder, "table6_programinformation.csv")) %>%
  rename(
    short_name = "program_short_name",
  ) %>%
  clean_names() %>%
  select(
    -1,
  )

# reformat this table so there is 1 row per program, like the rest of the data
# keep the annual funding amounts as new columns
program_information_table_wide <- program_information_table %>%
  arrange(program_name) %>%
  pivot_wider(values_from = total_award_amount,
              names_from = year,
              names_glue = "fy_{year}_funding") %>%
  select(
    short_name,
    agency_name,
    bureau_name,
    formula,
    competitive,
    iija_flag,
    ira_flag,
    county_level,
    fy_2023_funding,
    fy_2022_funding
  )

# create table of programs with list of categories
programs_with_categories <- program_indicator_table %>%
  select(
    short_name,
    name,
    ends_with("_category")
  ) %>%
  pivot_longer(
    ends_with("category"),
    values_to = "include",
    names_to = "category",
  ) %>%
  filter(
    include == 1
  ) %>%
  group_by(
    short_name,
  ) %>%
  summarize(
    categories = list(category)
  ) %>%
  mutate(
    categories = map(categories, ~ str_replace(.x, "_category", ""))
  ) %>%
  ungroup() %>% left_join(program_information_table_wide, by = "short_name") %>%
  select(
    short_name,
    categories,
    county_level,
    agency_name
  )

################################################################################
# Calculate total funding for each program from state table
################################################################################

program_total_funding <- state_program_table %>%
  select(-year, -total_state_pop, -fips, -state_abb) %>%
  pivot_longer(cols = !state, names_to="short_name", values_to = "total_funding") %>%
  group_by(short_name) %>%
  summarise(total_funding = sum(total_funding))


################################################################################
# Join state, county, and cbsa program and indicator tables
################################################################################

county_data_joined <- county_with_funding_per_cap %>%
  left_join(
    county_indicator_table,
    by="fips"
  ) %>%
  mutate(
    state_fips = str_sub(fips, 1, 2)
  )

state_data_joined <- state_with_funding_per_cap %>%
  left_join(
    state_indicator_table,
    by="fips"
  )

cbsa_data_joined <- cbsa_with_funding_per_cap %>%
  left_join(
    cbsa_indicator_table,
    by="fips"
  )

################################################################################
# Join program information and indicator tables
################################################################################

output_program_columns <-
  c(
    "short_name",
    "iija_flag",
    "ira_flag",
    "county_level",
    "formula",
    "competitive",
    "agency_name",
    "bureau_name",
    "total_funding",
    "fy_2022_funding",
    "fy_2023_funding"
  )

program_data <- program_information_table_wide %>%
  left_join(
    program_indicator_table,
    by="short_name"
  ) %>%
  left_join(
    program_total_funding,
    by="short_name"
  ) %>%
  select(all_of(output_program_columns))


################################################################################
# Load funding medians by bucket
################################################################################

cbsa_funding_medians_by_buckets <- read_csv(here(input_folder, "cbsa_funding_medians_by_buckets.csv")) %>%
  mutate(level = as.character(level)) %>%
  select(-1)

county_funding_medians_by_buckets <- read_csv(here(input_folder, "county_funding_medians_by_buckets.csv")) %>%
  mutate(level = as.character(level)) %>%
  select(-1)

# Compute county medians for "across the state" comparisons
county_funding_medians_by_buckets <- bind_rows(
  county_data_joined %>% group_by(state_fips) %>%
    summarise(
      across(ends_with("_per_1k"), ~ median(.x), .names = "{.col}_median"),
      across(ends_with("_per_1k"), ~ median(.x[.x > 0]), .names = "{.col}_funded_median")
    ) %>%
    rename(level = state_fips) %>%
    mutate(bucket = "state_bucket") %>%
    relocate(bucket, .before = level),
    county_funding_medians_by_buckets
)

################################################################################
# Compute state funding medians
################################################################################

funding_keys <- names(state_data_joined[str_detect(names(state_data_joined), "per_1k")])
state_funding_medians <- list()
for (k in funding_keys) {
  program_funding <- state_data_joined %>% pull(k)
  program_funding_funded <- program_funding[program_funding > 0]
  state_funding_medians[[k]] = median(program_funding)
  state_funding_medians[[paste0(k, "_funded")]] = median(program_funding_funded)
}


################################################################################
# Load equity metrics
# 1 equity metric for each program x indicator x location (county or state)
# equity metric is the difference between the program funding percentile
# and the indicator percentile
################################################################################

county_equity_scores <- read_csv(here(input_folder, "county_equity_metrics.csv")) %>%
  select(-1, -NAME, -county, -state) %>%
  rename(fips = GEOID) %>%
  rename_with( ~ str_remove(., "program_") %>% str_remove("percent_rank_"),
               .cols = starts_with("program_"))

state_equity_scores <- read_csv(
  here(input_folder, "state_equity_metrics.csv")
) %>%
  select(-1, -NAME) %>%
  rename(fips = GEOID) %>%
  rename_with( ~ str_remove(., "program_") %>% str_remove("percent_rank_"),
               .cols = starts_with("program_"))

cbsa_equity_scores <- read_csv(here(input_folder, "cbsa_equity_metrics.csv")) %>%
  select(-1, -NAME) %>%
  rename(fips = GEOID) %>%
  mutate(fips = as.character(fips)) %>%
  rename_with( ~ str_remove(., "program_") %>% str_remove("percent_rank_"),
               .cols = starts_with("program_"))

################################################################################
# Import data outputs for program equity metrics
################################################################################

equity_scores_county <- read_csv(here(input_folder, "county_concentration_score_all.csv")) %>%
  select(-1)

equity_scores_state_concentration <- read_csv(here(input_folder, "state_concentration_score_all.csv")) %>%
  select(-1)

equity_scores_program_variability <- read_csv(here(input_folder, "state_formula_program_variability_scores_div_by_national_funding.csv")) %>%
  select(-1) %>%
  select(program = state_formula_program, variability_score = variability_score_div_national_funding)

# new disadvantaged county scores
equity_scores_program_disadadvantaged <- read_csv(here(input_folder, "disadvantaged_persistent_poverty_scores.csv")) %>%
  select(-1)

equity_scores_state <- equity_scores_state_concentration %>%
  left_join(equity_scores_program_variability, by = "program") %>%
  left_join(equity_scores_program_disadadvantaged, by = "program")

equity_scores_cbsa <- read_csv(here(input_folder, "cbsa_concentration_score_all.csv")) %>%
  select(-1)

################################################################################
# Create small table for search that includes programs, states and counties
################################################################################

states_for_search <- state_data_joined %>%
  select(name, fips) %>%
  mutate(category = "state") %>%
  select(
    name,
    route_param = fips,
    category
  )

counties_for_search <- county_data_joined %>%
  select(county, fips, state_fips) %>%
  left_join(states_for_search, by = c("state_fips" = "route_param")) %>%
  mutate(
    state = name,
    name = paste(county, name, sep = ", "),
    category = "county"
  ) %>%
  select(
    name,
    state,
    category,
    route_param = fips
  )

cbsas_for_search <- cbsa_data_joined %>%
  select(cbsa, fips) %>%
  mutate(
    state = NA,
    name = cbsa,
    category = "cbsa"
  ) %>%
  select(
    name,
    state,
    category,
    route_param = fips
  )

programs_for_search <- program_information_table_wide %>%
  select(
    short_name
  ) %>%
  mutate(
    category = "program",
    route_param = str_replace_all(short_name, "_", "-")
  ) %>%
  select(-short_name) 

categories_for_search <- programs_with_categories %>%
  select(categories) %>%
  unnest(cols=c(categories)) %>%
  distinct() %>%
  arrange(categories) %>%
  rename(name = categories) %>%
  mutate(
    category = "program-categories",
    route_param = NA,
    page_id = str_replace_all(name, "_", "-")
  )

search_data <- bind_rows(categories_for_search, programs_for_search, states_for_search, counties_for_search, cbsas_for_search)

################################################################################
# Program quantiles
################################################################################

program_quantile_funding_data <- read_csv(here(input_folder, "program_quantile_funding.csv"))

all_t_test_data <- read_csv(here(input_folder, "program_t_test_data.csv")) %>%
  select(-1)

################################################################################
# Output tables to JSON or CSV format
################################################################################

if (!dir.exists(output_folder)) {
  dir.create(output_folder, recursive = TRUE)
}

county_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "counties.json"))

state_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "states.json"))

cbsa_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsas.json"))

program_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "programs.json"))

# simple list of programs
programs_with_categories %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "programs_simple.json"))

county_funding_medians_by_buckets %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "county_bucket_funding_medians.json"))

cbsa_funding_medians_by_buckets %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "cbsa_bucket_funding_medians.json"))

state_funding_medians %>%
  toJSON(na = "null", auto_unbox = TRUE) %>%
  write_lines(here(output_folder, "state_funding_medians.json"))

county_equity_scores %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "county_equity_scores.json"))

state_equity_scores %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "state_equity_scores.json"))

cbsa_equity_scores %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "cbsa_equity_scores.json"))

search_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "search.json"))

equity_scores_county %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_equity_scores_county.json"))

equity_scores_state %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_equity_scores_state.json"))

equity_scores_cbsa %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_equity_scores_cbsa.json"))

program_quantile_funding_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_quantile_funding.json"))

all_t_test_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_t_test.json"))
