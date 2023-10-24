<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { base } from "$app/paths";
  import { get_equity_scores_by_program, format_text_template, get_indicator_label, get_site_url } from "$lib/utils";
  import Tooltip from "$components/Tooltip.svelte";
  import { current_tooltip } from "$stores/tooltip";
  import FundingMap from "$components/FundingMap.svelte";
  import ProgramFundingTables from "$components/ProgramFundingTables.svelte";
  import BeeswarmComparison from "$components/BeeswarmComparison.svelte";
  import BarbellCompare from "$components/BarbellCompare.svelte";
  import EquityTable from "$components/EquityTable.svelte";
  import PageBreadcrumbs from "$components/PageBreadcrumbs.svelte";
  import SubNav from "$components/SubNav.svelte";
  import ProgramSelect from "$components/ProgramSelect.svelte";
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import LayoutColumn from "$components/LayoutColumn.svelte";
  import Meta from "$components/Meta.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import { program_list } from "$stores/programs.js";
  import site_content from "$data/site_content.json";
  import { logClickToGA } from "$lib/analytics";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {string | null} */
  let program_state = "cdbg_entitlement";

  // comparison buckets with actual funding data, not just FIPS codes
  $: comparison_funding_data = data.comparison_buckets.map(
    ({ bucket, counties }) => {
      return {
        bucket,
        counties: counties.map((county_fips) => ({
          fips: county_fips,
          ...data.county_funding_data.get(county_fips),
        })),
      };
    }
  );

  $: program_funding = data.county_funding_data.get(data.detail.fips);

  /** @type string | null **/
  $: equity_score_program = program_state;

  let equity_scores = {};

  /** @type {string | undefined} */
  let fetched_scores;

  $: selected_equity_scores = get_equity_scores_by_program(
    equity_score_program,
    equity_scores
  );

  $: equity_table_data = selected_equity_scores
    .filter(({ score }) => score !== null)
    .map(({ indicator, score }) => ({
      indicator: get_indicator_label(indicator),
      score:parseFloat(score),
    }));

  $: if (browser && data.detail.fips !== fetched_scores) {
    fetch(`${base}/api/county-equity-scores/${data.detail.fips}.json`)
      .then((res) => res.json())
      .then((equity_score_data) => {
        fetched_scores = data.detail.fips;
        equity_scores = equity_score_data;
      });
  }
  onMount(() => {
    if ($page.url.searchParams.has("program")) {
      program_state = $page.url.searchParams.get("program");
    }
  });
</script>

<Meta
  title={format_text_template(site_content.meta.title_geography, { geography: `${data.detail.county}, ${data.detail.state}` })}
  description={format_text_template(site_content.meta.description_geography, { geography: `${data.detail.county}, ${data.detail.state}` })}
  url={get_site_url(`county/${data.detail.fips}`)}
/>
<SearchNavBar
  label="Search for a type of infrastructure, a federal program, or a geography."
/>
<SubNav page_type="County Overview" page_name="{data.detail.county}, {data.detail.state}" />
<div class="layout-container--article-width page--content">
  {#if data.detail.iija_total !== null && data.detail.hud_total !== null}
    <PageBreadcrumbs
      page_type="county overview"
      crumbs={[{label: data.detail.state, url: `${base}/state/${data.detail.state_fips}`}, {label: data.detail.county, url: `${base}/county/${data.detail.fips}`}]}
    />
    <LayoutSection layout="col-2">
      <LayoutColumn>
        <LayoutBlock>
          <h1 class="overview-page--page-title">{data.detail.county}, {data.detail.state}</h1>
          <p class="page-description">{format_text_template(site_content.geography_pages.county_about_text, {county: `${data.detail.county}, ${data.detail.state}`})}</p>
        </LayoutBlock>
        <LayoutBlock>
          <ProgramFundingTables data={program_funding} />
        </LayoutBlock>
      </LayoutColumn>
      <LayoutColumn>
        {#if browser}
          <div class="section-label"><p>Geographic Share</p></div>
          <div class="spacing"></div>
          <LayoutBlock>
            <h2 class="module-subhead">{site_content.geography_pages.map_beeswarm.header}</h2>
            <FundingMap
              highlight_fips={data.detail.fips}
              programs={$program_list}
              {program_state}
              data_layer={comparison_funding_data.find(
                (b) => b.bucket === "across_the_state"
              ).counties}
              map_level="county"
              show_counties={data.detail.state_fips}
            />
          </LayoutBlock>
        {/if}
        <div class="section-break">
            <div class="section-line"></div>
        </div>
        {#if browser}
          <LayoutBlock>
            <h4 >
              {format_text_template(site_content.geography_pages.map_beeswarm.subhead_beeswarm, {"state/county": "county"})}
            </h4>
            <BeeswarmComparison
              comparison_buckets={data.comparison_buckets}
              county_funding_data={data.county_funding_data}
              highlight_fips={data.detail.fips}
              highlight_name={data.detail.county}
              {program_state}
            />
          </LayoutBlock>
        {/if}
      </LayoutColumn>
    </LayoutSection>
    {#if browser}
      <LayoutSection layout="col-1">
      <div class="section-break">
          <div class="section-label"><p>Equity scores</p></div>
          <div class="section-line"></div>
      </div>
        <LayoutBlock>
          <div class="multi-column-1-2">
            <div>
              <h2 class="module-subhead">{site_content.geography_pages.equity_scores.header}</h2>
              <p class="detail-page--text">{site_content.geography_pages.equity_scores.about_text}</p>
              <ProgramSelect
                programs={$program_list}
                on:change={(e) => {
                  logClickToGA(e.target, "program-select-county-equity--" + equity_score_program);
                }}
                bind:value={equity_score_program}
              />
            </div>
            <div class="equity-score-search">
              <div class="equity-score-data-wrap">
                {#if selected_equity_scores.length > 0}
                  <EquityTable data={equity_table_data}  />
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
            <div class="section-line"></div>
        </div>
        <BarbellCompare
          data_level="county"
          current_location={data.detail.county}
          {program_funding}
          comparison_buckets={data.comparison_buckets}
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
