<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @component
  The geography-page equity section: for one selected category, one table of
  that category's indicators showing the place's percentile for each community
  characteristic alongside its funding percentile, ordered by the gap between
  the two (funding furthest above need first).

  Replaces the program-era equity *score* (funding percentile minus need
  percentile). The research team asked for the two underlying percentiles to be
  displayed instead, so a reader can compare them directly:
  "This county is receiving more funding than XX percent of counties, but it's
  only above YY percent of counties in terms of Z indicator."

  The funding percentile is constant within a category — that repetition is
  intended. It is the reference the need percentile is read against.
 -->
<script>
  import Card from "$components/Card.svelte";
  import LinkTable from "$components/LinkTable.svelte";
  import Select from "$components/Select.svelte";
  import {
    get_equity_directions_by_category,
    get_indicator_label,
    format_text_template,
    geo_labels,
  } from "$lib/utils.js";
  import { category_display_name } from "$stores/categories.js";
  import { logClickToGA } from "$lib/analytics";
  import site_content from "$data/site_content.aml";

  /**
   * Per-category funding percentile ranks for this place, 0–1.
   * @type {Record<string, number>}
   **/
  export let funding_percentile_ranks = {};

  /**
   * Per-indicator percentile ranks for this place, 0–1.
   * @type {Record<string, number>}
   **/
  export let indicator_percentile_ranks = {};

  /**
   * Equity directions keyed "category-indicator", values "higher" | "lower".
   * @type {Record<string, string>}
   **/
  export let equity_directions = {};

  /**
   * Category options to offer, in display order. Pass only categories the place
   * actually received funding for — see the note in the page component.
   * @type {{value: string, label: string}[]}
   **/
  export let category_options = [];

  /** @type {"county" | "cbsa" | "state"} */
  export let geo_type = "county";

  /**
   * Currently selected category. Bound to the page-level selection, which the
   * funding map shares.
   * @type {string}
   **/
  export let selected_category = "";

  const content = site_content.geography_pages.equity_scores;

  $: geo_type_text = geo_labels(geo_type).singular;
  $: geo_type_plural = geo_labels(geo_type).plural;

  // Fall back to the first available category so the section is never empty
  // when the place has funding.
  $: if (
    category_options.length > 0 &&
    !category_options.some((o) => o.value === selected_category)
  ) {
    selected_category = category_options[0].value;
  }

  $: funding_percentile = selected_category
    ? funding_percentile_ranks[selected_category] ?? null
    : null;

  /**
   * @param {number} val 0–1 percentile
   * @returns {string}
   */
  function format_percentile(val) {
    return `${Math.round(val * 100)}%`;
  }

  // One row per indicator in the selected category, whichever direction it
  // runs. Keys are built in column order (characteristic, need, funding),
  // since `LinkTable` takes its columns from the first row's key order.
  $: rows = selected_category
    ? get_equity_directions_by_category(selected_category, equity_directions)
        .map(({ indicator }) => ({
          characteristic: get_indicator_label(indicator),
          need_percentile: indicator_percentile_ranks[indicator],
          funding_percentile: funding_percentile,
        }))
        .filter(
          (r) =>
            r.characteristic !== "" && typeof r.need_percentile === "number"
        )
    : [];

  // Default order: the widest gap of funding above need first.
  /** @param {Record<string, any>} row */
  const funding_need_gap = (row) =>
    row.funding_percentile - row.need_percentile;

  $: summary_text =
    selected_category && funding_percentile != null
      ? format_text_template(content.summary_text, {
          geo_type: geo_type_text,
          geo_type_plural: geo_type_plural,
          category: category_display_name(selected_category).toLowerCase(),
          value: String(Math.round(funding_percentile * 100)),
        })
      : "";

  const column_headers = {
    characteristic: "Characteristic",
    need_percentile: "Characteristic percentile",
    funding_percentile: "Funding percentile",
  };

  const format_funs = {
    funding_percentile: format_percentile,
    need_percentile: format_percentile,
  };

  // Hover sentences for each row's percentiles. [value] rounds the same way
  // as `format_percentile`, so the sentence matches the cell.
  $: cell_tooltips = {
    /** @param {Record<string, any>} row */
    need_percentile: (row) =>
      format_text_template(content.tooltip, {
        geo_type: geo_type_text,
        geo_type_plural: geo_type_plural,
        indicator: row.characteristic.toLowerCase(),
        value: String(Math.round(row.need_percentile * 100)),
      }),
    /** @param {Record<string, any>} row */
    funding_percentile: (row) =>
      format_text_template(content.funding_tooltip, {
        geo_type: geo_type_text,
        geo_type_plural: geo_type_plural,
        category: category_display_name(selected_category).toLowerCase(),
        value: String(Math.round(row.funding_percentile * 100)),
      }),
  };
