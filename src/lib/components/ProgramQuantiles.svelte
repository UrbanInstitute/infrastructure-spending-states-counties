<script>
  import { group } from "d3-array";
  import {
    get_indicator_label,
    format_text_template,
    is_indicator_per_capita,
    is_indicator_per_sq_mile,
  } from "$lib/utils.js";
  import QuantileColumnChart from "$components/QuantileColumnChart.svelte";
  import Select from "$components/Select.svelte";
  import site_content from "$data/site_content.json";

  export let quantile_funding;
  export let t_test_data;

  let current_indicator = "percent_poc";

  $: current_quantiles = quantile_funding.filter(
    (d) => d.data_level == data_level && d.indicator == current_indicator
  );
  $: has_county_data = quantile_funding.reduce(
    (has_county, d) => d.data_level == "county" || has_county,
    false
  );
  $: indicator_options = Array.from(
    new Set(quantile_funding.map(({ indicator }) => indicator))
  ).map((d) => ({
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
  ];
  $: data_level = has_county_data ? "county" : "state";
  $: current_t_test_data = t_test_data.find(
    (d) => d.data_level == data_level && d.indicator == current_indicator
  );
  function get_direction_text(d) {
    if (d.p_value < 0.05) {
      return d.direction;
    } else {
      return "similar";
    }
  }
  function get_geography_text(level) {
    if (level == "state") {
      return "states";
    }
    if (level == "county_urban") {
      return "counties in metropolitan areas";
    }
    return "counties";
  }
</script>

<div class="quantile--wrapper">
  <div class="quantile--meta-wrapper">
    <h2 class="module-subhead">
      {site_content.program_pages.quintile_scores.header}
    </h2>
    <p>{site_content.program_pages.quintile_scores.about_text}</p>
    <div class="spacing" />
    <Select items={indicator_options} bind:value={current_indicator} />
    {#if has_county_data}
      <div class="spacing" />
      <Select items={data_level_options} bind:value={data_level} />
    {/if}
  </div>
  <div class="quantile-charts--wrapper">
    <p class="quantile-charts--funding-text">
      Funding is on average <strong
        >{get_direction_text(current_t_test_data)}</strong
      >
      for {get_geography_text(data_level)} with a higher {get_indicator_label(
        current_indicator
      ).toLowerCase()} than for {get_geography_text(data_level)} with a lower {get_indicator_label(
        current_indicator
      ).toLowerCase()} compared with the national average.
    </p>
    <QuantileColumnChart quantiles={current_quantiles} {current_indicator} label={`A chart displaying average funding per 1,000 residents among quantiles of ${get_geography_text(data_level)} by ${get_indicator_label(current_indicator).toLowerCase()}`}/>
    <p class="axis-label">
      {get_indicator_label(current_indicator.replace("_per_1k", ""))}
      {is_indicator_per_capita(current_indicator) ? "per 10,000 residents" : ""}
      {is_indicator_per_sq_mile(current_indicator)
        ? "per 1,000 square miles"
        : ""}
      {data_level == "county_urban" ? "for" : "by"}
      {data_level == "county_urban" ? "counties in urban areas" : data_level}
    </p>
  </div>
</div>

<style>
  /* .quantile-charts--wrapper { */
  /*   display: flex; */
  /*   flex-direction: row; */
  /*   flex-wrap: wrap; */
  /* } */
  .quantile--meta-wrapper p {
    font-size: var(--font-size-small);
  }
  .quantile-charts--item {
    margin-right: var(--spacing-6);
    margin-bottom: var(--spacing-6);
  }
  .quantile-charts--funding-text {
    font-size: var(--font-size-normal);
    margin-bottom: var(--spacing-6);
  }
  @media (min-width: 768px) {
    .quantile--wrapper {
      display: flex;
      column-gap: var(--spacing-12);
      justify-content: flex-start;
    }
    .quantile-charts--wrapper {
      width: 66.66%;
      max-width: 750px;
    }
    .quantile--meta-wrapper {
      width: 33.33%;
    }
  }
</style>
