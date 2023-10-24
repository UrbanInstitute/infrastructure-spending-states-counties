<!--
  @component
  Generates an SVG Barbell chart.
 -->
<script>
  import { browser } from "$app/environment";
  import { scalePoint, scaleLinear } from "d3-scale";
  import { max } from "d3-array";
  import { format } from "d3-format";
  import { dollarsToString, get_program_name } from "$lib/utils";
  import { program_map } from "$stores/programs.js";
  import { current_tooltip } from "$stores/tooltip";
  import Loading from "$components/Loading.svelte";

  /** @type {Array<Record<string, any>>} data=[] - Data points to plot */
  export let data = [];

  export let compare_key = "median";

  export let current_location = "";

  export let key_compare_label = "";

  const margin = {
    top: 25,
    right: 80,
    bottom: 50,
    left: 60,
  };

  const tickFormat = format("$~s");

  const barbell_height = 40;
  let width = 600;
  export let x_max = max(data, (d) => Math.max(d.funding, d[compare_key]));
  $: num_ticks = width < 500 ? 3 : 8;
  $: chartData = data.sort((a, b) => b.funding - a.funding);
  $: height =
    barbell_height * chartData.length * 1.25 + margin.top + margin.bottom;
  $: yScale = scalePoint()
    .domain(chartData.map((d) => d.program))
    .range([margin.top, height - margin.bottom - margin.top]);
  $: xScale = scaleLinear()
    .domain([0, x_max])
    .range([0, width - margin.right - margin.left])
    .nice();
  $: xTicks = xScale.ticks(num_ticks);
  $: circle_radius = 6;

  function on_mouseover(event, data) {
    const program_info = $program_map.get(data.program.replace("_per_1k", ""));
    let tooltip_content = [
      {
        label: "",
        text: `<strong>${get_program_name(program_info.short_name)}</strong>`,
      },
      {
        label: "Funding per 1,000 residents:",
        text: dollarsToString(data.funding),
      },
      {
        label: `Median among ${key_compare_label}:`,
        text: dollarsToString(data[compare_key]),
      },
    ];

    $current_tooltip = {
      xPosition: event.pageX,
      yPosition: event.pageY,
      content: tooltip_content,
    };
  }
</script>

<div class="barbell-wrap" bind:clientWidth={width}>
  <div class="key-wrapper">
    <div class="key-item">
      <div class="key-swatch median" />
      <p class="key-label">
        Median among {key_compare_label}
      </p>
    </div>
    <div class="key-item">
      <div class="key-swatch value" />
      <p class="key-label">{current_location}</p>
    </div>
  </div>
  <p class="axis-label left">Funding per 1,000 residents</p>
  <div class="barbell--chart">
    {#if browser}
      <svg
        {width}
        {height}
        aria-label="A chart comparing funding per 1,000 residents for each program compared with the median in similar {key_compare_label}"
        role="img"
      >
        <g class="axes" transform="translate({margin.left}, 0)">
          <line
            x1={-margin.left}
            x2={width - margin.right}
            y1={margin.top}
            y2={margin.top}
            stroke="#000000"
          />
          {#each xTicks as tick}
            <line
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={margin.top}
              y2={height}
              stroke="#d2d2d2"
            />
            <text
              x={xScale(tick)}
              y={margin.top}
              dy="-1em"
              text-anchor="middle"
              class="chart--tick-label">{tickFormat(tick)}</text
            >
          {/each}
        </g>
        <g transform="translate(0, {barbell_height / 2})">
          {#each chartData as item}
            {@const yPos = yScale(item.program)}
            {@const xValuePos = xScale(item.funding)}
            {@const xMedianPos = xScale(item[compare_key])}
            <g
              transform="translate({margin.left}, 0)"
              on:mousemove={(e) => on_mouseover(e, item)}
              on:mouseleave={(e) => ($current_tooltip = null)}
            >
              <g transform="translate(0, {barbell_height / 2})">
                <rect
                  x={Math.min(xMedianPos, xValuePos)}
                  y={yScale(item.program) - barbell_height / 8}
                  width={Math.abs(xValuePos - xMedianPos)}
                  height={barbell_height / 4}
                  fill="#dcdbdb"
                />
                <circle
                  cx={xMedianPos}
                  cy={yPos}
                  r={circle_radius}
                  fill="#a2d4ec"
                  stroke-width="2px"
                  stroke="#000000"
                />
                <circle
                  cx={xValuePos}
                  cy={yPos}
                  stroke="#000000"
                  stroke-width="2px"
                  r={circle_radius}
                  fill="#fdbf11"
                />
                <text
                  y={yPos}
                  dy="0.5em"
                  dx={item.funding >= item[compare_key] ? "1em" : "-1em"}
                  x={xValuePos}
                  class="chart-annotation-stroke"
                  text-anchor={item.funding >= item[compare_key]
                    ? "start"
                    : "end"}>{dollarsToString(item.funding)}</text
                >
              </g>
            </g>
          {/each}
        </g>
      </svg>
      <div class="barbell--annotation-layer">
        {#each chartData as item}
          {@const yPos = yScale(item.program) + barbell_height / 2}
          {@const xPos = Math.min(
            xScale(item.funding),
            xScale(item[compare_key])
          )}
          <p
            style:transform="translate({xPos}px, {yPos - 10}px)"
            class="barbell-chart--program-label"
            on:mousemove={(e) => on_mouseover(e, item)}
            on:mouseleave={(e) => ($current_tooltip = null)}
          >
            {get_program_name($program_map.get(item.program.replace("_per_1k", ""))?.short_name)}
          </p>
        {/each}
      </div>
    {:else}
      <Loading {height} />
    {/if}
  </div>
</div>

<style>
  .barbell-wrap {
    width: 100%;
  }
  .key-wrapper {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 1rem;
  }
  .key-item {
    display: flex;
    justify-content: center;
    align-items: middle;
    text-align: center;
    margin-right: 2rem;
  }
  .key-swatch {
    width: 14px;
    height: 14px;
    border-radius: 7px;
    border: solid 2px var(--color-black);
    flex-shrink: 0;
  }
  .key-swatch.median {
    background: var(--color-blue-shade-light);
  }
  .key-swatch.value {
    background: var(--color-yellow);
  }
  .key-label {
    font-size: var(--font-size-small);
    vertical-align: middle;
    line-height: 1em;
    margin-left: 0.5em;
  }
  .barbell--chart {
    position: relative;
  }
  .barbell--annotation-layer {
    position: absolute;
    top: 0;
    left: 20px;
    right: 0;
    bottom: 0;
  }
  .barbell-chart--program-label {
    font-size: var(--font-size-xsmall);
    /* font-weight: var(--font-weight-bold); */
  }
  p.barbell-chart--program-label {
    position: absolute;
    height: 3rem;
    cursor: pointer;
    transform: translateY(-0.5em);
  }
  text.chart-annotation-stroke {
    font-size: var(--font-size-small);
  }

  @media (max-width: 768px) {
    .key-item {
      display: block;
      text-align: center;
    }
    .key-swatch {
      margin: 0 auto var(--spacing-2);
    }
    .barbell-chart--program-label {
      left: 0px !important;
    }
    .barbell--annotation-layer {
      display: none;
    }
  }
  @media (max-width: 540px) {
    text.chart-annotation-stroke {
      font-size: var(--font-size-xsmall);
    }
  }
</style>
