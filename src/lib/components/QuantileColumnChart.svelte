<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { urbanColors } from "$lib/colors";
  import { scaleLinear, scaleBand } from "d3-scale";
  import { max } from "d3-array";
  import { format } from "d3-format";
  import { format_indicator_value } from "$lib/utils";
  import { onMount } from "svelte";
  import { current_tooltip } from "$stores/tooltip";

  /** @type {Array<Record<string, any>>} */
  export let quantiles;
  // console.log(quantiles)

  /** @type {String} [fill="#00e047"] - The shape"s fill color. */
  export let fill = urbanColors.blue;

  /** @type {String} [stroke="#000"] - The shape"s stroke color. */
  export let stroke = "#000";

  /** @type {Number} [strokeWidth=0] - The shape"s stroke width. */
  export let strokeWidth = 0;

  /** @type {string} */
  export let current_indicator;

  /** @type {string} - Accessibility label for chart */
  export let label;

  export let yKey = "funding_average_per_1k";
  export let xKey = "quantile";

  let width = 300;

  // Phone widths: at a 390px viewport the chart measures ~310px, which leaves
  // ~50px per band — too little for a full range label ("12,125.15-17,841.23"),
  // and too little height for the eight y-axis ticks the wide chart asks for.
  // Measured off the container rather than a media query so every switch below
  // — margins, tick count, number format, type size — flips together.
  $: is_narrow = width < 540;

  // Top and bottom are fixed; the left margin is sized to the y-axis labels
  // further down, which depend on the y-scale, which depends on these two.
  const MARGIN_TOP = 10;
  const MARGIN_BOTTOM = 30;

  $: height = width * (2 / 3);
  $: yRange = [height - MARGIN_BOTTOM - MARGIN_TOP, 0];
  $: chartWidth = width - margin.left - margin.right;

  $: xScale = scaleBand()
    .domain(quantiles.map((d) => d[xKey]))
    .range([0, chartWidth])
    .padding(0.25);
  $: yScale = scaleLinear()
    .domain([0, /** @type {number} */ (max(quantiles, (d) => d[yKey]))])
    .range(yRange)
    .nice();

  $: columnWidth = (/** @type {any} */ d) => {
    const vals = d[xKey];
    return Math.abs(vals[1] - vals[0]);
  };

  $: columnHeight = (/** @type {any} */ d) => {
    return yRange[0] - yScale(d[yKey]);
  };
  /**
   * @param {number} num
   * @param {boolean} compact
   */
  function format_range_number(num, compact) {
    return format_indicator_value(num, current_indicator, compact);
  }
  /**
   * @param {any} d
   * @param {boolean} compact
   */
  function x_label(d, compact) {
    const { quantile_range_max, quantile_range_min } = d;
    const quantile_range = [quantile_range_min, quantile_range_max];
    if (quantile_range[1] == null) {
      return `${format_range_number(quantile_range[0], compact)}+`;
    }
    return `${format_range_number(
      quantile_range[0],
      compact
    )}-${format_range_number(quantile_range[1], compact)}`;
  }

  // Reactive rather than a plain function so the template re-renders the ticks
  // when the breakpoint flips, not only when the tick values change.
  const y_tick_currency = format("$,.2~s");
  /** @param {number} tick */
  const y_tick_full = (tick) =>
    tick.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  $: y_label = is_narrow ? y_tick_currency : y_tick_full;
  $: y_ticks = yScale.ticks(is_narrow ? 5 : 8);

  // Hover value for a bar: its dollar amount in the wide axis's full-currency
  // format, per the card subtitle's units. The range is already under the
  // bar, so only the bar's aria-label repeats it.
  /** @param {any} d */
  const bar_value = (d) => `${y_tick_full(d[yKey])} per 1,000 residents`;
  /**
   * @param {MouseEvent} event
   * @param {any} d
   */
  function on_bar_mousemove(event, d) {
    $current_tooltip = {
      xPosition: event.pageX,
      yPosition: event.pageY,
      content: [{ text: bar_value(d) }],
    };
  }

  // The left margin fits the widest tick label, so "$1,200,000" isn't clipped
  // at the SVG's left edge. Measured with canvas in the browser, once the web
  // font has loaded; prerendering has no canvas, so it estimates from the
  // character count instead.
  const TICK_GAP = 5; // the labels' `x` offset from the axis
  const TICK_PAD = 4; // room between the widest label and the SVG edge
  /** @type {HTMLDivElement} */
  let container;
  /** @type {CanvasRenderingContext2D | null} */
  let measure_ctx = null;
  let font_family = "sans-serif";
  onMount(() => {
    measure_ctx = document.createElement("canvas").getContext("2d");
    font_family = getComputedStyle(container).fontFamily;
    document.fonts?.ready.then(() => {
      // Reassigned so the margin is measured again with the loaded face.
      font_family = getComputedStyle(container).fontFamily;
    });
  });
  /**
   * @param {string} text
   * @param {number} font_px
   * @param {CanvasRenderingContext2D | null} ctx
   * @param {string} family
   */
  function text_width(text, font_px, ctx, family) {
    if (!ctx) return text.length * font_px * 0.6;
    ctx.font = `${font_px}px ${family}`;
    return ctx.measureText(text).width;
  }
  $: tick_font_px = is_narrow ? 11 : 12;
  $: widest_tick = Math.max(
    0,
    ...y_ticks.map((tick) =>
      text_width(y_label(tick), tick_font_px, measure_ctx, font_family)
    )
  );

  $: margin = {
    top: MARGIN_TOP,
    right: is_narrow ? 8 : 10,
    bottom: MARGIN_BOTTOM,
    left: Math.ceil(widest_tick) + TICK_GAP + TICK_PAD,
  };
