/**
 * Note: A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
 */

import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// absolute path to the directory containing this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// path to the root of the project
const projectDir = path.resolve(__dirname, "../..");

// path to the source data files
const dataSourceDir = path.join(projectDir, "data", "output", "preprocessed");

// path to the static output directory
const dataTargetStatic = path.join(projectDir, "static", "data", "server");
const dataTargetClient = path.join(projectDir, "static", "data", "client");

// path to the src output directory
const dataTargetDir = path.join(projectDir, "src", "data", "server");

// creates a directory recursively. An existing directory is fine; anything
// else (permissions, a file in the way, a bad path) is a real error and
// propagates so the run fails instead of silently writing nothing.
async function createDirectoryIfNotExists(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
}

// Wipes the three generated output trees before a run.
//
// Every file under them is written by this script, so anything left over is
// residue from an older run of it. That residue is invisible to git (all three
// are gitignored) and invisible to CI (which builds from a clean checkout), so
// it accumulates locally and gives a false picture of what the site ships —
// a working copy carrying 378 client files where a build produces 169.
async function cleanTargets() {
  for (const dir of [dataTargetStatic, dataTargetClient, dataTargetDir]) {
    await rm(dir, { recursive: true, force: true });
  }
}

// returns an absolute path to a file in the source dir
function getSourceFilePath(fileName) {
  return path.resolve(dataSourceDir, fileName);
}

// loads a file from the source dir
async function loadDataSource(fileName) {
  const filePath = getSourceFilePath(fileName);
  const fileContent = await readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
}

// saves data as JSON at fileName under targetDir (one of the three target
// dirs above), creating any missing parent directories
async function save(targetDir, fileName, data) {
  const filePath = path.resolve(targetDir, fileName);
  await createDirectoryIfNotExists(path.dirname(filePath));
  return await writeFile(filePath, JSON.stringify(data), "utf-8");
}

// copies a file from the source dir into targetDir, keeping its name unless
// targetFileName says otherwise
async function copy(
  targetDir,
  sourceFileName,
  targetFileName = sourceFileName
) {
  const targetFilePath = path.resolve(targetDir, targetFileName);
  await createDirectoryIfNotExists(path.dirname(targetFilePath));
  return await copyFile(getSourceFilePath(sourceFileName), targetFilePath);
}

// parses an equity directions data file, which is in columnar JSON format to save disk space
// keys are "category-indicator" → array of directions, plus a "fips" key
function parseEquityDirections(rawData) {
  const keys = Object.keys(rawData).filter((k) => k !== "fips");

  /**
   * @type {Object.<string, Object.<string, string>>}
   * object to hold equity directions, keyed by fips code
   */
  const lookup = {};

  // iterate over each fips code in the equity direction data
  for (let i = 0; i < rawData.fips.length; i++) {
    const fips = rawData.fips[i];
    const placeDirections = {};
    for (const key of keys) {
      placeDirections[key] = rawData[key][i];
    }
    lookup[fips] = placeDirections;
  }
  return lookup;
}

// parses a funding or indicator percentile rank array into a fips-keyed lookup
function parsePercentileRanks(rankArray) {
  /** @type {Object.<string, Object.<string, number>>} */
  const lookup = {};
  for (const row of rankArray) {
    const { fips, ...ranks } = row;
    lookup[fips] = ranks;
  }
  return lookup;
}

// function that loads and processes funding median data
async function processMedians(geo, medianData) {
  if (geo === "state") {
    // state medians: single object, copy as-is to target dir
    await save(
      dataTargetStatic,
      `${geo}/state_funding_medians.json`,
      medianData
    );
  } else {
    // loop through each bucket and save 1 file per bucket
    for (const bucket of medianData) {
      // name file after bucket and level
      const bucketName = `${bucket.bucket}-${bucket.level}`;
      // save bucket data to target dir
      await save(dataTargetStatic, `${geo}/${bucketName}.json`, bucket);
    }
  }
}

