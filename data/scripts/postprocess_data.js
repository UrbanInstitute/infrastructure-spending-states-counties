import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
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

// creates a directory recursively
async function createDirectoryIfNotExists(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch {
    return;
  }
}

// returns an absolute path to a file in the target dir
function getTargetFilePath(fileName, targetDir) {
  return path.resolve(targetDir, fileName);
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

// saves a file to the source target dir
async function saveDataSource(fileName, data) {
  const filePath = getTargetFilePath(fileName, dataTargetDir);
  // console.log(`Saving data: ${fileName}`);
  await createDirectoryIfNotExists(path.dirname(filePath));
  return await writeFile(filePath, JSON.stringify(data), "utf-8");
}

// saves a file to the static target dir
async function saveDataStatic(fileName, data) {
  const filePath = getTargetFilePath(fileName, dataTargetStatic);
  // console.log(`Saving data: ${fileName}`);
  await createDirectoryIfNotExists(path.dirname(filePath));
  return await writeFile(filePath, JSON.stringify(data), "utf-8");
}
async function saveDataClient(fileName, data) {
  const filePath = getTargetFilePath(fileName, dataTargetClient);
  // console.log(`Saving data: ${fileName}`);
  await createDirectoryIfNotExists(path.dirname(filePath));
  return await writeFile(filePath, JSON.stringify(data), "utf-8");
}

// copies a source file from the source dir to the target dir
async function copyDataSource(sourceFileName, targetFileName = undefined) {
  if (!targetFileName) {
    targetFileName = sourceFileName;
  }
  const targetFilePath = getTargetFilePath(targetFileName, dataTargetDir);
  await createDirectoryIfNotExists(path.dirname(targetFilePath));
  return await copyFile(getSourceFilePath(sourceFileName), targetFilePath);
}
// copies a source file from the source dir to the static target dir
async function copyDataStatic(sourceFileName, targetFileName = undefined) {
  if (!targetFileName) {
    targetFileName = sourceFileName;
  }
  const targetFilePath = getTargetFilePath(targetFileName, dataTargetStatic);
  await createDirectoryIfNotExists(path.dirname(targetFilePath));
  return await copyFile(getSourceFilePath(sourceFileName), targetFilePath);
}

// parses an equity score data file, which is in columnar JSON format to save disk space
function parseEquityScores(rawEquityScoreData) {
  // parse column-oriented JSON data into row-oriented data
  const equityScores = [];
  //
  // get all columns except the fips column
  const cols = Object.keys(rawEquityScoreData).filter((col) => col !== "fips");

  /**
   * @type {Object.<"fips", Object.<string, number>>}
   * object to hold equity scores, keyed by fips code
   */
  const equityScoreLookup = {};

  // iterate over each fips code in the equity score data
  for (const placeIdx in rawEquityScoreData.fips) {
    // grab the fips code
    const placeFips = rawEquityScoreData.fips[placeIdx];

    // create an object to hold the equity scores for this place
    const placeResult = {};
    for (const col of cols) {
      placeResult[col] = rawEquityScoreData[col][placeIdx];
    }
    equityScoreLookup[placeFips] = placeResult;
  }
  return equityScoreLookup;
}

// function that loads and processes funding median data
async function processMedians(geo) {
  const sourceFundingMedians = {
    county: "county_bucket_funding_medians.json",
    cbsa: "cbsa_bucket_funding_medians.json",
    state: "state_funding_medians.json",
  };
  // copy funding medians as-is
  const medianFileName = sourceFundingMedians[geo];

  const medianBucketData = await loadDataSource(medianFileName);
  if (geo === "state") {
    // copy median data as is to target dir
    await copyDataStatic(medianFileName, `${geo}/${medianFileName}`);
  } else {
    // loop through each bucket and save 1 file per bucket
    for (const bucket of medianBucketData) {
      // name file after bucket and level
      const bucketName = `${bucket.bucket}-${bucket.level}`;
      // save bucket data to target dir
      await saveDataStatic(`${geo}/${bucketName}.json`, bucket);
    }
  }
}

// function that processes all cbsa, county, or state data into page-level files
async function processLocations(input, geo) {
  console.log(`✨ Beginning ${geo} data processing\n`);

  const sourceEquityScores = {
    county: "county_equity_scores.json",
    state: "state_equity_scores.json",
    cbsa: "cbsa_equity_scores.json",
  };

  // load equity scores data
  const equityScores = await loadDataSource(sourceEquityScores[geo]);

  // parse equite scores data into lookup table
  const equityScoreLookup = parseEquityScores(equityScores);

  // save 1 file for each cbsa
  for (const place of input) {
    // include equity scores
    place.equity_scores = equityScoreLookup[place.fips];
    // for counties, add a state_bucket field
    if (geo === "county") {
      place.state_bucket = place.fips.slice(0, 2);
    }
    // save file to target dir
    await saveDataStatic(`${geo}/${place.fips}.json`, place);
  }

  // process the median data for this geo level
  await processMedians(geo);

  // a function to create funding per capita data
  function getFundingData(places) {
    const fundingKeys = Object.keys(places[0]).filter((key) =>
      key.includes("_per_1k")
    );
    return places.map((d) => {
      const result = {
        fips: d.fips,
        state: d.state,
      };
      for (const key of fundingKeys) {
        result[key] = d[key];
      }
      return result;
    });
  }

  // create funding per capita data
  const fundingPerCapitaData = getFundingData(input);

  // save funding per capita data
  await saveDataStatic(
    `${geo}/${geo}_funding_per_capita.json`,
    fundingPerCapitaData
  );

  // generate simple list of fips codes
  const fipsList = input.map((d) => d.fips);
  // save fips list
  await saveDataSource(`${geo}_fips_list.json`, fipsList);

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
    saveDataSource(`${geo}_bucket_map.json`, Object.fromEntries(bucketMap));
  }

  console.log(`✅  Finished ${geo} data processing\n`);
}