</script>

<div class="equity-section">
  {#if category_options.length === 0}
    <Card>
      <p class="equity-empty-state">
        This {geo_type_text} did not receive funding from any of the infrastructure
        categories we track, so there is no funding distribution to compare against
        community characteristics.
      </p>
    </Card>
  {:else}
    <div class="equity-controls">
      <Select
        bind:value={selected_category}
        items={category_options}
        placeholder={"Select a category"}
        on:change={(e) => {
          logClickToGA(
            e.target,
            "category-select-equity--" + e.detail.detail.value
          );
        }}
      />
    </div>

    {#if summary_text}
      <p class="equity-summary">{@html summary_text}</p>
    {/if}

    <Card>
      <div class="equity-card">
        <p class="equity-card--title">{content.box_title}</p>
        {#if rows.length > 0}
          <LinkTable
            data={rows}
            sort_column="funding_percentile"
            sort_value={funding_need_gap}
            {format_funs}
            {column_headers}
            {cell_tooltips}
            wide_second_column={false}
          />
        {:else}
          <p class="equity-card--none">No characteristics in this category.</p>
        {/if}
      </div>
    </Card>
  {/if}
</div>

<style>
  .equity-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  .equity-controls {
    max-width: 411px;
    margin-inline: auto;
    width: 100%;
  }
  .equity-summary {
    text-align: center;
    max-width: var(--body-width);
    margin-inline: auto;
    margin-block: var(--spacing-2);
  }
  /* Card title and empty note match the two-card layout this replaced. */
  .equity-card {
    padding: var(--spacing-2);
  }
  .equity-card--title {
    font-size: 16px;
    font-weight: var(--font-weight-bold);
    margin-block-end: var(--spacing-3);
    text-align: center;
  }
  .equity-card--none {
    font-size: var(--font-size-small);
    color: var(--color-gray-shade-dark);
    font-style: italic;
    text-align: center;
    margin-block: var(--spacing-4);
  }
  .equity-empty-state {
    padding: var(--spacing-6);
    text-align: center;
    color: var(--color-gray-shade-dark);
    margin: 0;
  }
  .equity-section :global(table.data-table tbody td:first-child) {
    font-weight: var(--font-weight-normal);
  }
  @media (max-width: 768px) {
    /* The shared table keeps 18px headers and 1rem of side padding at every
       width. Three columns of that need ~353px; the card offers ~294px at
       390px, so the table scrolled sideways even though its content fits.
       Dropping the header to the body's own size and tightening the gutters
       brings the min-content width to ~261px, inside the card. */
    .equity-section :global(table.data-table thead th) {
      font-size: 14px;
      padding: var(--spacing-3) var(--spacing-1);
    }
    .equity-section :global(table.data-table tbody td) {
      padding: var(--spacing-3) var(--spacing-1);
    }
    /* Percentile values are three characters wide, so the two value columns
       shrink to their headers' min-content and the surplus goes to the
       characteristic name, which is the only column that wants to wrap.
       (No `nowrap` here — it would hold "Funding percentile" on one line and
       put the width straight back.) */
    .equity-section :global(table.data-table th:not(:first-child)),
    .equity-section :global(table.data-table td:not(:first-child)) {
      width: 1%;
    }
  }
</style>