// function that processes all cbsa, county, or state data into page-level files
// §2.3: Geography pages are now category-keyed (not program-keyed)
async function processLocations(input, geo) {
  console.log(`✨ Beginning ${geo} data processing\n`);

  // load percentile ranks and equity directions for this geo level
  const fundingRanks = await loadDataSource(
    `${geo}_funding_percentile_ranks.json`
  );
  const indicatorRanks = await loadDataSource(
    `${geo}_indicator_percentile_ranks.json`
  );
  const equityDirections = await loadDataSource(
    `${geo}_equity_directions.json`
  );

  // parse into fips-keyed lookup tables
  const fundingRankLookup = parsePercentileRanks(fundingRanks);
  const indicatorRankLookup = parsePercentileRanks(indicatorRanks);
  const equityDirectionLookup = parseEquityDirections(equityDirections);

  // load medians for this geo level
  const medianData = await loadDataSource(`${geo}_funding_medians.json`);

  // load category slugs for extracting funding columns
  const categories = await loadDataSource("categories_simple.json");
  const categorySlugs = categories.map((c) => c.category);

  // build a set of keys to exclude from indicator values
  const skipKeys = new Set([
    "fips",
    "name",
    "state",
    "state_abb",
    "year",
    "id",
    "total_state_pop",
    "total_pop",
    ...categorySlugs,
    ...categorySlugs.map((s) => `${s}_per_1k`),
  ]);

  // for counties, stamp the state bucket onto the input row before anything
  // reads it. The per-place loop below copies it into indicator_values and
  // the bucket-map loop discovers it by scanning row keys for "bucket"; the
  // key it builds (`state_bucket-24`) matches the median file names written
  // by processMedians.
  if (geo === "county") {
    for (const place of input) {
      place.state_bucket = place.fips.slice(0, 2);
    }
  }

  // save 1 file for each place
  for (const place of input) {
    const fips = place.fips;

    // extract category funding (raw + per_1k)
    const categoryFunding = {};
    for (const slug of categorySlugs) {
      categoryFunding[slug] = place[slug] ?? null;
      categoryFunding[`${slug}_per_1k`] = place[`${slug}_per_1k`] ?? null;
    }

    // extract indicator values (everything not in skipKeys). For counties,
    // state_bucket goes first: the page loader lists comparison buckets in
    // key order and BarbellCompare defaults to the first, so this keeps
    // "other counties in the state" as the default comparison.
    /** @type {Record<string, any>} */
    const indicatorValues =
      geo === "county" ? { state_bucket: place.state_bucket } : {};
    for (const [key, value] of Object.entries(place)) {
      if (!skipKeys.has(key)) {
        indicatorValues[key] = value;
      }
    }

    const output = {
      fips,
      name: place.name,
      state: place.state || place.state_abb || undefined,
      year: place.year,
      category_funding: categoryFunding,
      funding_percentile_ranks: fundingRankLookup[fips] || {},
      indicator_values: indicatorValues,
      indicator_percentile_ranks: indicatorRankLookup[fips] || {},
      equity_directions: equityDirectionLookup[fips] || {},
    };

    // save file to target dir
    await save(dataTargetStatic, `${geo}/${fips}.json`, output);
  }

  // process the median data for this geo level (§2.4)
  await processMedians(geo, medianData);

  // generate simple list of fips codes
  const fipsList = input.map((d) => d.fips);
  // save fips list
  await save(dataTargetDir, `${geo}_fips_list.json`, fipsList);

  // for counties and cbsas, save a list of buckets
  if (["cbsa", "county"].includes(geo)) {
    const bucketMap = new Map();
    for (const place of input) {
      const bucket_names = Object.keys(place).filter((k) =>
        k.includes("bucket")
      );
      for (const bucket_name of bucket_names) {
        const bucket_level = place[bucket_name];
        const bucket_key = `${bucket_name}-${bucket_level}`;
        if (!bucketMap.has(bucket_key)) {
          bucketMap.set(bucket_key, []);
        }
        bucketMap.get(bucket_key).push(place.fips);
      }
    }
    await save(
      dataTargetDir,
      `${geo}_bucket_map.json`,
      Object.fromEntries(bucketMap)
    );
  }

  console.log(`✅  Finished ${geo} data processing\n`);
}

