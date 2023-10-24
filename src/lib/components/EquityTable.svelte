<script>
  import { scaleLinear, scaleThreshold } from "d3-scale";
  import { round_number, format_text_template } from "$lib/utils";
  import { program_map } from "$stores/programs.js";
  import { current_tooltip } from "$stores/tooltip.js";
  /**
   * @type {Array<Record<string, string | number>>}
   */
  export let data;
  export let limit_height = false;
  export let format_funs = {};
  export let viz_domain = [-1, 1];
  export let margin = { top: 0, right: 25, bottom: 0, left: 25 };
  export let color_scale = scaleThreshold()
    .domain([0])
    .range(["#FDBF11", "#1696D2"]);
  export let name_col = "indicator";
  /** @type {"concentration" | "high_need" | "variability"} */
  export let score_type = "concentration";
  export let variability_program = null;
  export let geography_level = "state";
  export let use_tooltips = false;
  $: adjust_score = score_type == "variability";
  $: geographies_label = geography_level == "county" ? "counties" : "states";

  let viz_height = 36;
  let bar_width = 2;

  let table_width = 600;
  $: viz_width = table_width < 500 ? 140 : table_width / 2;

  $: chart_width = viz_width - margin.left - margin.right;

  $: x_scale = scaleLinear()
    .domain(viz_domain)
    .range([margin.left, chart_width]);

  $: sortedData = !variability_program
    ? [
        ...data.slice(0, 4),
        ...data.slice(4).sort((a, b) => {
          return b.score - a.score;
        }),
      ]
    : data;


  const tooltip_text = {
    concentration: {
      high: "The [geographies] with the [highest/lowest] [indicator] receive a disproportionately high amount of national funding per capita",
      low: "The [geographies] with the [highest/lowest] [indicator] receive a disproportionately low amount of national funding per capita",
      neutral:
        "The [geographies] with the [highest/lowest] [indicator] receive funding on par with the national average",
    },
    high_need: {
      high: "Program funding increases progressively with an increasing [indicator] in a [geography]",
      low: "Program funding does not increase progressively with an increasing [indicator] in a [geography]",
    },
  };

  const inverted_indicators = [
    "median household income",
    "broadband speed",
    "internet access",
    "job density",
    "car access per household",
    "electric power generation",
    "housing units",
    "housing permits",
    "housing staff capacity",
    "environmental staff capacity",
    "transportation staff capacity"
  ];

  function adjust_variability_score(raw_score) {
    if (adjust_score) {
      return Math.min(raw_score, 8);
    } else {
      return raw_score;
    }
  }

  function show_tooltip(event, score, indicator) {
    const text_level = score > 0 ? "high" : score < 0 ? "low" : "neutral";
    const highest_lowest = inverted_indicators.includes(indicator) ? "lowest": "highest";
    const text = format_text_template(tooltip_text[score_type][text_level], {
      geographies: geographies_label,
      geography: geography_level,
      indicator: indicator,
      "highest/lowest": highest_lowest,
    });
    const tooltip_content = [
      {
        label: "",
        text: text,
      },
    ];
    $current_tooltip = {
      xPosition: event.pageX,
      yPosition: event.pageY,
      content: tooltip_content,
    };
  }
</script>

<div
  class="table-wrapper"
  class:table-wrapper--height-limit={limit_height}
  bind:clientWidth={table_width}
