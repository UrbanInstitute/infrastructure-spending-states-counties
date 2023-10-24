#!/usr/bin/env node

/*******************************************************************************
 * Hat tip to Jeff MacInnes For this approach
 * https://github.com/UrbanInstitute/affordable-housing-shortage-and-zoning/blob/main/scripts/fetch-google.js
 ******************************************************************************/

import fs from "fs";
import archieml from "archieml";
import fetch from "node-fetch";
import path from "path"
import { fileURLToPath } from "url";
import { csvParse, autoType } from "d3-dsv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project_dir = path.resolve(__dirname, "../..");

const site_url_base = "/features/perc-data-tool";

const docs = [
	{
		id: "1SPzoriv36BjRH3Vaq0FgO5y5rDtjJLTfqpjAhV1crpQ",
		filepath: path.resolve(project_dir, "src/data", "site_content.json")
	},
	{
		id: "1XnqLteyGxukLINBw1Pdp9nkVqvcbUIB5AHww8dLDRWg",
    gid: "0",
		filepath: path.resolve(project_dir, "src/data", "program_language.json")
	},
];

function replace_links(raw_text) {
  return raw_text.replaceAll("[site-url]", site_url_base);
}

const fetch_google = async ({ id, gid }) => {
	console.log(`fetching...${id}`);

	const base = "https://docs.google.com";
	const post = gid
		? `spreadsheets/u/1/d/${id}/export?format=csv&id=${id}&gid=${gid}`
		: `document/d/${id}/export?format=txt`;
	const url = `${base}/${post}`;

	try {
		const response = await fetch(url);
		const text = await response.text();

		if (gid) {
			// parse sheet data as JSON
			let data = csvParse(text, autoType);
			return JSON.stringify(data, null, 2);
		}

		const parsed = archieml.load(text);
		const str = JSON.stringify(parsed);
		return str;
	} catch (err) {
		throw new Error(err);
	}
};

(async () => {
	for (let d of docs) {
		try {
			const str = await fetch_google(d);
			const file = `${d.filepath}`;
			fs.writeFileSync(file, str);
		} catch (err) {
			console.log(err);
		}
	}
})();

