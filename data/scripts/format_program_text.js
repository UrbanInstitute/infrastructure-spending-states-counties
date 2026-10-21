// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import path from "path";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project_dir = path.resolve(__dirname, "../..");

// The workbook is exported upstream and its cells can carry stray leading or
// trailing whitespace — including the short-name columns the site joins on — so
// trim every string cell here rather than editing the copy.
function read_sheet(sheet) {
  return XLSX.utils
    .sheet_to_json(sheet)
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key.trim(),
          typeof value === "string" ? value.trim() : value,
        ])
      )
    );
}

async function main() {
  const workbook_path = path.resolve(
    project_dir,
    "data/copy/program_metadata.xlsx"
  );
  const workbook = XLSX.readFile(workbook_path);

  // Program language
  const program_sheet = workbook.Sheets["programs"];
  const parsed_programs = read_sheet(program_sheet);
  const program_out = path.resolve(
    project_dir,
    "src/data/program_language.json"
  );
  await writeFile(program_out, JSON.stringify(parsed_programs));
  console.log(
    `Wrote ${parsed_programs.length} programs to src/data/program_language.json`
  );

  // Category language
  const category_sheet = workbook.Sheets["categories"];
  const parsed_categories = read_sheet(category_sheet);
  const category_out = path.resolve(
    project_dir,
    "src/data/category_language.json"
  );
  await writeFile(category_out, JSON.stringify(parsed_categories));
  console.log(
    `Wrote ${parsed_categories.length} categories to src/data/category_language.json`
  );
}

main();
