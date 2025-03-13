<script>
  // svelte stuff
  import { base } from "$app/paths";
  import { browser } from "$app/environment";

  // helpers
  import {
    format_text_template,
    get_equity_scores_by_program,
    get_indicator_label,
  } from "$lib/utils";

  // stores
  import { program_list } from "$stores/programs.js";

  // components
  import FundingMap from "$components/FundingMap.svelte";
  import ProgramFundingTables from "$components/ProgramFundingTables.svelte";
  import BeeswarmComparison from "$components/BeeswarmComparison.svelte";
  import BarbellCompare from "$components/BarbellCompare.svelte";
  import EquityTable from "$components/EquityTable.svelte";
  import CountyIndicator from "$components/CountyIndicator.svelte";
  import PageBreadcrumbs from "$components/PageBreadcrumbs.svelte";
  import ProgramSelect from "$components/ProgramSelect.svelte";
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import LayoutColumn from "$components/LayoutColumn.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import site_content from "$data/site_content.aml";
  import { logClickToGA } from "$lib/analytics";

  export let program_funding;

  /** @type {Promise<Map<string, any>>} */
  export let map_program_data;

  /** @type {Promise<Map<string, any>>} */
  export let beeswarm_program_data;

  /** @type {{bucket: string, fips_list: any, funding_medians: Map<any, any>}} */
  export let comparison_buckets;

  /** @type { string | null } */
  export let map_program;

  /** @type { string | null } */
  export let beeswarm_program;

  /** @type { string | null } */
  export let equity_score_program;

  /** @type { "county" | "cbsa" | "state"} */
  export let geo_type;

  $: geo_type_text = geo_type === "county" ? "county" : geo_type === "cbsa" ? "CBSA" : "state";

  /**
   * @param {boolean} persistent_poverty
   * @param {boolean} disadvantaged
   * @returns {string}
   **/
  function get_priority_help_text(persistent_poverty, disadvantaged) {
    if (persistent_poverty && disadvantaged) {
      return site_content.geography_pages.priority_both_tooltip;
    }
    if (persistent_poverty) {
      return site_content.geography_pages.pp_tooltip;
    }
    if (disadvantaged) {
      return site_content.geography_pages.priority_disadvantaged_tooltip;
    }
    return "";
  }

  $: selected_equity_scores = get_equity_scores_by_program(
    equity_score_program,
    program_funding.equity_scores
  );
  $: equity_table_data = selected_equity_scores
    .filter(({ score }) => score !== null)
    .map(({ indicator, score }) => ({
      indicator: get_indicator_label(indicator),
      score: parseFloat(score),
    }));
  $: available_programs = Object.keys(program_funding)
    .filter((key) => key.includes("_per_1k"))
    .map((key) => key.replace("_per_1k", ""));

  // Get applicable help text based on county data
  $: priority_help_text = get_priority_help_text(
    program_funding.persistent_poverty_county,
    program_funding.disadvantaged_county
  );
</script>

