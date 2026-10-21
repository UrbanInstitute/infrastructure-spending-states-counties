<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @component
  The card body of the geography pages' "How Do Similar Areas Compare?" module:
  a horizontal legend, the funded-only toggle, the comparison table itself, and
  (sub-state geographies only) the comparison-group switch. Every funded
  category is shown; there is no category filter.

  The section `h2` and its description sit at page level in `LocationDetails`,
  outside the card — see `design/geography.png`.
 -->
<script>
  import BarbellChart from "$components/BarbellChart.svelte";
  import CompareSwitch from "./CompareSwitch.svelte";
  import { ToggleButton } from "$components/Toggle";
  import { get_bucket_label, geo_labels } from "$lib/utils.js";
  import { browser } from "$app/environment";
  import { max } from "d3-array";
  import { logClickToGA } from "$lib/analytics";
  import site_content from "$data/site_content.aml";

  /** @type {Array<any>} */
  export let comparison_buckets;

  /**
   * The place's `category_funding` block: `<category>_per_1k` keys and dollars.
   * @type {Record<string, any>}
   **/
  export let category_funding;

  /** @type {"county" | "state" | "cbsa"} */
  export let geo_type = "county";

  /** @type {string} */
  export let current_location = "";

  const content = site_content.geography_pages.barbell_graph;

  let comparison_bucket =
    comparison_buckets.length > 0 ? comparison_buckets[0].bucket : "";

  let funded_only = true;

  // The x scale's upper bound, computed across every row and both medians so
  // that flipping the funded-only toggle does not rescale the table.
  $: funding_max =
    max(category_funding_with_median, (d) =>
      Math.max(d.funding, d.median ?? 0, d.median_funded ?? 0)
    ) ?? 0;

  // just the current bucket data
  $: comparison_bucket_data =
    comparison_buckets.length > 1
      ? comparison_buckets.find((bucket) => bucket.bucket === comparison_bucket)
      : comparison_buckets[0];

  // all of the category keys with funding > 0
  $: category_funding_keys = Object.keys(category_funding).filter(
    (key) => category_funding[key] > 0 && key.includes("per_1k")
  );

  // add medians from comparison buckets into the category funding data
  $: category_funding_with_median = category_funding_keys.map((key) => ({
    category: key.replace("_per_1k", ""),
    funding: category_funding[key],
    median: comparison_bucket_data
      ? comparison_bucket_data.funding_medians.get(key) ?? null
      : null,
    median_funded: comparison_bucket_data
      ? comparison_bucket_data.funding_medians.get(key + "_funded") ?? null
      : null,
  }));

  // rows to display in the barbell table: every funded category
  $: funded_category_rows = category_funding_with_median.filter(
    (d) => d.funding > 0
  );

  // a list of bucket options to toggle between
  $: bucket_options =
    comparison_buckets.length > 1
      ? comparison_buckets.map((bucket) => ({
          value: bucket.bucket,
          label: get_bucket_label(bucket.bucket, geo_type),
        }))
      : [];

  $: key_compare_label = `similar ${geo_labels(geo_type).plural}`;
</script>

<div class="barbell-compare">
  <div class="barbell-compare--legend">
    <div class="legend-item">
      <span class="legend-swatch median" />
      <span class="legend-label">Median among {key_compare_label}</span>
    </div>
    <div class="legend-item">
      <span class="legend-swatch value" />
      <span class="legend-label">{current_location}</span>
    </div>
  </div>

  {#if browser}
    <div class="barbell-compare--controls">
      <div class="control">
        <ToggleButton
          label={content.toggle_text}
          on:click={(e) => {
            funded_only = !funded_only;
            logClickToGA(
              e.target,
              "funded-toggle-barbell--" + (funded_only ? "funded-only" : "all")
            );
          }}
          bind:is_active={funded_only}
        />
      </div>
    </div>
  {/if}

  <BarbellChart
    {current_location}
    {key_compare_label}
    data={funded_category_rows}
    x_max={funding_max}
    compare_key={funded_only ? "median_funded" : "median"}
  />

  <!-- Below the table, not up in the controls row: it names what the median
       column is measured against, so it reads as a caption on the result
       rather than another filter to set first. Only sub-state geographies have
       more than one bucket to move between. -->
  {#if browser && comparison_buckets.length > 1}
    <div class="control control--switch">
      <CompareSwitch options={bucket_options} bind:value={comparison_bucket} />
    </div>
  {/if}
</div>

<style>
  .barbell-compare--legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-2) var(--spacing-6);
    margin-block-end: var(--spacing-6);
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }
  .legend-swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .legend-swatch.median {
    background: var(--color-black);
  }
  .legend-swatch.value {
    background: var(--color-blue);
  }
  .legend-label {
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    line-height: 1;
  }
  .barbell-compare--controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-4);
    margin-block-end: var(--spacing-8);
  }
  .control {
    display: flex;
    justify-content: center;
  }
  /* Bucket labels run long ("Counties with a similar population share who are
     people of color"), so this control gets more room than the others. It sits
     under the table now, so it centres itself instead of riding the controls
     row's flex centring. */
  .control--switch {
    width: 100%;
    max-width: 420px;
    margin-inline: auto;
    margin-block-start: var(--spacing-6);
  }
  .control--switch :global(.compare-switch) {
    width: 100%;
  }
</style>
