<!--
  @component
  Generates an SVG Barcode chart.
 -->
<script>
  import { scaleSymlog } from "d3-scale";
  import { extent, mean } from "d3-array";

  const height = 100;

  const margin = {
    top: 30,
    right: 50,
    bottom: 30,
    left: 30,
  };

  export let data;

  /** @type {string | null} highlight_fips=null] - The FIPS code of the county to higlight on the chart. */
  export let highlight_fips = null;

  /** @type {string} x_key="x"] - The key to lookup the value of x in the data. */
  export let x_key = "val";

  /** @type {Number} [stroke_width=1] - The circle's stroke width in pixels. */
  export let stroke_width = 2;

  // will bind to container width
  let container_width = 540;

  $: num_ticks = Math.max(Math.floor(container_width / 200), 4);
  $: chart_width = container_width - margin.left - margin.right;
  $: chart_height = height - margin.top - margin.bottom;

  $: xScale = scaleSymlog()
    .domain(extent(data, (d) => d[x_key]))
    .range([0, chart_width])
    .nice();

  $: mean_value = mean(data, (d) => d[x_key]);
  $: mean_x_pos = xScale(mean_value);

  $: ticks = xScale.ticks(num_ticks);
</script>

<div bind:clientWidth={container_width}>
  <svg width={container_width} {height}>
    <g
      class="x-axis"
      transform="translate({margin.left} {height - margin.bottom})"
    >
      <line x1="0" x2={chart_width} y1="0" y2="0" stroke="#e3e3e3" />
      {#each ticks as tick}
        <g transform="translate({xScale(tick)}, 0)">
          <text
            text-anchor="middle"
            dy="1.5em"
            fill="#696969"
            class="chart-axis-tick-text">${tick.toLocaleString()}</text
          >
          <line x1="0" x2="0" y1="0" y2={margin.bottom / 4} stroke="#696969" />
        </g>
      {/each}
    </g>
    <rect
      x={margin.left}
      width={chart_width}
      y={margin.top}
      height={chart_height}
      stroke="#000000"
      stroke-width="1px"
      fill="none"
    />
    <g class="barcode-group" transform="translate({margin.left}, {margin.top})">
      {#each data as item}
        {#if highlight_fips && item.fips !== highlight_fips}
          <line
            class="data-point-bg"
            stroke="#a2d4ec"
            stroke-width={stroke_width}
            x1={xScale(item[x_key])}
            x2={xScale(item[x_key])}
            y1="0"
            y2={chart_height}
          />
        {/if}
      {/each}
      {#if highlight_fips}
        {@const highlightItem = data.find((d) => d.fips === highlight_fips)}
        <rect
          stroke="#000000"
          fill="#fdbf11"
          stroke-width={1}
          x={xScale(highlightItem[x_key]) - 4}
          width={8}
          y="-4"
          height={chart_height + 8}
        />
        <text
          x={xScale(highlightItem[x_key])}
          text-anchor="middle"
          class="chart-annotation-stroke"
          dy="-1em">${highlightItem[x_key].toLocaleString()}</text
        >
      {/if}
      <g class="mean-annotation">
        <!-- <line -->
        <!--   stroke="#000000" -->
        <!--   fill="none" -->
        <!--   stroke-width={1} -->
        <!--   x1={xScale(mean_value)} -->
        <!--   x2={xScale(mean_value)} -->
        <!--   y1={chart_height} -->
        <!--   y2={chart_height + 8} -->
        <!-- /> -->
        <path
          fill="#9d9d9d"
          d="M {mean_x_pos - 6} {chart_height + 8} L {mean_x_pos +
            6} {chart_height + 8} L {mean_x_pos} {chart_height + 1} Z"
        />
        <text
          x={xScale(mean_value)}
          y={chart_height}
          text-anchor="middle"
          class="chart-annotation-minor"
          dy="1.5em">Average</text
        >
      </g>
    </g>
  </svg>
</div>

<style>
  .data-point-bg {
    mix-blend-mode: multiply;
    cursor: pointer;
  }
  .data-point-bg:hover {
    mix-blend-mode: normal;
    stroke: var(--color-blue);
    stroke-width: 4px;
  }
</style>
