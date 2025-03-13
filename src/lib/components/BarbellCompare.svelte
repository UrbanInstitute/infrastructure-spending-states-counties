<script>
  import BarbellChart from "$components/BarbellChart.svelte";
  import CompareSwitch from "./CompareSwitch.svelte";
  import ProgramSelect from "$components/ProgramSelect.svelte";
  import Select from "$components/Select.svelte";
  import { ToggleButton } from "$components/Toggle";
  import {
    get_bucket_label,
    format_text_template,
    format_category_name,
  } from "$lib/utils.js";
  import { browser } from "$app/environment";
  import { max } from "d3-array";
  import { logClickToGA } from "$lib/analytics";
  import { program_list, program_map } from "$stores/programs.js";
  import site_content from "$data/site_content.aml";

  /** @type {Array<any>} */
  export let comparison_buckets;

  /** @type {Array<Record<string, number>>} */
  export let program_funding;

  /** @type {"county" | "state" | "cbsa"} */
  export let geo_type = "county";

  /** @type {string} */
  export let current_location = "";

  let comparison_bucket =
    geo_type === "county" ? "state_bucket" : "percent_poc_bucket";

  /** @type {string} */
  let program_filter = "";

  /** @type {string} */
  let category_filter = "";

  let funded_only = true;

  /** @typedef {{program: string, funding: number, median: number | null}} ProgramData */

  /**
   * Filter the program data by program or category
   * @param {ProgramData[]} program_data
   * @param {string} prog_filter
   * @param {string} cat_filter
   * @returns {ProgramData[]}
   */
  function get_filtered_program_data(program_data, prog_filter, cat_filter) {
    return program_data
      .filter(({ program }) => {
        const program_key = program.replace("_per_1k", "");
        if (program_filter) {
          return program_key.includes(prog_filter);
        } else if (cat_filter) {
          const program_categories = $program_map?.get(program_key)?.categories;
          if (!program_categories) {
            return false;
          }
          return program_categories.includes(cat_filter);
        } else {
          return true;
        }
      })
      .filter(
        (d) =>
          !["iija_total_per_1k", "hud_total_per_1k"].includes(d.program) &&
          d.funding > 0
      );
  }

  $: funding_max = max(program_funding_with_median, (d) =>
    Math.max(d.funding, d.median, d.median_funded)
  );

  // just the current bucket data
  $: comparison_bucket_data =
    comparison_buckets.length > 1
      ? comparison_buckets.find((bucket) => bucket.bucket === comparison_bucket)
      : comparison_buckets[0];

  // all of the program keys with funding > 0
  $: program_funding_keys = Object.keys(program_funding).filter(
    (key) => program_funding[key] > 0 && key.includes("per_1k")
  );

  // add medians from comparison buckets into program funding data
  $: program_funding_with_median = program_funding_keys.map((key) => ({
    program: key,
    funding: program_funding[key],
    median: comparison_bucket_data
      ? comparison_bucket_data.funding_medians.get(key)
      : null,
    median_funded: comparison_bucket_data
      ? comparison_bucket_data.funding_medians.get(key + "_funded")
      : null,
  }));

  // list of programs to display in the barbell visualization
  // filtered by any active program or category filters
  $: filtered_program_funding = get_filtered_program_data(
    program_funding_with_median,
    program_filter,
    category_filter
  );

  // a list of bucket options to toggle between
  $: bucket_options =
    comparison_buckets.length > 1
      ? comparison_buckets.map((bucket) => ({
          value: bucket.bucket,
          label: get_bucket_label(bucket.bucket, geo_type),
        }))
      : [];

  // a list of all the programs that actually have funding
  $: available_programs = program_funding_keys.map((key) =>
    key.replace("_per_1k", "")
  );

  // a list of programs that are searchable based on available_programs for ProgramSelect
  $: program_search_options = $program_list.filter(({ short_name }) =>
    available_programs.includes(short_name)
  );

  // a list of all the categories that are relevant for programs with funding
  $: category_list = Array.from(
    new Set(
      $program_list
        .filter(({ short_name }) => available_programs.includes(short_name))
        .flatMap(({ categories }) => categories)
    )
  ).sort();

  // format category list for select compopnent
  $: category_search_options = category_list.map((category) => ({
    value: category,
    label: format_category_name(category),
  }));

  $: geography_label =
    geo_type === "county"
      ? "Similar Counties"
      : geo_type === "cbsa"
      ? "Similar CBSAs"
      : "Other States";
  $: key_compare_label =
    geo_type === "county"
      ? "similar counties"
      : geo_type === "cbsa"
      ? "similar CBSAs"
      : "other states";
</script>

<div class="barbell-compare">
  <div class="barbell-compare--meta">
    <h2 class="module-subhead">
      {format_text_template(site_content.geography_pages.barbell_graph.header, {
        geography_label: geography_label,
      })}
    </h2>
    <p>{site_content.geography_pages.barbell_graph.about_text}</p>
    <div class="spacing" />
    {#if browser}
      <Select
        bind:value={category_filter}
        items={category_search_options}
        placeholder={"Filter by category"}
        on:change={(e) => {
          logClickToGA(
            e.target,
            "category-select-barbell--" + e.detail.detail.value
          );
        }}
        clearable
      />
      <div class="spacing" />
      <ProgramSelect
        bind:value={program_filter}
        clearable={true}
        on:change={(e) => {
          logClickToGA(
            e.target,
            "program-select-barbell--" + e.detail.detail.value
          );
        }}
        programs={program_search_options}
      />
      <div class="spacing" />
      <ToggleButton
        label={site_content.geography_pages.barbell_graph.toggle_text}
        value={"funded_only"}
        on:click={(e) => {
          funded_only = !funded_only;
          logClickToGA(
            e.target,
            "funded-toggle-barbell--" + (funded_only ? "funded-only" : "all")
          );
        }}
        bind:is_active={funded_only}
      />
      {#if comparison_buckets.length > 1}
        <div class="spacing" />
        <CompareSwitch
          options={bucket_options}
          bind:value={comparison_bucket}
        />
      {/if}
    {/if}
  </div>
  <div class="barbell-compare--chart">
    <BarbellChart
      {current_location}
      {key_compare_label}
      data={filtered_program_funding}
      x_max={funding_max}
      compare_key={funded_only ? "median_funded" : "median"}
    />
  </div>
</div>

<style>
  .barbell-compare--meta {
    margin-bottom: var(--spacing-8);
  }
  @media (min-width: 1024px) {
    .barbell-compare {
      display: flex;
    }
    .barbell-compare--meta {
      width: 33.33%;
    }
    .barbell-compare--chart {
      padding-left: var(--spacing-8);
      width: 66.66%;
    }
  }
</style>
