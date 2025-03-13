library(tidyverse)
library(here)
library(jsonlite)


proj_dir <- here()
source_dir <- here(proj_dir, "data/source/tables")

program_info <- read_csv(here(source_dir, "table6_programinformation.csv"))

program_language <- read_lines(here(proj_dir, "src/data/program_language.json")) %>% fromJSON()


missing_rows <- anti_join(program_info, program_language, by="program_short_name") %>%
  select(program_short_name, program_name)


new_program_language <- missing_rows %>%
  mutate(
    recipients = "TK",
    description = "TK",
    uses = "TK",
    website = "TK",
    website_text = ""
  )