>
  <table class="data-table">
    <thead>
      <tr>
        <th on:click={() => sort_by_column(name_col)}>{name_col}</th>
        <th class="viz-col-header" on:click={() => sort_by_column("score")}
          >{!variability_program ? "Equity score" : "Variability score"}</th
        >
      </tr></thead
    >
    <tbody>
      {#each sortedData as row}
        {#if row.score !== null}
          {@const adjusted_score = adjust_variability_score(row.score)}
          {@const x_pos = x_scale(adjusted_score)}
          {@const zero_pos = x_scale(0)}
          {@const row_color = color_scale(adjusted_score)}
          <tr
            class="equity-score-row"
            on:mousemove={(e) => {
              if (score_type !== "variability" && use_tooltips) {
                show_tooltip(e, row.score, row.indicator.toLowerCase())
              }
            }}
            on:mouseleave={() => ($current_tooltip = null)}
          >
            {#if name_col == "program"}
              <td>{$program_map.get(row[name_col]).name}</td>
            {:else}
              <td>{row[name_col]}</td>
            {/if}
            <td class="viz-col">
              <svg
                class="viz--svg"
                width={viz_width}
                height={viz_height}
                viewBox="0 0 {viz_width} {viz_height}"
                aria-role="img"
              >
                <title>visualization of equity score</title>
                <rect
                  x={zero_pos}
                  y={viz_height / 2 - 5}
                  height="10"
                  width="2"
                  fill={row_color}
                />
                {#each [0] as i (i)}
                  <rect
                    x={adjusted_score >= 0 ? zero_pos : x_pos}
                    width={adjusted_score >= 0
                      ? x_pos - zero_pos
                      : zero_pos - x_pos}
                    y={viz_height / 2 - bar_width / 2}
                    height={2}
                    fill={row_color}
                  />
                {/each}
                {#each [0] as i (i)}
                  <circle
                    cx={x_pos}
                    cy={viz_height / 2}
                    r={6}
                    fill={row_color}
                    stroke={"#000000"}
                    stroke-width="2"
                  />
                {/each}
                <!-- <text x={row.score >= 0 ? x_pos + 10 : x_pos - 10} dy=".35em" dx={row.score < 0 ? "-2.5em" : 0} class:align-right={row.score < 0} y={viz_height / 2} class="chart-annotation-stroke">{row.score}</text> -->
              </svg>
              <div
                class="viz--annotation-layer"
                style="--margin-left: {margin.left}px; --margin-right: {margin.right}px;"
                style:width="{viz_width}px"
                style:height="{viz_height}px"
              >
                <p
                  class="viz--label"
                  class:left-align={adjust_variability_score(row.score) < 0}
                  style:left="{x_pos}px"
                >
                  {round_number(adjust_variability_score(row.score), 100)}
                </p>
              </div>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper {
    --scrollbar-foreground: var(--color-gray-shade-dark);
    --scrollbar-background: var(--color-gray-shade-light);
    overflow: auto;
    scrollbar-color: var(--scrollbar-foreground) var(--scrollbar-background);
    padding-bottom: 10px;
  }
  .table-wrapper::-webkit-scrollbar-thumb {
    /* Foreground */
    background: var(--scrollbar-foreground);
  }
  .table-wrapper::-webkit-scrollbar-track {
    /* Background */
    background: var(--scrollbar-background);
  }
  .table-wrapper--height-limit {
    max-height: 500px;
  }
  table.data-table {
    border-collapse: collapse;
    width: 100%;
  }
  table.data-table thead th {
    text-align: left;
    padding: 0.5em 1em;
    text-transform: uppercase;
    font-size: var(--font-size-small);
  }
  table.data-table thead tr {
    position: sticky;
    top: 0;
    z-index: 1;
    /* background: var(--color-white); */
    background: var(--color-black);
    border-bottom: solid 1px var(--color-gray-shade-darker);
    color: var(--color-white);
  }
  tr.equity-score-row {
    cursor: pointer;
  }
  table.data-table tbody td {
    padding: 0.5em;
    /* width: 100px; */
  }
  table.data-table tbody td.viz-col {
    padding: 0;
    position: relative;
  }
  table.data-table tbody td:last-child,
  table.data-table thead th:last-child {
    text-align: right;
  }
  table.data-table thead th:first-child {
    /* border-right: solid 1px var(--color-gray); */
  }
  table.data-table tbody td:first-child {
    font-weight: var(--font-weight-bold);
    width: 100%;
    /* border-right: solid 1px var(--color-gray); */
  }
  table tbody tr:nth-child(even) {
    background: var(--color-gray-shade-lightest);
  }
  table.data-table thead tr {
  }
  .viz--annotation-layer {
    /* display: none; */
    /* position: relative; */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .viz--bar {
    height: 30px;
    bottom: 3px;
    /* border: solid 2px var(--color-black); */
    background: var(--color-white);
    position: absolute;
    width: 7px;
    transform: translateX(-50%);
  }
  .viz--bubble {
    height: 16px;
    width: 16px;
    border-radius: 8px;
    top: 50%;
    border: solid 2px var(--color-black);
    background: var(--color-white);
    position: absolute;
    transform: translate(-50%, -50%);
  }
  .viz--bg-bar {
    height: 2px;
    top: 50%;
    background: var(--color-gray-shade-dark);
    position: absolute;
    transform: translate(0, -50%);
    width: 100%;
  }
  .viz--label {
    /* display: none; */
    /* color: var(--color-gray-shade-darker); */
    position: absolute;
    top: 50%;
    transform: translate(15px, -50%);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-normal);
  }
  .viz--label.left-align {
    transform: translate(calc(-100% - 15px), -50%);
  }
  .viz--tick {
    width: 2px;
    background: var(--color-gray-shade-dark);
    height: 10px;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .viz--frame-bar {
    background: var(--color-gray-shade-lighter);
    width: 100%;
    height: 20px;
    position: relative;
    top: 50%;
    transform: translate(0, -50%);
  }
  .score-col {
    /* font-weight: var(--font-weight-bold); */
    width: 100%;
  }
  .viz-col-header {
    text-align: center !important;
  }
  .viz--svg {
    /* position: absolute; */
    /* top: 50%; */
    /* left: 0; */
    /* transform: translateY(-50%); */
  }
  @media (max-width: 600px) {
    .viz--label {
      font-size: var(--font-size-small);
    }
  }
</style>
