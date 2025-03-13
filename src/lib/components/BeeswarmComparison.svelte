<script>
  import { browser } from "$app/environment";
  import CompareSwitch from "./CompareSwitch.svelte";
  import Beeswarm from "$components/Beeswarm.svelte";
  import ProgramSelect from "$components/ProgramSelect.svelte";
  import { get_bucket_label } from "$lib/utils";
  import { program_list } from "$stores/programs.js";
  import { logClickToGA } from "$lib/analytics.js";

  /** @type {{ bucket: string, fips_list: string[], funding_medians: Map<string, number> }[]} */
  export let comparison_buckets;
  /** @type {Map<string, Record<string, number>>} */
  export let funding_data;

  /** @type {string} **/
  export let highlight_fips;

  /** @type {string} **/
  export let highlight_name;

  /** @type {string | undefined} **/
  export let program_state;

  export let selected_program = "cdbg_entitlement";

  /** @type { "county" | "state" | "cbsa" } */
  export let geo_type = "county";

  // optional list of programs to filter the search list
  /** @type {string[]} */
  export let available_programs;

  let comparison_bucket = geo_type == "county" ? "state_bucket" : "percent_poc_bucket";
  $: comparison_bucket_data = comparison_buckets.find(
    (bucket) => bucket.bucket === comparison_bucket
  );
  $: comparison_counties = comparison_bucket_data
    ? comparison_bucket_data.fips_list.map((fips) => ({
        fips: fips,
        ...(funding_data ? funding_data.get(fips) : {}),
      }))
    : [];

  $: bucket_options = comparison_buckets.map((bucket) => ({
    value: bucket.bucket,
    label: get_bucket_label(bucket.bucket, geo_type),
  }));

  $: x_key = `funding_per_1k`;

  $: programs_for_search = $program_list.filter((program) =>
    available_programs.includes(program.short_name)
  );
  $: has_data = available_programs.includes(selected_program);
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
          logClickToGA(
            e.target,
            "program-select-beeswarm--" + selected_program
          );
        }}
        programs={programs_for_search}
        bind:value={selected_program}
      />
    {/if}
    <Beeswarm
      data={comparison_counties}
      data_level={geo_type}
      {x_key}
      {highlight_fips}
      {highlight_name}
    />
    <CompareSwitch options={bucket_options} bind:value={comparison_bucket} />
  {/if}
</div>

<style>
</style>
