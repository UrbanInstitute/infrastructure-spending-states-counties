import path from "path";
import stripBom from "strip-bom";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "url";
import { csvParse } from "d3-dsv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project_dir = path.resolve(__dirname, "../..");

async function main() {
  const file = path.resolve(project_dir, "data/copy/program_info.csv");
  const raw_file = stripBom(await readFile(file, "utf-8"));
  const parsed = csvParse(raw_file);
  const out_file = path.resolve(project_dir, "src/data/program_language.json");
  await writeFile(out_file, JSON.stringify(parsed));
}

main();
