// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
//
// Sanity checks on the generated data trees. Run after `npm run data:postprocess`
// (`npm test` does both). Every check is drawn from the pre-launch review's
// "Checked and fine" list, so a data refresh that breaks one of the site's
// assumptions fails CI instead of shipping. Exits 1 if any check fails.

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "../..");

// the three trees postprocess_data.js writes
const serverDir = path.join(projectDir, "static", "data", "server");
const clientDir = path.join(projectDir, "static", "data", "client");
const srcDataDir = path.join(projectDir, "src", "data", "server");

// Expected sizes of the current data release. Update these deliberately when
// a new release lands; an unexplained change in any of them is a failed check.
const EXPECTED = {
  programs: 71,
  categories: 9,
  state: 52,
  county: 3222,
  cbsa: 939,
};

const GEOS = /** @type {const} */ (["state", "county", "cbsa"]);

// tokens that mean a value came through R or JSON.stringify unconverted
const BAD_TOKENS = /\bNaN\b|\bundefined\b|"NA"/;

// how many problems to print per failing check before summarising the rest
const MAX_LISTED = 20;

/** @type {{ name: string, problems: string[] }[]} */
const sections = [];

/**
 * Runs one named check. `fn` receives a `fail(message)` callback; the check
 * passes when it never calls it.
 * @param {string} name
 * @param {(fail: (message: string) => void) => Promise<void> | void} fn
 */
async function section(name, fn) {
  /** @type {string[]} */
  const problems = [];
  try {
    await fn((message) => problems.push(message));
  } catch (err) {
    problems.push(`threw: ${err instanceof Error ? err.message : err}`);
  }
  sections.push({ name, problems });
  const status =
    problems.length === 0 ? "ok" : `FAIL (${problems.length} problems)`;
  console.log(`${problems.length === 0 ? "✅" : "❌"} ${name}: ${status}`);
}

/** @param {string} filePath */
async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf-8"));
}