<div class="layout-container--article-width page--content">
  {#if program_funding.iija_total !== null && program_funding.hud_total !== null}
    {#if geo_type === "county"}
      <PageBreadcrumbs
        page_type="{geo_type} overview"
        crumbs={[
          {
            label: program_funding.state,
            url: `${base}/state/${program_funding.state_fips}`,
          },
          {
            label: program_funding.county,
            url: `${base}/county/${program_funding.fips}`,
          },
        ]}
      />
    {:else}
      <PageBreadcrumbs
        page_type="{geo_type} overview"
        crumbs={[
          {
            label: program_funding.name,
            url: `${base}/cbsa/${program_funding.fips}`,
          },
        ]}
      />
    {/if}
    <LayoutSection layout="col-2">
      <LayoutColumn>
        <LayoutBlock>
          <h1 class="overview-page--page-title">
            {program_funding.name}
          </h1>
          {#if geo_type === "county"}
            {#if program_funding.persistent_poverty_county || program_funding.disadvantaged_county}
              <CountyIndicator tip_text={priority_help_text}
                >{site_content.geography_pages.priority_label}</CountyIndicator
              >
            {/if}
          {/if}
          <p class="page-description">
            {#if geo_type === "county"}
              {format_text_template(
                site_content.geography_pages.county_about_text,
                { county: program_funding.name }
              )}
            {:else}
              {format_text_template(
                site_content.geography_pages.cbsa_about_text,
                { cbsa: program_funding.name }
              )}
            {/if}
          </p>
        </LayoutBlock>
        <LayoutBlock>
          <ProgramFundingTables data={program_funding} />
        </LayoutBlock>
      </LayoutColumn>
      <LayoutColumn>
        <div class="section-label"><p>Geographic Share</p></div>
        <div class="spacing" />
        <LayoutBlock>
          <h2 class="module-subhead">
            {site_content.geography_pages.map_beeswarm.header}
          </h2>
          {#await map_program_data}
            <pre>Loading...</pre>
          {:then map_data}
            <FundingMap
              highlight_fips={program_funding.fips}
              programs={$program_list.filter((program) =>
                available_programs.includes(program.short_name)
              )}
              bind:selected_program={map_program}
              data_layer={Array.from(map_data).map(([fips, d]) => d)}
              map_level={geo_type}
              show_counties={program_funding.state_fips}
            />
          {/await}
        </LayoutBlock>
        <div class="section-break">
          <div class="section-line" />
        </div>
        {#if browser}
          <LayoutBlock>
            <h4>
              {format_text_template(
                site_content.geography_pages.map_beeswarm.subhead_beeswarm,
                { geo_type: geo_type_text }
              )}
            </h4>
            {#await beeswarm_program_data then beeswarm_data}
              <BeeswarmComparison
                {comparison_buckets}
                bind:selected_program={beeswarm_program}
                funding_data={beeswarm_data}
                highlight_fips={program_funding.fips}
                highlight_name={program_funding.name}
                {available_programs}
                {geo_type}
                program_state={beeswarm_program}
              />
            {/await}
          </LayoutBlock>
        {/if}
      </LayoutColumn>
    </LayoutSection>
    {#if browser}
      <LayoutSection layout="col-1">
        <div class="section-break">
          <div class="section-label"><p>Equity scores</p></div>
          <div class="section-line" />
        </div>
        <LayoutBlock>
          <div class="multi-column-1-2">
            <div>
              <h2 class="module-subhead">
                {site_content.geography_pages.equity_scores.header}
              </h2>
              <p class="detail-page--text">
                {site_content.geography_pages.equity_scores.about_text}
              </p>
              <ProgramSelect
                programs={$program_list}
                on:change={(e) => {
                  logClickToGA(
                    e.target,
                    "program-select-county-equity--" + equity_score_program
                  );
                }}
                bind:value={equity_score_program}
              />
            </div>
            <div class="equity-score-search">
              <div class="equity-score-data-wrap">
                {#if selected_equity_scores.length > 0}
                  <EquityTable
                    data={equity_table_data}
                    use_tooltips
                    tooltip_type={geo_type}
                    location_name={program_funding.name}
                  />
                {:else if equity_score_program}
                  <div class="help-text">
                    <strong>Note:</strong> county-level data not available for selected
                    program.
                  </div>
                {:else}
                  <div class="equity-score-placeholder placeholder-box">
                    <p>No program selected. Search for one above.</p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </LayoutBlock>
      </LayoutSection>
    {/if}
    {#if browser}
      <LayoutSection layout="col-1">
        <div class="section-break">
          <div class="section-label"><p>Funding by program</p></div>
          <div class="section-line" />
        </div>
        <BarbellCompare
          {geo_type}
          current_location={program_funding.name}
          {program_funding}
          {comparison_buckets}
        />
      </LayoutSection>
    {/if}
    <section />
    <section class="section--page-footer">
      <About content={site_content.about} />
    </section>
    <section>
      <Credits content={site_content.credits} />
    </section>
  {/if}
</div>

<style>
  .equity-score-search {
    margin-bottom: var(--spacing-4);
  }
</style>