// §2.5: Simplified program page files (metadata only, no equity/quantile/t-test)
async function processPrograms() {
  console.log(`✨ Beginning program data processing\n`);

  // load primary program data
  const programInputData = await loadDataSource("programs.json");

  // load program-to-category mapping
  const programsSimple = await loadDataSource("programs_simple.json");

  // build a lookup from short_name → categories
  const categoryLookup = new Map();
  for (const p of programsSimple) {
    categoryLookup.set(p.short_name, p.categories || []);
  }

  // save simplified program page file for each program
  for (const program of programInputData) {
    const output = {
      program_name: program.program_name,
      program_short_name: program.program_short_name,
      agency_name: program.agency_name,
      competitive: program.competitive,
      formula: program.formula,
      total_funding: program.total_funding,
      fy_2022_funding: program.fy_2022_funding,
      fy_2023_funding: program.fy_2023_funding,
      fy_2024_funding: program.fy_2024_funding,
      fy_2025_funding: program.fy_2025_funding,
      iija_flag: program.iija_flag,
      ira_flag: program.ira_flag,
      categories: categoryLookup.get(program.program_short_name) || [],
    };

    // save main program info
    await save(
      dataTargetStatic,
      `program/${program.program_short_name}.json`,
      output
    );
  }

  await copy(dataTargetDir, "programs_simple.json");
  console.log(`✅  Finished program data processing\n`);
}

// §2.6: Per-program client-side funding maps (state + CBSA only)
//
// Written under `client/program/`. See §2.2 for why the two are namespaced.
async function processProgramFundingMaps() {
  console.log(`✨ Beginning per-program funding map generation\n`);

  // load per-program per-capita funding by geography
  const stateFunding = await loadDataSource(
    "state_program_funding_per_1k.json"
  );
  const cbsaFunding = await loadDataSource("cbsa_program_funding_per_1k.json");

  // load geo data for name lookups
  const stateInput = await loadDataSource("states.json");
  const cbsaInput = await loadDataSource("cbsas.json");

  const stateNameMap = new Map(stateInput.map((d) => [d.fips, d.name]));
  const cbsaNameMap = new Map(cbsaInput.map((d) => [d.fips, d.name]));

  // get program list from the columns of the funding data (everything except "fips")
  const programSlugs = Object.keys(stateFunding[0]).filter((k) => k !== "fips");

  // generate 1 state + 1 CBSA funding file per program
  for (const program of programSlugs) {
    // state funding map
    const stateRecords = stateFunding
      .map((row) => ({
        fips: row.fips,
        name: stateNameMap.get(row.fips) || "",
        funding_per_1k: row[program] ?? null,
      }))
      .filter((r) => r.funding_per_1k != null && r.funding_per_1k !== "NA");

    await save(
      dataTargetClient,
      `program/${program}_state_funding.json`,
      stateRecords
    );

    // CBSA funding map
    const cbsaRecords = cbsaFunding
      .map((row) => ({
        fips: row.fips,
        name: cbsaNameMap.get(row.fips) || "",
        funding_per_1k: row[program] ?? null,
      }))
      .filter((r) => r.funding_per_1k != null && r.funding_per_1k !== "NA");

    await save(
      dataTargetClient,
      `program/${program}_cbsa_funding.json`,
      cbsaRecords
    );
  }

  console.log(`✅  Finished per-program funding map generation\n`);
}

