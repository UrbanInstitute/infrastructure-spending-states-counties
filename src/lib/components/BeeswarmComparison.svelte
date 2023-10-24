<script>
  import { browser } from "$app/environment";
  import CompareSwitch from "./CompareSwitch.svelte";
  import Beeswarm from "$components/Beeswarm.svelte";
  import ProgramSelect from "$components/ProgramSelect.svelte";
  import { get_indicator_label } from "$lib/utils";
  import { program_list } from "$stores/programs.js";
  import { logClickToGA } from "$lib/analytics.js";

  /** @type {{ bucket: string, counties: string[], funding_medians: Map<string, number> }[]} */
  export let comparison_buckets;
  /** @type {Map<string, Record<string, number>>} */
  export let county_funding_data;

  /** @type {string} **/
  export let highlight_fips;

  /** @type {string} **/
  export let highlight_name;

  /** @type {string | undefined} **/
  export let program_state;

  export let data_level = "county";

  let comparison_bucket = "across_the_state";
  $: comparison_bucket_data = comparison_buckets.find(
    (bucket) => bucket.bucket === comparison_bucket
  );
  $: comparison_counties = comparison_bucket_data
    ? comparison_bucket_data.counties.map((county_fips) => ({
        fips: county_fips,
        ...(county_funding_data ? county_funding_data.get(county_fips) : {}),
      }))
    : [];

  $: bucket_options = comparison_buckets.map((bucket) => ({
    value: bucket.bucket,
    label: get_bucket_label(bucket.bucket),
  }));
  $: selected_program = program_state
    ? program_state
    : data_level == "county"
    ? "cdbg_entitlement"
    : "fhwa_nhpp";
  $: x_key = `${selected_program}_per_1k`;

  $: available_programs = Object.keys(
    Array.from(county_funding_data.values())[0]
  ).map((key) => key.replace("_per_1k", ""));
  $: programs_for_search = $program_list.filter((program) =>
    available_programs.includes(program.short_name)
  );
  $: has_data = available_programs.includes(selected_program);

  function get_bucket_label(bucket_name) {
    if (bucket_name == "across_the_state") {
      return "Other counties in the state";
    }
    let label = get_indicator_label(bucket_name.replace("_bucket", ""));
    return `Counties with a similar ${label.toLowerCase()}`;
  }
</script>

<div>
  {#if !has_data}
    <ProgramSelect
      programs={[
        ...programs_for_search,
        $program_list.find(({ short_name }) => short_name == selected_program),
      ]}
      on:change={(e) => {
        logClickToGA(e.target, "program-select-beeswarm--" + selected_program);
      }}
      bind:value={selected_program}
    />
    <div class="spacing" />
    <div class="help-text">
      <strong>Note:</strong> county-level data not available for selected program.
    </div>
  {:else}
    {#if browser}
      <ProgramSelect
        on:change={(e) => {
          logClickToGA(e.target, "program-select-beeswarm--" + selected_program);
        }}
        programs={programs_for_search}
        bind:value={selected_program}
      />
    {/if}
    <Beeswarm
      data={comparison_counties}
      {x_key}
      {highlight_fips}
      {highlight_name}
    />
    <CompareSwitch options={bucket_options} bind:value={comparison_bucket} />
  {/if}
</div>

<style>
</style>
