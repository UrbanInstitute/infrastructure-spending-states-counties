################################################################################
# This script converts source data for the PERC data tool
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

################################################################################
# Specify input and output folders relative to the project root
################################################################################

input_folder <- here("data", "source", "tables")
output_folder <- here("src", "data")

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
    fips = str_pad(FIPS, 5, "left", "0"),
    state_abb = state,
    state = state_name_lookup[state]
  )  %>%
  select(-GISJOIN, -GEO_ID, -FIPS) %>%
  clean_names()

################################################################################
# Load in table 2: state program table
# Make FIPS column a character column and ensure leading zeros for applicable states
# Clean all columns names with janitor::clean_names()
################################################################################

state_program_table <-
  read_csv(here(input_folder, "table2_stateprogram.csv"), show_col_types = F) %>%
  mutate(
    fips = str_pad(FIPS, 2, "left", "0"),
    state_abb = state,
    state = state_name_lookup[state]
    ) %>%
  select(-FIPS, -GISJOIN) %>%
  clean_names()

################################################################################
# Load in table 3: county indicator table
# Make FIPS column a character column and ensure leading zeros for applicable states
# Drop GEOID and NAME columns, as well as county and state which will come from
# join with county_program_table
# Convert some columns to logical
# Clean all columns names with janitor::clean_names()
################################################################################

