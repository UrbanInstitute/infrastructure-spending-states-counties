<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @component
  The quintile/quartile funding chart card for the category page. Page-level
  furniture — the `header_quintile` heading and `quintile_description` — lives on
  the page, not here; this component owns only the card's contents: a units
  subtitle, the two selects and the chart. (The t-test summary sentence that
  sat beneath the chart was removed per the change list, C-9.)
 -->
<script>
  import {
    get_indicator_label,
    get_indicator_label_lower,
    is_indicator_per_capita,
    is_indicator_per_sq_mile,
    geo_labels,
  } from "$lib/utils.js";
  import { logClickToGA } from "$lib/analytics";
  import QuantileColumnChart from "$components/QuantileColumnChart.svelte";
  import Select from "$components/Select.svelte";
  import site_content from "$data/site_content.aml";

  /** @type {Array<Record<string, any>>} */
  export let quantile_funding;
  /**
   * Opening selections, e.g. from a landing-page takeaway's deep link. A value
   * with no data here is ignored in favor of the usual default.
   * @type {string | undefined}
   */
  export let default_indicator = undefined;
  /** @type {string | undefined} */
  export let default_data_level = undefined;

  const content = site_content.category_page.data_viz;

  $: indicator_values = Array.from(
    new Set(quantile_funding.map(({ indicator }) => indicator))
  );
  // The selects bind to plain variables, set from the opening selections by
  // the functions below. A `$:` declaration would not do: binding to one makes
  // Svelte re-invalidate its inputs, and the arrays among them always count as
  // changed, so the declaration re-ran and undid every pick.
  let current_indicator = "percent_poc";
  $: apply_default_indicator(default_indicator, indicator_values);

  /**
   * @param {string | undefined} requested
   * @param {string[]} available
   */
  function apply_default_indicator(requested, available) {
    current_indicator =
      requested && available.includes(requested) ? requested : "percent_poc";
  }

  $: current_quantiles = quantile_funding.filter(
    (d) => d.data_level == data_level && d.indicator == current_indicator
  );
  $: has_county_data = quantile_funding.reduce(
    (has_county, d) => d.data_level == "county" || has_county,
    false
  );
  $: indicator_options = indicator_values.map((d) => ({
    label: get_indicator_label(d),
    value: d,
  }));
  let data_level_options = [
    {
      label: "State",
      value: "state",
    },
    {
      label: "County",
      value: "county",
    },
    {
      label: "Urban counties",
      value: "county_urban",
    },
    {
      label: "Metropolitan areas",
      value: "metro_area",
    },
  ];
  // The level select only shows when there is county data, so without it the
  // chart stays on State whatever the requested level.
  let data_level = "state";
  $: apply_default_data_level(default_data_level, quantile_funding);

  /**
   * @param {string | undefined} requested
   * @param {Array<Record<string, any>>} funding
   */
  function apply_default_data_level(requested, funding) {
    const has_county = funding.some((d) => d.data_level == "county");
    data_level =
      has_county &&
      requested &&
      data_level_options.some(({ value }) => value === requested) &&
      funding.some((d) => d.data_level == requested)
        ? requested
        : has_county
        ? "county"
        : "state";
  }
  // The characteristic reads mid-sentence in the chart label, so it is lowercased.
  $: characteristic = get_indicator_label_lower(current_indicator);

  /** @param {string} level */
  function get_geography_text(level) {
    if (level == "county_urban") {
      return "counties with more than half of their population in urban areas";
    }
    if (level === "metro_area") {
      return "metropolitan areas";
    }
    return geo_labels(level).plural;
  }
  /** @param {string} level */
  function get_geography_label(level) {
    if (level == "county_urban") {
      return "counties in urban areas";
    }
    if (level === "metro_area") {
      return "metropolitan areas";
    }
    return geo_labels(level).singular;
  }
</script>

<div class="quantile--wrapper">
  <div class="quantile--chart-header">
    <p class="quantile--chart-subtitle">{content.quintile_chart_subtitle}</p>
  </div>

  <div class="quantile--controls">
    <Select
      items={indicator_options}
      bind:value={current_indicator}
      on:change={(e) => {
        logClickToGA(
          e.target,
          "indicator-select-quintile--" + e.detail.detail.value
        );
      }}
    />
    {#if has_county_data}
      <Select
        items={data_level_options}
        bind:value={data_level}
        on:change={(e) => {
          logClickToGA(
            e.target,
            "data-level-select-quintile--" + e.detail.detail.value
          );
        }}
      />
    {/if}
  </div>

  <QuantileColumnChart
    quantiles={current_quantiles}
    {current_indicator}
    label={`A chart displaying average funding per 1,000 residents among quantiles of ${get_geography_text(
      data_level
    )} by ${characteristic}`}
  />
  <p class="axis-label">
    {get_indicator_label(current_indicator.replace("_per_1k", ""))}
    {is_indicator_per_capita(current_indicator) ? "per 10,000 residents" : ""}
    {is_indicator_per_sq_mile(current_indicator)
      ? "per 1,000 square miles"
      : ""}
    {data_level == "county_urban" ? "for" : "by"}
    {get_geography_label(data_level)}
  </p>
</div>

<style>
  .quantile--chart-header {
    text-align: center;
  }
  .quantile--chart-subtitle {
    font-size: 16px;
    line-height: 24px;
    margin-block-end: 0;
  }
  .quantile--controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-4);
    margin-block: var(--spacing-6);
  }
  .quantile--controls > :global(.select) {
    flex: 1 1 220px;
    max-width: 280px;
  }
</style>
