<!--
  @component
  Generates an SVG Beeswarm chart using a [d3-force simulation](https://github.com/d3/d3-force). Inspired by [LayerCake's Beeswarm, force layout component.](https://layercake.graphics/example/BeeswarmForce).
 -->
<script>
  import { raise } from "$lib/utils";
  import { flip } from "svelte/animate";
  import { fade, fly, scale } from "svelte/transition";
  import { browser } from "$app/environment";
  import { urbanColors } from "$lib/colors";
  import Loading from "$components/Loading.svelte";
  import { current_tooltip } from "$stores/tooltip";
  import { format } from "d3-format";
  import { scaleLog, scaleSymlog } from "d3-scale";
  import { extent } from "d3-array";
  import { forceSimulation, forceX, forceY, forceCollide } from "d3-force";
  import { dollarsToString } from "$lib/utils";

  export let height = 420;

  export let left_margin = 80;

  $: margin = {
    top: 10,
    right: 50,
    bottom: 20,
    left: left_margin,
  };

  export let data;

  /** @type {string | null} highlight_fips=null] - The FIPS code of the county to higlight on the chart. */
  export let highlight_fips = null;

  /** @type {string | null} */
  export let highlight_name = null;

  /** @type {string} x_key="x"] - The key to lookup the value of x in the data. */
  export let x_key = "val";

  $: nodes = data
    .filter((d) => Object.keys(d).includes(x_key))
    .map((d) => ({ ...d }));

  /** @type {Number} [r=6] - The circle radius size in pixels. */
  export let r = 6;

  /** @type {Number} [stroke_width=2] - The circle's stroke width in pixels. */
  export let stroke_width = 2;

  /** @type {Number} [x_strength=0.95] - The value passed into the `.strength` method on `forceX`. See [the documentation](https://github.com/d3/d3-force#x_strength). */
  export let x_strength = 0.95;

  /** @type {Number} [y_strength=0.075] - The value passed into the `.strength` method on `forceY`. See [the documentation](https://github.com/d3/d3-force#y_strength). */
  export let y_strength = 0.075;

  export let data_level = "county";

  // will bind to container width
  let container_width = 540;

  let num_ticks = 3;

  const tickFormat = format("$~s");

  /**
   * Generates an array of ticks for the x-axis.
   * @param {Number} min - The minumum value of the x-axis.
   * @returns {Number[]} An array of ticks.
   */
  function generate_ticks(extent) {
    const [min, max] = extent;
    const ticks = [min];
    let i = 1;
    while (10 ** i <= max) {
      ticks.push(10 ** i);
      i++;
    }
    return ticks;
  }

  function get_beeswarm_extent(input_data, data_key) {
    const min_options = [0, 10, 100, 1000, 10000, 100000, 1000000];
    const data_extent = extent(input_data, (d) => d[data_key]);
    let min = 0;
    for (const option of min_options) {
      if (data_extent[0] >= option) {
        min = option;
      } else {
        break;
      }
    }

    return [min, data_extent[1]];
  }

  $: chart_width = container_width - margin.left - margin.right;
  $: chart_height = height - margin.top - margin.bottom;

  // $: x_scale = scaleLinear().domain(extent(data, d => d[x_key])).range([0, chart_width]).nice();
  $: data_extent = get_beeswarm_extent(data, x_key);
  $: scaleFunc = data_extent[0] == 0 ? scaleSymlog : scaleLog;
  $: x_scale = scaleFunc().domain(data_extent).range([0, chart_width]).nice();

  $: simulation = forceSimulation(nodes)
    .force(
      "x",
      forceX()
        .x((d) => x_scale(d[x_key]))
        .strength(x_strength)
    )
    .force(
      "y",
      forceY()
        .y(height / 2)
        .strength(y_strength)
    )
    .force("collide", forceCollide(r))
    .stop();

  $: {
    for (
      let i = 0,
        n = Math.ceil(
          Math.log(simulation.alphaMin()) /
            Math.log(1 - simulation.alphaDecay())
        );
      i < n;
      ++i
    ) {
      simulation.tick();
    }
  }

  // $: ticks = x_scale.ticks(num_ticks);
  // $: ticks = [10, 100, 1000, 10000, ...x_scale.ticks().filter((tick, i) => i % 2 === 0)];
  $: ticks = generate_ticks(x_scale.domain());

  function show_tooltip(event, data) {
    const county_data = Object.keys(data).includes("county");
    const tooltip_label = data.name;
    const tooltip_content = [
      {
        text: `<strong>${tooltip_label}</strong>`,
      },
      {
        label: "",
        text: dollarsToString(data[x_key]),
      },
    ];
    $current_tooltip = {
      xPosition: event.pageX,
      yPosition: event.pageY,
      content: tooltip_content,
    };
  }

  /**
  * @param {{name: string}} node
  * @returns {boolean}
  */
  function is_micro_area(node) {
    return node.name.toLowerCase().includes("micro area");
  }

  function get_fill(node) {
    if (data_level === "cbsa" && is_micro_area(node)) {
      return "#a2d4ec";
    }
    return urbanColors.blue;
  }
</script>

<div bind:clientWidth={container_width}>
  {#if highlight_name && data_level === "cbsa"}
    <div class="key-wrapper">
      <div class="key-item">
        <div class="key-swatch base" />
        <p class="key-label">
          Metropolitan area
        </p>
      </div>
      <div class="key-item">
        <div class="key-swatch other" />
        <p class="key-label">
          Micropolitan area
        </p>
      </div>
      <div class="key-item">
        <div class="key-swatch highlight" />
        <p class="key-label">{highlight_name}</p>
      </div>
    </div>
  {:else if highlight_name}
    <div class="key-wrapper">
      <div class="key-item">
        <div class="key-swatch other" />
        <p class="key-label">
          Other {data_level == "county" ? "counties" : data_level === "cbsa" ? "CBSAs" : "states"}
        </p>
      </div>
      <div class="key-item">
        <div class="key-swatch highlight" />
        <p class="key-label">{highlight_name}</p>
      </div>
    </div>
  {:else if data_level === "cbsa"}
    <div class="key-wrapper">
      <div class="key-item">
        <div class="key-swatch other" />
        <p class="key-label">
          Micropolitan area
        </p>
      </div>
      <div class="key-item">
        <div class="key-swatch base" />
        <p class="key-label">Metropolitan area</p>
      </div>
    </div>
  {/if}
  {#if browser}
    <svg
      width={container_width}
      {height}
      aria-label="A chart comparing funding per 1,000 residents for the selected program compared with {data_level ==
      'county'
        ? 'other counties in the state'
        : 'other states'}"
      role="img"
    >
      <g
        class="x-axis"
        transform="translate({margin.left} {height - margin.bottom})"
      >
        <line
          x1={-margin.left / 2}
          x2={chart_width}
          y1="0"
          y2="0"
          stroke="#000000"
        />
        {#each ticks as tick}
          <g transform="translate({x_scale(tick)}, 0)">
            <text text-anchor="middle" dy="1em" fill="#000000" font-size="12px"
              >{tickFormat(tick)}</text
            >
            <line x1="0" x2="0" y1="0" y2={-chart_height} stroke="#d2d2d2" />
          </g>
        {/each}
      </g>
      <g class="bee-group" transform="translate({margin.left}, 0)">
        {#each simulation.nodes() as node, i (node.fips)}
          <circle
            fill={get_fill(node)}
            cx={node.x}
            cy={node.y}
            in:fade={{ duration: 250, delay: i }}
            out:fade={{ duration: 250 }}
            on:mousemove={(e) => show_tooltip(e, node)}
            on:mouseout={() => ($current_tooltip = null)}
            on:mouseenter={(e) => {
              raise(e.target.parentNode);
            }}
            {r}
          />
        {/each}
        {#if highlight_fips}
          {@const highlightNode = simulation
            .nodes()
            .find((node) => node.fips === highlight_fips)}
          {#each [0] as d (d)}
            <g animate:flip={{ duration: 250 }}>
              <!-- <g > -->
              <circle
                fill="#fdbf11"
                stroke="#000000"
                stroke-width={stroke_width}
                cx={highlightNode.x}
                cy={highlightNode.y}
                on:mousemove={(e) => show_tooltip(e, highlightNode)}
                on:mouseout={() => ($current_tooltip = null)}
                {r}
              />
              <text
                x={highlightNode.x}
                y={highlightNode.y}
                dy="-1em"
                text-anchor="middle"
                class="chart-annotation-stroke"
                >{dollarsToString(highlightNode[x_key])}</text
              >
            </g>
          {/each}
        {/if}
      </g>
    </svg>
    <p class="axis-label">Program funding per 1,000 residents</p>
  {:else}
    <Loading {height} />
  {/if}
  <p class="chart-note">
    <strong>Notes: </strong> X-axis of chart is scaled logarithmically
  </p>
</div>

<style>
  .bee-group circle {
    cursor: pointer;
  }
  .bee-group circle:hover {
    stroke: #000000;
    stroke-width: 2px;
  }
  .key-wrapper {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 1rem;
    margin-top: 1rem;
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
    flex-shrink: 0;
  }
  .key-swatch.other {
    background: var(--color-blue-shade-light);
  }
  .key-swatch.highlight {
    background: var(--color-yellow);
    border: solid 2px var(--color-black);
  }
  .key-swatch.base {
    background: var(--color-blue);
    border: solid 2px var(--color-blue);
  }
  .key-label {
    font-size: var(--font-size-small);
    vertical-align: middle;
    line-height: 1em;
    margin-left: 0.5em;
  }
</style>
