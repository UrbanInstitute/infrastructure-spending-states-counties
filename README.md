# Is Federal Infrastructure Spending Advancing Racial and Economic Equity?

This repository represents the code and data that powers the Urban Institute's [Spending on Infrastructure toward Equity (SITE) Tool](https://apps.urban.org/features/infrastructure-spending-states-counties/)

## Project details

Production URL: https://apps.urban.org/features/infrastructure-spending-states-counties/

Design: Brittney Spinner

Data Visualization and development: Mitchell Thorson

Writing: Wes Jenkins

## Developing

To run this project locally, you'll need to have [Node.js](https://nodejs.org) version 20 or later installed.

To install required packages, run `npm install` from within the project directory.

To start a development server, run:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

This tool is built using [SvelteKit](https://kit.svelte.dev/), and uses the Svelte's [adapter-static adapter](https://kit.svelte.dev/docs/adapter-static) to build a fully static version of the app that can be hosted on any static server.

## Building

To create a production version of your app:

```bash
npm run build
```

Note: You may run into a memory error when building the app due to the size of the input data. If this happens, you can increase the amount of memory available to Node during the build process by running the build command like so:

```bash
export NODE_OPTIONS="--max-old-space-size=15360" && BASE_PATH="/features/perc-data-tool" npx vite build
```

More info about this issue can be found [here](https://github.com/vitejs/vite/issues/2433).

You can preview the production build with `npm run preview`.

## Data processing

All source data for this tool is stored in the `data/source/tables` folder.
Data transformation are done primarily with the R programming language in this project, so you'll need to have a working R environment in order to run the data processing scripts.

Also, make sure to install the reqiured R packages for running the analysis and transformation scripts:

```R
install.packages("tidyverse")
install.packages("readxl")
install.packages("here")
install.packages("jsonlite")
install.packages("janitor")
```

The main data processing script is `data/scripts/process_data.R`. This script will read in the source data tables, perform some basic cleaning and transformation, and then write the processed data to the `src/data` folder.

The `Makefile` in this project describes the other non-R data processing steps, including downloading geographic data from the Census Bureau and converting it to TopoJSON format.

All of the data processing steps can be run at once by running `make all` or `npm run data` from within the project directory. 

To regenerate the geographic data files, run `make geo`.

To just re-convert the source data tables into the app's expected JSON format, run `make data`.

## Copy and other content

Text and other copy is stored in a Google document in [ArchieML](http://archieml.org/) format: https://docs.google.com/document/d/1SPzoriv36BjRH3Vaq0FgO5y5rDtjJLTfqpjAhV1crpQ/edit

Additional funding program information is stored in a google sheet here: https://docs.google.com/spreadsheets/d/1XnqLteyGxukLINBw1Pdp9nkVqvcbUIB5AHww8dLDRWg/edit#gid=0

Both of these documents can be downloaded and parsed by running:

```bash
npm run content
```

This will update the tools content to match the current version of the documents. The script that manages this conversion is in `data/scripts/fetch_copy.js`

