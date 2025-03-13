<script>
  import Select from "$components/Select.svelte";
  import EquityTable from "$components/EquityTable.svelte";
  import HelpTip from "$components/HelpTip.svelte";
  import { ToggleGroup } from "$components/Toggle";
  import { get_indicator_label } from "$lib/utils.js";
  import site_content from "$data/site_content.aml";
  import { logClickToGA } from "$lib/analytics";

  $: metric_options =
    site_content.program_pages.equity_scores.equity_scores_dropdown.options;
  export let equity_scores = [];
  export let program = "";

  let current_metric = "concentration";

  const level_options = [
    { label: "County data", value: "county" },
    { label: "State data", value: "state" },
    { label: "CBSA data", value: "cbsa" },
  ];
  /** @type {"state" | "county" | "cbsa"} */
  let current_level = "state";
  // const set_options = [
  //   { label: "All jurisdictions", value: "all" },
  //   { label: "Funded jurisdictions", value: "funded" },
  // ];

  $: distribution_scores = equity_scores.filter(
    (score_data) =>
      score_data.metric == "distribution" &&
      !score_data.indicator.includes("share_us_pop")
  );

  /** @type {"all" | "funded"} */
  // let current_set = "all";

  // $: if (current_metric !== "high_need") {
  //   current_set = "all";
  // }
  $: county_scores = equity_scores.filter((score_data) => {
    return score_data.level == "county";
  });
  $: has_county_data = county_scores.length > 0;
  $: if (has_county_data) {
    set_county();
  } else {
    set_state();
  }
  $: filtered_scores = equity_scores.filter((score_data) => {
    return (
      score_data.score !== null &&
      score_data.metric == current_metric &&
      (score_data.level == current_level || current_metric == "distribution")
    );
  });

  $: clean_scores = filtered_scores
    .map((score_data) => {
      return {
        indicator:
          score_data.indicator == "variability"
            ? "Variability"
            : get_indicator_label(score_data.indicator),
        score: score_data.score,
      };
    })
    .filter((score_data) => !score_data.indicator.includes("share_us_pop")); // filter out population data

  $: score_help_text =
    site_content.program_pages.equity_scores[`${current_metric}_help_text`];

  // a little hack to toggle the current geography level without making it a reactive dependency
  function set_county() {
    current_level = "county";
  }
  function set_state() {
    current_level = "state";
  }
</script>

<p class="equity--label">
  {site_content.program_pages.equity_scores.equity_scores_dropdown.label}
</p>
<div class="equity--select">
  <div class="equity--group">
    <Select
      items={metric_options}
      bind:value={current_metric}
      searchable={false}
      on:change={(e) => {
        logClickToGA(
          e.target,
          "program-equity-metric-select--" + current_metric
        );
      }}
    />
    {#if current_metric === "concentration"}
      <HelpTip text={score_help_text} />
    {/if}
  </div>
</div>
{#if county_scores.length > 0 && current_metric == "concentration"}
  <hr class="equity--rule" />
  <p class="equity--label">Data level</p>
  <ToggleGroup
    options={level_options}
    bind:value={current_level}
    on:change={(e) => {
      logClickToGA(
        e.detail.target,
        "program-equity-data-level-toggle--" + current_level
      );
    }}
  />
{/if}
<div class="spacing" />
{#if current_metric == "distribution"}
  <EquityTable
    data={clean_scores}
    viz_domain={[0, 8]}
    score_type={current_metric}
    limit_height
    show_viz={false}
    geography_level={current_level}
    use_tooltips
  />
{:else if current_metric == "concentration"}
  <EquityTable
    data={clean_scores}
    viz_domain={[-1, 3]}
    score_type={current_metric}
    geography_level={current_level}
    use_tooltips
  />
{:else}
  <EquityTable
    data={clean_scores}
    score_type={current_metric}
    geography_level={current_level}
  />
{/if}

<style>
  .equity--select {
    width: 100%;
    margin-bottom: var(--spacing-4);
  }
  .equity--label {
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    margin-bottom: var(--spacing-2);
    display: flex;
    align-items: center;
  }
  .equity--rule {
    border: none;
    border-top: 1px solid var(--color-gray);
    appearance: none;
    background: none;
    margin: var(--spacing-4) 0;
  }
  .equity--group {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