</script>

<div bind:clientWidth={width} bind:this={container}>
  <!-- The units line lives in the card subtitle above the chart
       (`quintile_chart_subtitle`), per `design/categories.jpg`. -->
  <svg {width} {height} role="img" aria-label={label}>
    <g class="chart-inner" transform="translate({margin.left}, {margin.top})">
      <g class="chart-axes">
        {#each y_ticks as tick, i (tick)}
          {@const yPos = yScale(tick)}
          <line
            y1={yPos}
            y2={yPos}
            x1="0"
            x2={chartWidth}
            stroke={i == 0 ? "black" : urbanColors.gray}
          />
          <text
            class="axis-tick"
            class:axis-tick--compact={is_narrow}
            x={-TICK_GAP}
            y={yPos}
            dy="0.35em">{y_label(tick)}</text
          >
        {/each}
        <!-- <line y1={yScale(0)} y2={yScale(0)} x1="0" x2={chartWidth} stroke={urbanColors.black}></line> -->
      </g>
      <g class="column-group">
        {#each quantiles as d, i (d[xKey])}
          {@const colHeight = columnHeight(d)}
          {@const xGot = xScale(d[xKey])}
          {@const xPos = Array.isArray(xGot) ? xGot[0] : xGot}
          {@const colWidth = xScale.bandwidth
            ? xScale.bandwidth()
            : columnWidth(d)}
          {@const yValue = d[yKey]}
          <!-- A chart mark, with the tooltip's text as its label. -->
          <rect
            class="group-rect"
            role="graphics-symbol"
            aria-label={`${x_label(d, false)}: ${bar_value(d)}`}
            data-id={i}
            x={xPos}
            y={yScale(d[yKey])}
            width={colWidth}
            height={colHeight}
            {fill}
            {stroke}
            stroke-width={strokeWidth}
            on:mousemove={(e) => on_bar_mousemove(e, d)}
            on:mouseleave={() => ($current_tooltip = null)}
          />
          <text
            x={xPos + colWidth / 2}
            y={yRange[0]}
            dy="2em"
            text-anchor="middle"
            class="bar-label"
            class:bar-label--compact={is_narrow}>{x_label(d, is_narrow)}</text
          >
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
  text.axis-tick--compact {
    font-size: 11px;
  }
  text.bar-label {
    font-size: var(--font-size-xsmall);
  }
  /* Driven by the measured chart width rather than a media query, so the type
     size and the abbreviated labels switch at the same moment. */
  text.bar-label--compact {
    font-size: 9px;
  }
</style>