async function main() {
  console.log("ℹ  Verifying generated data...\n");

  // shared inputs; if any of these is missing, postprocess did not run
  const programsSimple = await readJson(
    path.join(srcDataDir, "programs_simple.json")
  );
  const categoriesSimple = await readJson(
    path.join(srcDataDir, "categories_simple.json")
  );
  /** @type {Record<string, string[]>} */
  const fipsLists = {};
  for (const geo of GEOS) {
    fipsLists[geo] = await readJson(
      path.join(srcDataDir, `${geo}_fips_list.json`)
    );
  }
  /** @type {Record<string, Record<string, string[]>>} */
  const bucketMaps = {
    county: await readJson(path.join(srcDataDir, "county_bucket_map.json")),
    cbsa: await readJson(path.join(srcDataDir, "cbsa_bucket_map.json")),
  };

  await section("Counts match the current data release", (fail) => {
    /** @type {Record<string, number>} */
    const counts = {
      programs: programsSimple.length,
      categories: categoriesSimple.length,
      state: fipsLists.state.length,
      county: fipsLists.county.length,
      cbsa: fipsLists.cbsa.length,
    };
    for (const [key, expected] of Object.entries(EXPECTED)) {
      if (counts[key] !== expected) {
        fail(`${key}: expected ${expected}, found ${counts[key]}`);
      }
    }
  });

  await section(
    "Every program has its server and client files",
    async (fail) => {
      for (const { short_name } of programsSimple) {
        for (const file of [
          path.join(serverDir, "program", `${short_name}.json`),
          path.join(clientDir, "program", `${short_name}_state_funding.json`),
          path.join(clientDir, "program", `${short_name}_cbsa_funding.json`),
        ]) {
          if (!existsSync(file)) {
            fail(`${short_name}: missing ${path.relative(projectDir, file)}`);
          }
        }
      }
      // and no strays: a stale or colliding file would ship a page nothing links to
      const serverFiles = await readdir(path.join(serverDir, "program"));
      if (serverFiles.length !== programsSimple.length) {
        fail(
          `server/program has ${serverFiles.length} files for ${programsSimple.length} programs`
        );
      }
    }
  );

  await section(
    "Every category has its server and client files",
    async (fail) => {
      for (const { category } of categoriesSimple) {
        for (const file of [
          path.join(serverDir, "category", `${category}.json`),
          ...GEOS.map((geo) =>
            path.join(clientDir, "category", `${category}_${geo}_funding.json`)
          ),
        ]) {
          if (!existsSync(file)) {
            fail(`${category}: missing ${path.relative(projectDir, file)}`);
          }
        }
      }
      const serverFiles = await readdir(path.join(serverDir, "category"));
      if (serverFiles.length !== categoriesSimple.length) {
        fail(
          `server/category has ${serverFiles.length} files for ${categoriesSimple.length} categories`
        );
      }
    }
  );

  await section("Every FIPS in the three lists has a server file", (fail) => {
    for (const geo of GEOS) {
      for (const fips of fipsLists[geo]) {
        if (!existsSync(path.join(serverDir, geo, `${fips}.json`))) {
          fail(`${geo}/${fips}.json is missing`);
        }
      }
    }
  });

  // One read per file under server/{state,county,cbsa}: the raw text is
  // scanned for bad tokens (place and median files alike), and place files
  // are parsed once here for the bucket checks below.
  /** @type {Record<string, Record<string, any>>} */
  const places = { state: {}, county: {}, cbsa: {} };
  await section(
    'No NaN, undefined or "NA" in any place or median file',
    async (fail) => {
      for (const geo of GEOS) {
        const fipsSet = new Set(fipsLists[geo]);
        const dir = path.join(serverDir, geo);
        for (const file of await readdir(dir)) {
          const text = await readFile(path.join(dir, file), "utf-8");
          const match = text.match(BAD_TOKENS);
          if (match) {
            fail(`${geo}/${file} contains ${match[0]}`);
          }
          const fips = file.replace(/\.json$/, "");
          if (fipsSet.has(fips)) {
            places[geo][fips] = JSON.parse(text);
          }
        }
      }
    }
  );

  await section(
    "Every county lists state_bucket first in indicator_values",
    (fail) => {
      for (const [fips, place] of Object.entries(places.county)) {
        const values = place.indicator_values ?? {};
        const firstKey = Object.keys(values)[0];
        if (firstKey !== "state_bucket") {
          fail(`county/${fips}: first indicator key is ${firstKey}`);
        } else if (values.state_bucket !== fips.slice(0, 2)) {
          fail(`county/${fips}: state_bucket is ${values.state_bucket}`);
        }
      }
    }
  );

  await section(
    "Every non-null bucket has a median file and a bucket-map entry",
    (fail) => {
      for (const geo of /** @type {const} */ (["county", "cbsa"])) {
        for (const [fips, place] of Object.entries(places[geo])) {
          const values = place.indicator_values ?? {};
          for (const key of Object.keys(values)) {
            if (!key.endsWith("_bucket") || values[key] == null) continue;
            const bucketKey = `${key}-${values[key]}`;
            if (!existsSync(path.join(serverDir, geo, `${bucketKey}.json`))) {
              fail(`${geo}/${fips}: no median file for ${bucketKey}`);
            }
            const members = bucketMaps[geo][bucketKey];
            if (!Array.isArray(members) || !members.includes(fips)) {
              fail(`${geo}/${fips}: not in ${geo}_bucket_map[${bucketKey}]`);
            }
          }
        }
      }
    }
  );

  await section("state_funding_medians.json is a flat object", async (fail) => {
    const medians = await readJson(
      path.join(serverDir, "state", "state_funding_medians.json")
    );
    if (
      medians === null ||
      typeof medians !== "object" ||
      Array.isArray(medians)
    ) {
      fail(
        `top level is ${Array.isArray(medians) ? "an array" : typeof medians}`
      );
      return;
    }
    for (const [key, value] of Object.entries(medians)) {
      if (value !== null && typeof value === "object") {
        fail(`${key} is nested (${Array.isArray(value) ? "array" : "object"})`);
      }
    }
  });

  await section(
    "Every client funding file has unique, non-null fips",
    async (fail) => {
      for (const sub of ["program", "category"]) {
        const dir = path.join(clientDir, sub);
        for (const file of await readdir(dir)) {
          const records = await readJson(path.join(dir, file));
          if (!Array.isArray(records)) {
            fail(`client/${sub}/${file} is not an array`);
            continue;
          }
          const seen = new Set();
          for (const record of records) {
            const fips = record?.fips;
            if (fips == null || fips === "") {
              fail(`client/${sub}/${file}: record with no fips`);
            } else if (seen.has(fips)) {
              fail(`client/${sub}/${file}: duplicate fips ${fips}`);
            }
            seen.add(fips);
          }
        }
      }
    }
  );

  await section("No hyphen in any program or category slug", (fail) => {
    for (const { short_name } of programsSimple) {
      if (short_name.includes("-")) fail(`program ${short_name}`);
    }
    for (const { category } of categoriesSimple) {
      if (category.includes("-")) fail(`category ${category}`);
    }
  });

  // summary
  const failed = sections.filter((s) => s.problems.length > 0);
  console.log("");
  for (const { name, problems } of failed) {
    console.log(`❌ ${name}`);
    for (const problem of problems.slice(0, MAX_LISTED)) {
      console.log(`   - ${problem}`);
    }
    if (problems.length > MAX_LISTED) {
      console.log(`   ... and ${problems.length - MAX_LISTED} more`);
    }
  }
  if (failed.length > 0) {
    const total = failed.reduce((n, s) => n + s.problems.length, 0);
    console.log(
      `\n❌ ${failed.length} of ${sections.length} checks failed (${total} problems)\n`
    );
    process.exitCode = 1;
  } else {
    console.log(`✅ All ${sections.length} checks passed\n`);
  }
}

main().catch((err) => {
  console.error(`❌ Verification could not run: ${err.message}\n`);
  process.exitCode = 1;
});