// a function that processes all program data into page-level files,
// including funding data at each geographic level
async function processPrograms(stateInput, cbsaInput, countyInput) {
  console.log(`✨ Beginning program data processing\n`);

  // load primary program data
  const programInputData = await loadDataSource("programs.json");

  // load equity scores for each geo level
  // state
  const stateEquityScores = await loadDataSource(
    "program_equity_scores_state.json"
  );
  // county
  const countyEquityScores = await loadDataSource(
    "program_equity_scores_county.json"
  );
  // cbsa
  const cbsaEquityScores = await loadDataSource(
    "program_equity_scores_cbsa.json"
  );

  function createEquityScoreMap(programScores, level) {
    return programScores.map((scores) => {
      const scoreKeys = Object.keys(scores).filter((key) => key !== "program");
      return [
        scores.program,
        scoreKeys
          .map((scoreKey) => ({
            score: scores[scoreKey],
            indicator: scoreKey.endsWith("_concentration")
              ? scoreKey.replace("_concentration", "")
              : scoreKey.includes("variability")
              ? "variability"
              : scoreKey,
            level,
            metric: scoreKey.endsWith("_concentration")
              ? "concentration"
              : "distribution",
            subset: "all",
          }))
          .reduce((all, next) => all.concat(next), []),
      ];
    });
  }
  const stateEquityScoresList = createEquityScoreMap(
    stateEquityScores,
    "state"
  );
  const countyEquityScoresList = createEquityScoreMap(
    countyEquityScores,
    "county"
  );
  const cbsaEquityScoresList = createEquityScoreMap(cbsaEquityScores, "cbsa");

  // create map from state scores initially
  const allEquityScoreMap = new Map(stateEquityScoresList);

  // loop through county scores and add them to existing map
  for (const program of countyEquityScoresList) {
    if (allEquityScoreMap.has(program[0])) {
      allEquityScoreMap.set(
        program[0],
        allEquityScoreMap.get(program[0]).concat(program[1])
      );
    } else {
      allEquityScoreMap.set(program[0], program[1]);
    }
  }
  // loop through cbsa scores and add them to existing map
  for (const program of cbsaEquityScoresList) {
    if (allEquityScoreMap.has(program[0])) {
      allEquityScoreMap.set(
        program[0],
        allEquityScoreMap.get(program[0]).concat(program[1])
      );
    } else {
      allEquityScoreMap.set(program[0], program[1]);
    }
  }

  // load quantile funding
  const quantileFunding = await loadDataSource("program_quantile_funding.json");

  // load program t test data
  const programTTest = await loadDataSource("program_t_test.json");

  // function to get funding data for an individual program for each place in a geographic level
  function getPlaceFunding(program, placeData) {
    return placeData.map((d) => ({
      fips: d.fips,
      name: d.name,
      funding: d[program],
      funding_per_1k: d[`${program}_per_1k`],
    }));
  }

  // get funding data for each program and save that program's data to a file
  for (const program of programInputData) {
    const state_funding = getPlaceFunding(program.short_name, stateInput);
    const cbsa_funding = getPlaceFunding(program.short_name, cbsaInput);
    const county_funding = getPlaceFunding(program.short_name, countyInput);
    // add equity scores array to program data
    program.equity_scores = allEquityScoreMap.get(program.short_name);

    // add quantile data to program data file
    program.quantile_funding = quantileFunding.filter(
      (d) => d.program === program.short_name
    );
    // add t test data to program data file
    program.t_test_data = programTTest.filter(
      (d) => d.program === program.short_name
    );
    // save main program info
    await saveDataStatic(`program/${program.short_name}.json`, program);
    // save state funding data
    await saveDataClient(
      `${program.short_name}_state_funding.json`,
      state_funding
    );
    // save county funding data
    await saveDataClient(
      `${program.short_name}_county_funding.json`,
      county_funding
    );
    // save cbsa funding data
    await saveDataClient(
      `${program.short_name}_cbsa_funding.json`,
      cbsa_funding
    );
  }

  await copyDataSource("programs_simple.json", "programs_simple.json");
  console.log(`✅  Finished program data processing\n`);
}

// main function of the script
async function main() {
  console.log("ℹ  Beginning post processing of data...\n");

  console.log(`📍 The root folder is: ${projectDir}\n`);
  // load primary input data

  // load state, county, and cbsa data
  const stateInput = await loadDataSource("states.json");
  const countyInput = await loadDataSource("counties.json");
  const cbsaInput = await loadDataSource("cbsas.json");

  // // process states data
  processLocations(stateInput, "state");

  // // process county data
  processLocations(countyInput, "county");

  // // process cbsa data
  processLocations(cbsaInput, "cbsa");

  // process program data
  processPrograms(stateInput, cbsaInput, countyInput);
  await copyDataSource("search.json", "search.json");
}

// Kick off the main funciton
main();
