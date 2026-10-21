<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { csvParse } from "d3-dsv";
  import Select from "$components/Select.svelte";
  import { logClickToGA } from "$lib/analytics";
  import sources_csv from "$data/sources.csv?raw";

  /**
   * Card title, from `user_guide.table_title`. It follows the AML prose that
   * introduces this table — "the full list of characteristics and data sources
   * used in this tool" — rather than the comp's "Indicators and Data Sources",
   * which was the Datawrapper chart's own title. The default is a guard against
   * a missing key, not a second source of truth.
   * @type {string}
   */
  export let title = "Characteristics and Data Sources";

  /** @type {string} */
  export let filter_placeholder = "Select characteristic category";

  // The export carries a UTF-8 BOM, which would otherwise become part of the
  // first column's name and break every lookup against it.
  const parsed = csvParse(sources_csv.replace(/^﻿/, ""));

  /** Column names come from the file's header row, so the copy in the table
   *  head is the writing team's, not ours. Order is the file's order too. */
  const columns = parsed.columns;
  const [category_column] = columns;

  /**
   * `Characteristic category` is sparse-filled in the source — a blank cell
   * means "same as the row above", the spreadsheet idiom — so carry the last
   * value down. Every row needs its own value for the filter to work, and for
   * the column to still read correctly once rows are filtered out.
   * Cells are trimmed: six of them ship with trailing spaces.
   */
  /**
   * Cells are rendered with `{@html}`: the `Data source` column carries the
   * writing team's own `<a href … target="_blank">` markup, which resolves
   * which words each URL belongs to — several sources name two (EJScreen and
   * the partners preserving it; Transit Explorer and Chicago Cityscape) and a
   * separate URL column could not say where the link stops. Same trust the
   * AML prose already gets. No other column carries markup today.
   */
  const rows = parsed.map((row) => {
    /** @type {Record<string, string>} */
    const cells = {};
    for (const column of columns) cells[column] = (row[column] ?? "").trim();
    return cells;
  });
  let last_category = "";
  for (const row of rows) {
    if (row[category_column]) last_category = row[category_column];
    else row[category_column] = last_category;
  }

  const category_options = [
    ...new Set(rows.map((r) => r[category_column])),
  ].map((category) => ({ value: category, label: category }));

  /** @type {string | undefined} */
  let selected_category = undefined;

  $: visible_rows = selected_category
    ? rows.filter((row) => row[category_column] === selected_category)
    : rows;
</script>

<div class="sources-table">
  <h3 class="sources-table--title">{title}</h3>
  <div class="sources-table--filter">
    <Select
      items={category_options}
      bind:value={selected_category}
      placeholder={filter_placeholder}
      searchable={false}
      clearable
      on:change={(e) => {
        logClickToGA(
          e.target,
          "characteristic-category-select--" + e.detail.detail.value
        );
      }}
    />
  </div>
  <!-- Height-capped and scrolled rather than paged, matching the comp and the
       tables on the geography and program pages. -->
  <div class="sources-table--wrapper">
    <table>
      <thead>
        <tr>
          {#each columns as column (column)}
            <th scope="col">{column}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each visible_rows as row (row[columns[1]])}
          <tr>
            {#each columns as column (column)}
              <td>{@html row[column]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .sources-table {
    padding-block: var(--spacing-8);
  }
  .sources-table--title {
    /* The global h3 is uppercase and light; the comp draws this card title
       bold and in sentence case, a step below the section h2s. */
    text-transform: none;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-snug);
    text-align: center;
    margin-block-end: var(--spacing-6);
  }
  .sources-table--filter {
    display: flex;
    justify-content: center;
    margin-block-end: var(--spacing-12);
  }
  .sources-table--filter :global(.select) {
    /* The comp draws the control at 365px; Select's own cap is 450px. */
    max-width: 365px;
  }
  .sources-table--wrapper {
    --scrollbar-foreground: var(--color-gray-shade-dark);
    --scrollbar-background: var(--color-gray-shade-light);
    max-height: clamp(500px, 60vw, 1000px);
    overflow: auto;
    scrollbar-color: var(--scrollbar-foreground) var(--scrollbar-background);
  }
  .sources-table--wrapper::-webkit-scrollbar-thumb {
    background: var(--scrollbar-foreground);
  }
  .sources-table--wrapper::-webkit-scrollbar-track {
    background: var(--scrollbar-background);
  }
  table {
    border-collapse: collapse;
    width: 100%;
    /* Four prose columns need a floor before the wrapper starts scrolling,
       or the definitions wrap to one word per line on a phone. */
    min-width: 640px;
  }
  thead tr {
    position: sticky;
    top: 0;
    background: var(--color-gray-shade-lighter);
  }
  thead th {
    text-align: left;
    vertical-align: bottom;
    padding: var(--spacing-3) var(--spacing-4);
    font-family: var(--font-family-sans-alt);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-normal);
    color: var(--color-gray-shade-darkest);
  }
  /* Column widths measured off the comp: 20 / 25 / 27 / 28. Fixed rather than
     content-derived so the columns hold still as the filter changes. */
  thead th:nth-child(1) {
    width: 20%;
  }
  thead th:nth-child(2) {
    width: 25%;
  }
  thead th:nth-child(3) {
    width: 27%;
  }
  thead th:nth-child(4) {
    width: 28%;
  }
  tbody td {
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-small);
    line-height: var(--line-height-normal);
    vertical-align: top;
    /* The comp separates rows with a hairline and no fill — no zebra. */
    border-block-start: solid 1px var(--color-gray-shade-lighter);
  }
  @media (min-width: 769px) {
    .sources-table {
      padding-inline: var(--spacing-6);
    }
  }
</style>
