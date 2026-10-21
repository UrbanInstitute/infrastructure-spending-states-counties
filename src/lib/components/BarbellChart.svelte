<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @component
  The comparison table for the geography pages' "How Do Similar Areas Compare?"
  module. One row per funded category: a label, an inline barbell track holding
  the comparison median and this place's value, and the place's funding.

  Built as a table rather than a single SVG (per `design/geography.png`) so the
  row labels, the axis end-labels and the dollar values are laid out by the
  table itself instead of being positioned by hand. Every row shares one x
  scale, computed here from `x_max`, so the rows stay comparable — and the
  parent computes `x_max` across all rows, not just the filtered ones, so
  filtering does not move the dots.

  Dot positions are `calc()` percentages of the track cell, inset by the dot
  radius at each end, which keeps the table responsive without measuring
  anything.
 -->
<script>
  import { scaleLinear } from "d3-scale";
  import { max } from "d3-array";
  import { format } from "d3-format";
  import { dollarsToString } from "$lib/utils";
  import { category_display_name } from "$stores/categories.js";
  import { current_tooltip } from "$stores/tooltip";

  /** @typedef {{category: string, funding: number, median: number | null, median_funded: number | null}} CategoryRow */

  /**
   * One entry per category the place received funding for.
   * @type {CategoryRow[]}
   **/
  export let data = [];

  /** @type {"median" | "median_funded"} */
  export let compare_key = "median";

  /** @type {string} */
  export let current_location = "";

  /** @type {string} */
  export let key_compare_label = "";

  /**
   * Upper bound of the shared x scale.
   * @type {number}
   **/
  export let x_max = /** @type {number} */ (
    max(data, (d) => Math.max(d.funding, Number(d[compare_key]) || 0)) ?? 0
  );

  // Radius of the value dots, in px. The scale is inset by one radius at each
  // end so a dot at $0 or at the maximum still sits inside the track.
  const DOT_RADIUS = 8;

  const axis_format = format("$~s");

  $: x_scale = scaleLinear()
    .domain([0, x_max > 0 ? x_max : 1])
    .range([0, 1])
    .nice();

  // `nice()` rounds the domain out; the rounded value is what the right-hand
  // axis header reads.
  $: axis_max = x_scale.domain()[1];

  $: rows = build_rows(data, compare_key, x_scale);

  /**
   * Position along the track as a CSS length. Percentages keep the table
   * responsive; the px terms inset both ends by the dot radius.
   * @param {number} t - Scaled position, 0–1
   * @returns {string}
   */
  function track_offset(t) {
    return `calc(${DOT_RADIUS}px + ${t} * (100% - ${DOT_RADIUS * 2}px))`;
  }

  /**
   * Precompute each row's label and track geometry. The scale is taken as an
   * argument rather than read from the outer scope so that the reactive
   * statement above re-runs when the scale changes.
   * @param {CategoryRow[]} category_rows
   * @param {"median" | "median_funded"} key
   * @param {import("d3-scale").ScaleLinear<number, number>} scale
   */
  function build_rows(category_rows, key, scale) {
    return [...category_rows]
      .sort((a, b) => b.funding - a.funding)
      .map((row) => {
        const median = typeof row[key] === "number" ? Number(row[key]) : null;
        const value_t = scale(row.funding);
        const median_t = median === null ? null : scale(median);
        return {
          ...row,
          label: category_display_name(row.category),
          median_value: median,
          value_offset: track_offset(value_t),
          median_offset: median_t === null ? null : track_offset(median_t),
          bar_offset:
            median_t === null
              ? null
              : track_offset(Math.min(value_t, median_t)),
          bar_width:
            median_t === null
              ? null
              : `calc(${Math.abs(value_t - median_t)} * (100% - ${
                  DOT_RADIUS * 2
                }px))`,
        };
      });
  }

  /**
   * @param {MouseEvent} event
   * @param {{label: string, funding: number, median_value: number | null}} row
   */
  function on_mousemove(event, row) {
    $current_tooltip = {
      xPosition: event.pageX,
      yPosition: event.pageY,
      content: [
        { label: "", text: `<strong>${row.label}</strong>` },
        {
          label: `${current_location}, per 1,000 residents:`,
          text: dollarsToString(row.funding),
        },
        {
          label: `Median among ${key_compare_label}:`,
          text:
            row.median_value === null
              ? "Not available"
              : dollarsToString(row.median_value),
        },
      ],
    };
  }
</script>

