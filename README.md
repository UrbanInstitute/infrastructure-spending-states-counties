# Is Federal Infrastructure Spending Advancing Racial and Economic Equity?

This repository represents the code and data that powers the Urban Institute's [Spending on Infrastructure toward Equity (SITE) Tool](https://apps.urban.org/features/infrastructure-spending-states-counties/)

## Project details

Production URL: https://apps.urban.org/features/infrastructure-spending-states-counties/

Staging URL: https://apps-staging.urban.org/features/perc-data-tool/

Design: Brittney Spinner

Data Visualization and development: Mitchell Thorson

Writing: Wes Jenkins

## Project documentation

Working documents — the redesign plan, decision records, and design comps — live in
[`docs/`](docs/README.md). Start with [`docs/redesign-plan.md`](docs/redesign-plan.md)
for the current state of the 2026 redesign.

Dataset documentation from the research team is in
[`data/source-2026/PERC_data_readme.md`](data/source-2026/PERC_data_readme.md).

## Developing

To run this project locally, you'll need to have [Node.js](https://nodejs.org) version 20 or later installed.

To install required packages, run `npm install` from within the project directory.

To start a development server, run:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

This tool is built using [SvelteKit](https://kit.svelte.dev/), and uses Svelte's [adapter-static adapter](https://kit.svelte.dev/docs/adapter-static) to build a fully static version of the app that can be hosted on any static server.

## Building

To create a production version of your app:

```bash
npm run build
```

Note: You may run into a memory error when building the app due to the size of the input data. If this happens, you can increase the amount of memory available to Node during the build process by running the build command like so:

```bash
NODE_OPTIONS="--max-old-space-size=15360" npm run build
```

Use `npm run build` rather than calling `npx vite build` directly — the npm script runs
the `data:postprocess` step first, and skipping it builds the app against whatever was in
`src/data/server/` and `static/data/client/` from the last run. Add
`BASE_PATH="/features/perc-data-tool"` to the same command to reproduce a staging build
locally.

More info about this issue can be found [here](https://github.com/vitejs/vite/issues/2433).

You can preview the production build with `npm run preview`.

## Data processing

All source data for this tool is stored in the `data/source-2026` folder. (`data/source` holds the previous, 2024 source tables.)
Data transformations are done primarily with the R programming language in this project, so you'll need to have a working R environment in order to run the data processing scripts.

Also, make sure to install the required R packages for running the analysis and transformation scripts:

```R
install.packages("tidyverse")
install.packages("readxl")
install.packages("here")
install.packages("jsonlite")
install.packages("janitor")
```

The pipeline runs in two stages:

```bash
npm run data:preprocess   # R: data/scripts/preprocess_data.R
npm run data:postprocess  # Node: data/scripts/postprocess_data.js
```

1. **Preprocess** (`data/scripts/preprocess_data.R`) reads the source tables from `data/source-2026` and writes intermediate JSON to `data/output/preprocessed`.
2. **Postprocess** (`data/scripts/postprocess_data.js`) turns that intermediate JSON into the two sets of files the app actually consumes: build-time data in `src/data/server/` (imported directly, and deleted from `dist` after the build) and runtime data in `static/data/client/` (fetched by the browser on demand).

`npm run build` runs the postprocess step automatically, so you only need to run it by hand after re-running the R preprocess.

The `Makefile` covers the non-R steps — downloading geographic data from the Census Bureau and converting it to TopoJSON:

```bash
npm run data:geo   # equivalent to `make all`
```

To regenerate just the geographic files, run `make geo`. `make clean` removes them.

Four files come out of it. Three are fetched by the browser from `static/data/`: states,
CBSAs, and **all counties** (`cb_2023_us_county_500k_national.json`, for the national
county view on the home and category maps). The fourth, `src/data/cb_2023_us_county_500k.json`,
is imported at build time instead and sliced into one prerendered file per state by
`src/routes/api/county-geo/[fips].json/+server.js` — that is what the geography pages'
within-a-state county map loads. The two county files are the same counties at different
simplifications, and the Makefile explains why.

## Copy and other content

Text and other copy is stored in `src/data/site_content.aml` in [ArchieML](http://archieml.org/) format. This file is edited directly and committed to git; it is parsed at build time by `rollup-plugin-archieml` (configured in `vite.config.js`), so no separate generation step is needed.

Funding program and category information (names, descriptions, recipients, etc.) lives in `data/copy/program_metadata.xlsx`, a spreadsheet that is manually pulled from the shared source location. To convert it into the app's expected format, run:

```bash
npm run content
```

This reads the `programs` and `categories` sheets and writes `src/data/program_language.json` and `src/data/category_language.json` respectively. The script that manages this conversion is in `data/scripts/format_program_text.js`.

## Deploying to Urban's servers

Deployments are handled by [CircleCI](https://app.circleci.com/), which will automatically build and deploy your project to Urban's servers according to the following pattern:

| branch  | deployment target | url pattern                                           |
| ------- | ----------------- | ----------------------------------------------------- |
| main    | production        | https://apps.urban.org/features/$project-slug         |
| staging | staging           | https://apps-staging.urban.org/features/$project-slug |

CircleCI will also run a build for each commit you push to any branch. You can use these
checks to ensure that your changes don't break anything before you merge them into `dev` or
`main`.