county_indicator_table <-
  read_csv(here(input_folder, "table3_county-indicator.csv"), show_col_types = F) %>%
  mutate(fips = str_pad(GEOID, 5, "left", "0")) %>%
  rename(id = 1) %>%
  select(
    -GEOID,
    -NAME,
    -county,
    -state
    ) %>%
  mutate(across(c(
    metro, nonmetro, persistent_poverty_county, urban, rural
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
  select(-GEOID) %>%
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
  select(-name) %>%
  clean_names() %>%
  mutate(
    type = case_when(
      type == "IJIA" ~ "IIJA",
      .default = type
    )
  )

# create table of programs with list of categories
programs_with_categories <- program_indicator_table %>%
  select(
    short_name,
    type,
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
    type
  ) %>% 
  summarize(
    categories = list(category)
  ) %>% 
  mutate(
    categories = map(categories, ~ str_replace(.x, "_category", ""))
  ) %>%
  ungroup()

################################################################################
# Load in table 6: Program information
# Clean all columns names with janitor::clean_names()
################################################################################

program_information_table <-
  read_excel(here(input_folder, "table6_programinformation.xlsx")) %>%
  rename(
    short_name = "Program Short Name",
    formula_competitive = "Formula or Competitive (simplified)",
  ) %>%
  clean_names()

################################################################################
# Calculate per 100k funding numbers for states and counties
# Pull columns to calculate from any_of() the short_name column from 
# the program information table
################################################################################

county_with_funding_per_cap <- county_program_table %>%
  mutate(across(
    any_of(
      program_information_table$short_name),
      ~ (.x / total_county_pop) * 1000,
      .names = "{.col}_per_1k"
  ))

state_with_funding_per_cap <- state_program_table %>%
  mutate(across(
    any_of(
      program_information_table$short_name),
      ~ (.x / total_state_pop) * 1000,
      .names = "{.col}_per_1k"
  ))

################################################################################
# Calculate total funding for each program from state table
################################################################################
program_total_funding <- state_program_table %>% 
  select(-year, -total_state_pop, -fips, -state_abb) %>% 
  pivot_longer(cols = !state, names_to="short_name", values_to = "total_funding") %>% 
  group_by(short_name) %>% 
  summarise(total_funding = sum(total_funding))

################################################################################
# Join state and county program and indicator tables
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

################################################################################
# Join program information and indicator tables
################################################################################

output_program_columns <- c("short_name", "type", "agency_name", "total_funding", "formula_competitive")
program_data <- program_information_table %>%
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
# Funding medians by bucket
################################################################################

bucket_names <- county_data_joined %>%
  select(ends_with("bucket")) %>%
  names()
  
median_of_funded <- function(funding) {
  funded_only <- funding[funding > 0]
  median(funded_only)
}
# created a nested data frame that includes a data frame for each bucket,
# within these nested dataframes each row is a single bucket, with a column
# for median funding per 1k for each program, and then unnest into a flat table
funding_medians_by_buckets <- tibble(
  bucket = bucket_names,
  medians = bucket_names %>% map(
    \(x) county_data_joined %>%
      group_by(across(all_of(x), .names = "level")) %>%
      summarise(
        across(
          ends_with("_per_1k"), ~ median(.x), .names = "{.col}_median"
        ),
        across(
          ends_with("_per_1k"), ~ median_of_funded(.x), .names = "{.col}_funded_median"
        )
      )
  )
) %>% unnest(cols = c(medians))

################################################################################
# Calculate equity metrics
# 1 equity metric for each program x indicator x location (county or state)
# equity metric is the difference between the program funding percentile
# and the indicator percentile
################################################################################

indicator_names <- program_indicator_table %>%
  select(
    !ends_with("category") & where(~ is.numeric(.x))
  ) %>% 
  select(
    -urban,
    -rural,
  ) %>%
  names()

# some metrics need their percent rank to be inverted, where a lower value
# represents a higher need
pct_rank_inverses <- paste0(c(
  "med_hh_income",
  "broadband_speed",
  "hh_int_access",
  "employment_access_index",
  "access_to_car",
  "power_generation",
  "housing_units",
  "permits",
  "capacity_housing",
  "capacity_environment",
  "capacity_transport"
), "_pct_rank")

# takes a data frame of geographies with fips codes, and a list of columns
# computes pct_rank for each column and returns a data frame with fips and
# the computed pct_ranks
get_pct_ranks <- function(data, cols, id_col = "fips") {
  data %>% mutate(
    across(any_of(cols), percent_rank, .names = "{.col}_pct_rank")
  ) %>%
  select(
    !!id_col,
    ends_with("_pct_rank")
  ) %>% 
  mutate(
    across(any_of(pct_rank_inverses), ~ 1 - .)
  ) %>%
  rename_with(
    .cols = ends_with("pct_rank"),
    .fn = ~ str_replace(., "_pct_rank", "")
  ) %>%
  arrange(!!id_col)
}

# table of states with fips codes and pct_ranks for each indicator
state_indicators_with_pct_rank <- state_indicator_table %>% 
  get_pct_ranks(indicator_names)

# table of states with fips codes and pct_ranks for each program
state_programs_with_pct_rank <- state_program_table %>%
  get_pct_ranks(program_information_table$short_name)

# let's get a list of all of the programs that don't have any county funding
# so we can filter them out where necessary
programs_no_county_funding <- county_program_table %>% 
  select(where(~ is.numeric(.x) && sum(.x) == 0)) %>%
  names

# table of counties with fips codes and pct_ranks for each indicator
county_indicators_with_pct_rank <- county_indicator_table %>%
  get_pct_ranks(indicator_names)

# table of counties with fips codes and pct_ranks for each program
# first, filter out all of the columns that have zero county funding
county_programs_with_pct_rank <- county_program_table %>%
  select(!all_of(programs_no_county_funding)) %>%
  get_pct_ranks(program_information_table$short_name)

# table with a row for each program/indicator combo
# first just get columns for shot_name and the indicators
# next, pivot longer, and then filter out the indicators that don't apply
# finally, just include the program short_name and the indicator in the final table
# manually filtering out the persistent_poverty_county indicator
# as it is a TRUE/FALSE column, and not numeric
program_indicator_long <- program_indicator_table %>%
  select(
    -type,
    -description,
    -eligible_uses,
    -urban,
    -rural,
    -ends_with("_category")
  ) %>%
  pivot_longer(!short_name, names_to = "indicator", values_to = "include") %>%
  filter(
    include == 1,
    indicator != "persistent_poverty_county",
    indicator != "wf_risk",
    indicator != "contaminated_water_bodies",
    indicator != "flood_risk"
    ) %>%
  select(-include) %>% 
  mutate(
    score_name = paste(short_name, indicator, sep = "-")
  )

compute_equity_scores <- function (program_pct_ranks, indicator_pct_ranks) {
  
  # first, make sure data frames are ordered and that they match up
  ordered_program_ranks <- program_pct_ranks %>% arrange(fips)
  ordered_indicator_ranks <- indicator_pct_ranks %>% arrange(fips)
  
  # count the number of rows that have matching fips codes in input data frames
  num_matches <- sum(
    ordered_indicator_ranks$fips == ordered_program_ranks$fips
  )
  
  # make sure the number of matches is equal to the number of total rows in input
  if (num_matches < nrow(ordered_program_ranks) | num_matches < nrow(ordered_indicator_ranks)) {
    print(paste("Matches: ", num_matches, "\nPrograms:", length(ordered_program_ranks)))
    stop("Input data does not match")
  }
  
  # save fips column to re-join after scores are calculated
  fips_codes <- ordered_indicator_ranks %>% select(fips)
  
  # get data frames of just the values
  program_vals <- ordered_program_ranks %>% select(-fips)
  indicator_vals <- ordered_indicator_ranks %>% select(-fips)
  
  # allocate a data frame large enough to hold all results
  result_matrix <- matrix(
      NA, 
      nrow = nrow(program_vals), 
      ncol = (ncol(program_vals) * ncol(indicator_vals))
  ) %>% as_tibble(.name_repair = "minimal")
  
  # count how many columns for each input
  num_program_cols <- ncol(program_vals)
  num_indicator_cols <- ncol(indicator_vals)
  
  # loop through all columns and calculate results, and store them in result_matrix
  for(i in 1:num_program_cols) {
    for(j in 1:num_indicator_cols) {
      
      # calculate the column index based on the loop
      new_col_idx <- ((i - 1) * num_indicator_cols) + j
      
      # set the matrix's column to the difference of the program column and indicator column
      result_matrix[, new_col_idx] = program_vals[, i] - indicator_vals[, j]
      
      # get a string name based on program and indicator
      col_name <- paste(names(program_vals)[i], names(indicator_vals)[j], sep="-")
      
      # set the matrix's column name to the new name
      colnames(result_matrix)[new_col_idx] <- col_name
    }
  }
  
  # add the FIPS codes column back in to result data frame
  return(bind_cols(fips_codes, result_matrix))
}

# get state equity score
# select only the columns that are relevant from
# program_indicator_long
state_equity_scores <- compute_equity_scores(
  state_programs_with_pct_rank,
  state_indicators_with_pct_rank
) %>%
  select(fips, any_of(program_indicator_long$score_name))

# get county equity score
# select only the columns that are relevant from
# program_indicator_long
county_equity_scores <- compute_equity_scores(
  county_programs_with_pct_rank,
  county_indicators_with_pct_rank
) %>%
  select(fips, any_of(program_indicator_long$score_name))

################################################################################
# Import data outputs for program equity metrics
################################################################################

equity_scores_county_high_need <- read_csv(here(input_folder, "county_high_need_equity_score_all.csv")) %>%
  select(-1)

equity_scores_county_concentration <- read_csv(here(input_folder, "county_concentration_score_all.csv")) %>%
  select(-1)

equity_scores_county <- equity_scores_county_high_need %>% left_join(equity_scores_county_concentration, by="program")

equity_scores_state_high_need <- read_csv(here(input_folder, "state_high_need_equity_score_all.csv")) %>%
  select(-1)

equity_scores_state_concentration <- read_csv(here(input_folder, "state_concentration_score_all.csv")) %>%
  select(-1)

equity_scores_program_variability <- read_csv(here(input_folder, "state_formula_program_variability_scores_div_by_national_funding.csv")) %>%
  select(-1) %>%
  select(program = state_formula_program, variability_score = variability_score_div_national_funding)

equity_scores_state <- equity_scores_state_high_need %>% 
  left_join(equity_scores_state_concentration, by = "program") %>%
  left_join(equity_scores_program_variability, by = "program")

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

programs_for_search <- program_information_table %>%
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

search_data <- bind_rows(categories_for_search, programs_for_search, states_for_search, counties_for_search)

################################################################################
# Program quantiles
################################################################################

# function that gives us the name of the base quantile
# from the input quantile_breaks
get_quantile_name <- function(val, quantile_breaks) {
  if (is.na(val)) {
    return(NA)
  }
  q_names <- names(quantile_breaks)
  for (i in seq(1, length(quantile_breaks) - 1)) {
    if (val <= quantile_breaks[i + 1]) {
      return(q_names[i])
    }
  }
  return(q_names[length(q_names)])
}

format_pct_str <- function(pct_num) {
  sprintf("%g%%", round(pct_num * 100))
}

get_quantile_range <- function(val, quantile_breaks) {
  if (is.na(val)) {
    return(NA)
  }
  quantile_vals <- unname(quantile_breaks)
  for (i in seq(1, length(quantile_vals) - 1)) {
    if (val <= quantile_vals[i + 1]) {
      range_start = 0
      if (i > 1) {
        range_start = quantile_vals[i]
      }
      range_vec <- c(range_start, quantile_vals[i + 1])
      return(range_vec)
    }
  }
  range_vec <- c(quantile_vals[length(quantile_vals)], NA)
  return(range_vec)
}


## calculate the median funding per quartile for a given program's related indicators
calculate_quantile_funding <- function(program_short_name, input_funding_data, data_level) {
  if (!program_short_name %in% names(input_funding_data)) {
    return(NULL)
  }
  # break points to use for county level data represent quintiles
  quintile_breaks <-  c(0, 0.2, 0.4, 0.6, 0.8)
  
  # break points to use for state level data represent quartiles
  quartile_breaks <- c(0, 0.25, 0.5, 0.75)
  
  quantile_breaks <- quintile_breaks
  if(data_level == "state") {
    quantile_breaks <- quartile_breaks
  }
  
  # the program's related indicators come from the program_indicators table
  program_indicators <-
    program_indicator_long %>% filter(short_name == program_short_name)
  
  filtered_indicators <- program_indicators%>% filter(indicator %in% names(input_funding_data)) %>% pull(indicator)
  program_quantile_data <- tibble()
  
  # loop through the related indicators
  for (indicator in filtered_indicators) {
    # get a subset of the state funding data to compute median funding for state quartiles
    funding_table <- input_funding_data %>%
      select(any_of(sprintf("%s_per_1k", program_short_name)), any_of(indicator))
    
    # calculate state level quartiles
    indicator_quantiles <-
      quantile(input_funding_data[[indicator]],
               probs = quantile_breaks,
               na.rm = TRUE)
    
    # if we come up with any columns that don't exist, like the flood_risk
    # just skip to next indicator
    if (is.na(indicator_quantiles[1])) {
      next
    }
    
    program_funding_key <- sprintf("%s_per_1k", program_short_name)
    program_indicator_quantiles <- funding_table %>%
      mutate(
        quantile = purrr::map_chr(
          funding_table[[indicator]],
          ~ get_quantile_name(.x, indicator_quantiles)
        ),
        quantile_range = purrr::map(
          funding_table[[indicator]],
          ~ get_quantile_range(.x, indicator_quantiles)
        )
      ) %>%
      filter(!is.na(quantile)) %>%
      group_by(quantile, quantile_range) %>%
      summarize(
        indicator = indicator,
        program = program_short_name,
        data_level = data_level,
        across(
          all_of(program_funding_key),
          ~ mean(.x, na.rm = TRUE),
          .names = "funding_average_per_1k"
        ),
        .groups = "drop"
      )
    program_quantile_data <- bind_rows(program_quantile_data, program_indicator_quantiles)
    
  }
  program_quantile_data
}

state_program_quantile_funding <- purrr::map(
  program_information_table$short_name, 
  ~ calculate_quantile_funding(.x, state_data_joined, "state"),
  .progress = "Calculating state program quantile data") %>%
  list_rbind()

county_program_quantile_funding <- purrr::map(
  program_information_table$short_name, 
  ~ calculate_quantile_funding(.x, county_data_joined, "county"),
  .progress = "Calculating county program quantile data") %>%
  list_rbind()

urban_county_program_quantile_funding <- purrr::map(
  program_information_table$short_name, 
  ~ calculate_quantile_funding(.x, filter(county_data_joined, urban == TRUE), "county_urban"),
  .progress = "Calculating urban county program quantile data") %>%
  list_rbind()

program_quantile_funding_data <- bind_rows(
  state_program_quantile_funding,
  county_program_quantile_funding,
  urban_county_program_quantile_funding
)
# get funding trends per program and indicator
get_funding_trend <- function(program_short_name, input_funding_data, data_level) {
  if (!program_short_name %in% names(input_funding_data)) {
    return(NULL)
  }
  program_indicators <-
    program_indicator_long %>% filter(short_name == program_short_name)
  
  filtered_indicators <- program_indicators %>% filter(indicator %in% names(input_funding_data)) %>% pull(indicator)
  program_trend_data <- tibble(
    indicator = filtered_indicators,
    program = program_short_name,
    data_level = data_level,
    p_value = NA,
    direction = NA,
  )
  # program_trend_data = tibble()
  
  funding_key <- sprintf("%s_per_1k", program_short_name)
  # loop through the related indicators
  for (row_index in seq_along(filtered_indicators)) {
    indicator <- filtered_indicators[row_index]
    funding_table <- input_funding_data %>%
      select(any_of(funding_key), any_of(indicator))
    funding_table <- funding_table %>%
      mutate(
        above_below_avg = case_when(
          funding_table[[indicator]] >= mean(funding_table[[indicator]], na.rm = T) ~ "above",
          .default = "below"
        )
      )
    above_avg <- funding_table %>% filter(above_below_avg == "above")
    below_avg <- funding_table %>% filter(above_below_avg == "below")
    t_test_result <- t.test(above_avg[[funding_key]], below_avg[[funding_key]], na.rm = T)
    mean_x <- t_test_result[5][[1]][1]
    mean_y <- t_test_result[5][[1]][2]
    p_val <- unname(t_test_result[3][[1]])
    funding_direction <- case_when(
      p_val > 0.05 ~ "similar",
      mean_x > mean_y ~ "higher",
      mean_x < mean_y ~ "lower",
      T ~ "similar"
    )
    # for now just making new data frames and binding them together
    # result <-
    #   tibble(
    #     program = program_short_name,
    #     indicator = indicator,
    #     direction = funding_direction,
    #     p_value = p_val,
    #     data_level = data_level,
    #   )
    # program_trend_data <- bind_rows(program_trend_data, result)
    program_trend_data$direction[row_index] <- funding_direction
    program_trend_data$p_value[row_index] <- p_val
  }
  program_trend_data
}

# run t test on state data
state_t_test_data <- purrr::map(
  program_information_table$short_name, 
  ~ get_funding_trend(.x, state_data_joined, "state"),
  .progress = "Calculating state program t test data") %>%
  list_rbind()

# run t test on all county data
county_t_test_data <- purrr::map(
  program_information_table$short_name, 
  ~ get_funding_trend(.x, county_data_joined, "county"),
  .progress = "Calculating county program t test data") %>%
  list_rbind()

# run t test on just urban county data
urban_county_t_test_data <- purrr::map(
  program_information_table$short_name, 
  ~ get_funding_trend(.x, county_data_joined %>% filter(urban == TRUE), "county_urban"),
  .progress = "Calculating county program t test data") %>%
  list_rbind()

all_t_test_data <- bind_rows(state_t_test_data, county_t_test_data, urban_county_t_test_data)
################################################################################
# Output tables to JSON or CSV format
################################################################################


county_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "counties.json"))

state_data_joined %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "states.json"))

program_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "programs.json"))

# simple list of programs
programs_with_categories %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "programs_simple.json"))

funding_medians_by_buckets %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "bucket_funding_medians.json"))

county_equity_scores %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "county_equity_scores.json"))

state_equity_scores %>%
  toJSON(dataframe = "columns", na = "null") %>%
  write_lines(here(output_folder, "state_equity_scores.json"))

search_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "search.json"))

equity_scores_county %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_equity_scores_county.json"))

equity_scores_state %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_equity_scores_state.json"))

program_quantile_funding_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_quantile_funding.json"))

all_t_test_data %>%
  toJSON(na = "null") %>%
  write_lines(here(output_folder, "program_t_test.json"))