<div class="barbell-table--wrap">
  <table
    class="barbell-table"
    aria-label="Funding per 1,000 residents for each category, compared with the median among {key_compare_label}"
  >
    <colgroup>
      <col class="col-label" />
      <col class="col-axis" />
      <col class="col-axis" />
      <col class="col-value" />
    </colgroup>
    <thead>
      <tr>
        <th scope="col" class="cell-label">Category</th>
        <th scope="col" class="cell-axis cell-axis--start">{axis_format(0)}</th>
        <th scope="col" class="cell-axis cell-axis--end"
          >{axis_format(axis_max)}</th
        >
        <th scope="col" class="cell-value">Funding per 1,000 residents</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.category)}
        <tr
          on:mousemove={(e) => on_mousemove(e, row)}
          on:mouseleave={() => ($current_tooltip = null)}
        >
          <th scope="row" class="cell-label">{row.label}</th>
          <td class="cell-track" colspan="2">
            <div class="track">
              {#if row.bar_offset !== null}
                <div
                  class="track--bar"
                  style:left={row.bar_offset}
                  style:width={row.bar_width}
                />
              {/if}
              {#if row.median_offset !== null}
                <div class="track--dot median" style:left={row.median_offset} />
              {/if}
              <div class="track--dot value" style:left={row.value_offset} />
            </div>
            <span class="track--description"
              >Median among {key_compare_label}: {row.median_value === null
                ? "not available"
                : dollarsToString(row.median_value)}</span
            >
          </td>
          <td class="cell-value">{dollarsToString(row.funding)}</td>
        </tr>
      {:else}
        <tr>
          <td class="cell-empty" colspan="4"
            >No funded categories to compare.</td
          >
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .barbell-table--wrap {
    width: 100%;
    overflow-x: auto;
  }
  table.barbell-table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    min-width: 600px;
  }
  col.col-label {
    width: 45%;
  }
  col.col-axis {
    width: 15%;
  }
  col.col-value {
    width: 25%;
  }
  table.barbell-table thead tr {
    background: var(--color-gray-shade-lighter);
  }
  table.barbell-table th {
    font-family: var(--font-family-sans-alt);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
  }
  table.barbell-table thead th {
    padding-block: var(--spacing-3);
  }
  table.barbell-table .cell-label {
    text-align: left;
    padding-inline: var(--spacing-4);
  }
  table.barbell-table .cell-axis {
    padding: 0;
    text-align: left;
  }
  table.barbell-table .cell-axis--end {
    text-align: right;
  }
  table.barbell-table .cell-value {
    text-align: right;
    padding-inline-end: var(--spacing-4);
    font-size: var(--font-size-small);
    white-space: nowrap;
  }
  /* The header carries the units ("Funding per 1,000 residents"), so it wraps
     within the column; the dollar values below it stay on one line. */
  table.barbell-table thead .cell-value {
    white-space: normal;
  }
  table.barbell-table tbody th,
  table.barbell-table tbody td {
    border-bottom: solid 1px var(--color-gray-shade-lighter);
    padding-block: var(--spacing-3);
    vertical-align: middle;
  }
  table.barbell-table tbody th.cell-label {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-normal);
  }
  table.barbell-table tbody tr:hover {
    background: var(--color-gray-shade-lightest);
  }
  table.barbell-table .cell-track {
    padding-inline: 0;
  }
  /* The visible track spans the two axis columns; the dots are positioned as a
     share of its width, so a single scale serves every row. */
  .track {
    position: relative;
    height: 16px;
  }
  .track--bar {
    position: absolute;
    top: 50%;
    height: 12px;
    transform: translateY(-50%);
    background: var(--color-gray-shade-lighter);
    border-radius: 6px;
  }
  .track--dot {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    border-radius: 50%;
    transform: translateY(-50%);
  }
  .track--dot.median {
    background: var(--color-black);
  }
  .track--dot.value {
    background: var(--color-blue);
  }
  /* The median only has a readable value in the tooltip, which is mouse-only. */
  .track--description {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  /* Narrow screens: let the table fit rather than scroll. Scrolling here would
     leave the label column visible and push the tracks and dollar values, i.e.
     the whole point of the module, off screen. */
  @media (max-width: 768px) {
    table.barbell-table {
      min-width: 0;
    }
    col.col-label {
      width: 40%;
    }
    col.col-value {
      width: 30%;
    }
    table.barbell-table thead th,
    table.barbell-table tbody th.cell-label,
    table.barbell-table .cell-value {
      font-size: var(--font-size-xsmall);
    }
    table.barbell-table .cell-label {
      padding-inline: var(--spacing-2);
    }
    table.barbell-table .cell-value {
      padding-inline-end: var(--spacing-2);
    }
    .track--dot {
      width: 12px;
      height: 12px;
      margin-left: -6px;
    }
    .track--bar {
      height: 8px;
    }
  }
  table.barbell-table .cell-empty {
    padding: var(--spacing-6);
    text-align: center;
    font-size: var(--font-size-small);
    font-style: italic;
    color: var(--color-gray-shade-dark);
  }
</style>