// §2.1: Category page files (NEW)
async function processCategories() {
  console.log(`✨ Beginning category data processing\n`);

  // load category metadata and supporting data
  const categories = await loadDataSource("categories.json");
  const categoriesSimple = await loadDataSource("categories_simple.json");
  const programsData = await loadDataSource("programs.json");
  const concentrationScores = {
    county: await loadDataSource("county_concentration_scores.json"),
    cbsa: await loadDataSource("cbsa_concentration_scores.json"),
    state: await loadDataSource("state_concentration_scores.json"),
  };
  const quantileFunding = await loadDataSource(
    "category_quantile_funding.json"
  );
  const disadvantagedPoverty = await loadDataSource(
    "disadvantaged_poverty_scores.json"
  );

  // generate 1 file per category
  for (const cat of categories) {
    const slug = cat.category;

    // find matching simple entry for programs/indicators
    const simple = categoriesSimple.find((c) => c.category === slug);

    // filter concentration scores for this category across all geo levels
    const catConcentration = [];
    for (const [level, scores] of Object.entries(concentrationScores)) {
      const filtered = scores.filter((s) => s.category === slug);
      catConcentration.push(
        ...filtered.map((s) => ({ ...s, data_level: level }))
      );
    }

    // filter quantile and t-test data for this category
    const catQuantile = quantileFunding.filter((d) => d.category === slug);
    const catDisadvantaged = disadvantagedPoverty.find(
      (d) => d.category === slug
    );

    // derive unique agency names from the category's programs
    const agencies = simple
      ? [
          ...new Set(
            simple.programs
              .map((short_name) => {
                const prog = programsData.find(
                  (p) => p.program_short_name === short_name
                );
                return prog ? prog.agency_name : null;
              })
              .filter(Boolean)
          ),
        ]
      : [];

    const output = {
      category: slug,
      category_name: cat.category_name,
      total_award_amount: cat.total_award_amount,
      per_year_funding: cat.per_year_funding,
      agencies,
      // enrich programs list with per-program funding totals
      programs: simple
        ? simple.programs.map((short_name) => {
            const prog = programsData.find(
              (p) => p.program_short_name === short_name
            );
            return {
              short_name,
              total_funding: prog ? prog.total_funding : null,
            };
          })
        : [],
      indicators: simple ? simple.indicators : [],
      concentration_scores: catConcentration,
      quantile_funding: catQuantile,
      disadvantaged_poverty: catDisadvantaged || null,
    };

    // save category page data
    await save(dataTargetStatic, `category/${slug}.json`, output);
  }

  console.log(`✅  Finished category data processing\n`);
}

// §2.2: Category client-side funding maps (NEW)
//
// Written under `client/category/`. Categories and programs share a namespace
// of short names and at least one name is in both: `ports` is an infrastructure
// category *and* a federal program. While both wrote to `client/<name>_...`,
// this pass and §2.6 collided on `ports_state_funding.json` and
// `ports_cbsa_funding.json`; §2.6 runs later, so the program's numbers won and
// every surface showing the Airports and Docks category at state or CBSA level
// silently dropped `airport_infrastructure` from the total. The county file was
// unaffected — §2.6 writes no county data — which is why the two levels
// disagreed. Separate directories make the collision impossible.
async function processCategoryFundingMaps(stateInput, cbsaInput, countyInput) {
  console.log(`✨ Beginning category funding map generation\n`);

  const categories = await loadDataSource("categories_simple.json");
  const geoData = { state: stateInput, cbsa: cbsaInput, county: countyInput };

  // generate {category}_{geo}_funding.json for each category × geography
  for (const cat of categories) {
    const slug = cat.category;
    for (const [geo, places] of Object.entries(geoData)) {
      const records = places.map((d) => ({
        fips: d.fips,
        name: d.name,
        funding: d[slug] ?? null,
        funding_per_1k: d[`${slug}_per_1k`] ?? null,
      }));
      await save(
        dataTargetClient,
        `category/${slug}_${geo}_funding.json`,
        records
      );
    }
  }

  console.log(`✅  Finished category funding map generation\n`);
}

// main function of the script
async function main() {
  console.log("ℹ  Beginning post processing of data...\n");

  await cleanTargets();

  console.log(`📍 The root folder is: ${projectDir}\n`);
  // load primary input data

  // load state, county, and cbsa data
  const stateInput = await loadDataSource("states.json");
  const countyInput = await loadDataSource("counties.json");
  const cbsaInput = await loadDataSource("cbsas.json");

  // §2.3 + §2.4: process geography page files (category-keyed)
  await processLocations(stateInput, "state");
  await processLocations(countyInput, "county");
  await processLocations(cbsaInput, "cbsa");

  // §2.1: process category page files
  await processCategories();

  // §2.2: process category client-side funding maps
  await processCategoryFundingMaps(stateInput, cbsaInput, countyInput);

  // §2.5: process simplified program page files
  await processPrograms();

  // §2.6: process per-program client-side funding maps (state + CBSA only)
  await processProgramFundingMaps();

  // §2.7: copy shared data files
  await copy(dataTargetDir, "search.json");
  await copy(dataTargetDir, "categories_simple.json");
  await copy(dataTargetDir, "old_to_new_program_map.json");

  console.log("✅  All post processing complete!\n");
}

// Kick off the main funciton
main();
