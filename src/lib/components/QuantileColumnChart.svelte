<script>
  import { urbanColors } from "$lib/colors";
  import {scaleLinear, scaleBand} from "d3-scale";
  import { max } from "d3-array";
  import { format } from "d3-format";
  import { get_indicator_label, format_indicator_value } from "$lib/utils";

  export let quantiles;
  // console.log(quantiles)

  /** @type {String} [fill="#00e047"] - The shape"s fill color. */
  export let fill = urbanColors.blue;

  /** @type {String} [stroke="#000"] - The shape"s stroke color. */
  export let stroke = "#000";

  /** @type {Number} [strokeWidth=0] - The shape"s stroke width. */
  export let strokeWidth = 0;

  /** @type {Boolean} [false] - Show the numbers for each column */
  export let showLabels = false;

  export let current_indicator;

  /** @type {string} - Accessibility label for chart */
  export let label;

  export let yKey = "funding_average_per_1k";
  export let xKey = "quantile";

  const margin = {
    top: 10,
    right: 10,
    bottom: 30,
    left: 60,
  };

  let width = 300;
  $: height = width * (2/3);
  $: yRange = [height - margin.bottom - margin.top, 0];
  $: chartWidth = width - margin.left - margin.right;

  $: xScale = scaleBand().domain(quantiles.map(d => d[xKey])).range([0, chartWidth]).padding(0.25);
  $: yScale = scaleLinear().domain([0, max(quantiles, d => d[yKey])]).range(yRange).nice();

  $: columnWidth = d => {
    const vals = d[xKey];
    return Math.abs(vals[1] - vals[0]);
  };

  $: columnHeight = d => {
    return yRange[0] - yScale(d[yKey]);
  };
  function format_range_number(num) {
    return format_indicator_value(num, current_indicator);
  }
  function x_label(d) {
    const { quantile_range_max, quantile_range_min } = d;
    const quantile_range = [quantile_range_min, quantile_range_max];
    if (quantile_range[1] == null) {
      return `${format_range_number(quantile_range[0])}+`
    }
    return `${format_range_number(quantile_range[0])}-${format_range_number(quantile_range[1])}`
  }
</script>
<div bind:clientWidth={width}>
  <p class="axis-label left">Average program funding per 1,000 residents</p>
  <svg width={width} height={height} role="img" aria-label={label}>
  <g class="chart-inner" transform="translate({margin.left}, {margin.top})">
    <g class="chart-axes">
      {#each yScale.ticks(8) as tick, i}
        {@const yPos = yScale(tick)}
        <line y1={yPos} y2={yPos} x1="0" x2={chartWidth} stroke={i == 0 ? "black" : urbanColors.gray}></line>
        <text class="axis-tick" x={-5} y={yPos} dy="0.35em">{tick.toLocaleString("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0})}</text>
      {/each}
      <!-- <line y1={yScale(0)} y2={yScale(0)} x1="0" x2={chartWidth} stroke={urbanColors.black}></line> -->
    </g>
    <g class="column-group">
      {#each quantiles as d, i}
        {@const colHeight = columnHeight(d)}
        {@const xGot = xScale(d[xKey])}
        {@const xPos = Array.isArray(xGot) ? xGot[0] : xGot}
        {@const colWidth = xScale.bandwidth ? xScale.bandwidth() : columnWidth(d)}
        {@const yValue = d[yKey]}
        <rect
          class="group-rect"
          data-id="{i}"
          x="{xPos}"
          y="{yScale(d[yKey])}"
          width="{colWidth}"
          height="{colHeight}"
          {fill}
          {stroke}
          stroke-width="{strokeWidth}"
        />
        <text x="{xPos + colWidth / 2}" y="{yRange[0]}" dy="2em" text-anchor="middle" class="bar-label">{x_label(d)}</text>
      {/each}
    </g>

  </g>
  </svg>
</div>
<style>
  text.axis-tick {
    font-size: 12px;
    text-anchor: end;
  }
  text.bar-label {
    font-size: var(--font-size-xsmall);
  }
  @media(max-width: 540px) {
    text.bar-label {
      font-size: 9px;
    }
  }
</style>
