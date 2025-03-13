<script>
  // svelte utilities
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { base } from "$app/paths";

  // layout components
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import LayoutColumn from "$components/LayoutColumn.svelte";

  // furniture components
  import SubNav from "$components/SubNav.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import PageBreadcrumbs from "$components/PageBreadcrumbs.svelte";
  import Meta from "$components/Meta.svelte";
  import Credits from "$components/Credits.svelte";
  import About from "$components/About.svelte";

  // page components
  import FundingMap from "$components/FundingMap.svelte";
  import ProgramFundingTables from "$components/ProgramFundingTables.svelte";
  import Beeswarm from "$components/Beeswarm.svelte";
  import BarbellCompare from "$components/BarbellCompare.svelte";
  import ProgramSelect from "$components/ProgramSelect.svelte";
  import EquityTable from "$components/EquityTable.svelte";

  // content and data
  import site_content from "$data/site_content.aml";
  import { program_list } from "$stores/programs.js";
  import {
    get_equity_scores_by_program,
    format_text_template,
    get_indicator_label,
    get_site_url,
  } from "$lib/utils";
  import { get_funding_data } from "$stores/funding_data";
  import { logClickToGA } from "$lib/analytics";

  const default_program = "fhwa_nhpp";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {string | null} */
  let program_state = default_program;

  // current program for map data, defaults to program_state, binds to map component
  // reactively responds to program_state updates onMount
  $: map_program = program_state;

  // current program for beeswarm data, defaults to program_state, binds to beeswarm component
  // reactively responds to program_state updates onMount
  $: beeswarm_program = program_state;

  // current program for equity score data, defaults to program_state, binds to equity score component
  // reactively responds to program_state updates onMount
  $: equity_score_program = program_state ? program_state : default_program;

  // holds the equity scores for the selected program
  $: selected_equity_scores = get_equity_scores_by_program(
    equity_score_program,
    data.equity_scores
  );

  // when map_program updates (in the browser context only), fetch funding data to display in the map
  $: map_program_data =
    browser && map_program
      ? get_funding_data(map_program, "state")
      : new Promise(() => {});

  // when beeswarm_program updates (in the browser context only), fetch funding data to display in the beeswarm
  $: beeswarm_program_data =
    browser && beeswarm_program
      ? get_funding_data(beeswarm_program, "state")
      : new Promise(() => {});

  $: equity_table_data = selected_equity_scores
    .filter(({ score }) => score !== null)
    .map(({ indicator, score }) => ({
      indicator: get_indicator_label(indicator),
      score: Math.round(parseFloat(score) * 100) / 100,
    }));

  onMount(async () => {
    if ($page.url.searchParams.has("program")) {
      program_state = $page.url.searchParams.get("program");
    }
  });
</script>

<Meta
  title={format_text_template(site_content.meta.title_geography, {
    geography: data.detail.name,
  })}
  description={format_text_template(site_content.meta.description_geography, {
    geography: data.detail.name,
  })}
  url={get_site_url(`state/${data.detail.fips}`)}
/>
<SearchNavBar
  label="Search for a type of infrastructure, a federal program, or a geography."
/>
<SubNav page_type="State overview" page_name={data.detail.name} />
<div class="layout-container--article-width page--content">
  <LayoutSection layout="col-2">
    <LayoutColumn>
      <LayoutBlock>
        <PageBreadcrumbs
          page_type="state overview"
          crumbs={[
            {
              label: data.detail.name,
              url: `${base}/state/${data.detail.fips}`,
            },
          ]}
        />
        <h1 class="overview-page--page-title">{data.detail.name}</h1>
        <p class="page-description">
          {format_text_template(site_content.geography_pages.state_about_text, {
            state: data.detail.name,
          })}
        </p>
      </LayoutBlock>
      <LayoutBlock>
        <!-- <div class="section-label"><p>Total funding amount</p></div> -->
        <ProgramFundingTables data={data.funding} />
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
          <pre>map loading...</pre>
        {:then funding_data}
          <FundingMap
            data_layer={Array.from(funding_data).map(([fips, d]) => d)}
            map_level="state"
            bind:selected_program={map_program}
            highlight_fips={data.detail.fips}
            {program_state}
            programs={$program_list}
          />
        {/await}
      </LayoutBlock>
      <div class="section-break">
        <div class="section-line" />
      </div>
      <LayoutBlock>
        <h4>
          {format_text_template(
            site_content.geography_pages.map_beeswarm.subhead_beeswarm,
            { "geo_type": "state" }
          )}
        </h4>
        <ProgramSelect
          programs={$program_list}
          bind:value={beeswarm_program}
          on:change={(e) => {
            logClickToGA(
              e.target,
              "program-select-state-beeswarm--" + beeswarm_program
            );
          }}
        />
        <!-- <div class="placeholder-box">Coming Soon!</div> -->
        {#await beeswarm_program_data}
          <pre>data loading...</pre>
        {:then funding_data}
          <Beeswarm
            data={Array.from(funding_data).map(([fips, d]) => d)}
            data_level="state"
            x_key="funding_per_1k"
            highlight_name={data.detail.name}
            highlight_fips={data.detail.fips}
            height={250}
          />
        {/await}
      </LayoutBlock>
    </LayoutColumn>
  </LayoutSection>
  <LayoutSection layout="col-1">
    <LayoutBlock>
      <div class="section-break">
        <div class="section-label"><p>Equity scores</p></div>
        <div class="section-line" />
      </div>
      <div class="multi-column-1-2">
        <div>
          <h2 class="module-subhead">
            {site_content.geography_pages.equity_scores.header}
          </h2>
          <p class="detail-page--text">
            {site_content.geography_pages.equity_scores.about_text}
          </p>
          <div class="equity-score-search">
            <ProgramSelect
              programs={$program_list}
              bind:value={equity_score_program}
              on:change={(e) => {
                logClickToGA(
                  e.target,
                  "program-select-state-equity--" + equity_score_program
                );
              }}
            />
          </div>
        </div>
        <div class="equity-score-data-wrap">
          {#if selected_equity_scores.length > 0}
            <EquityTable
              data={equity_table_data}
              use_tooltips
              tooltip_type="state"
              location_name={data.detail.name}
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
    </LayoutBlock>
  </LayoutSection>
  {#if browser}
    <LayoutSection layout="col-1">
      <div class="section-break">
        <div class="section-label"><p>Funding by program</p></div>
        <div class="section-line" />
      </div>
      <BarbellCompare
        data_level="state"
        current_location={data.detail.name}
        program_funding={data.funding}
        comparison_buckets={[
          { bucket: "All States", funding_medians: data.state_funding_medians },
        ]}
      />
    </LayoutSection>
  {/if}
  <section class="section--page-footer">
    <About content={site_content.about} />
  </section>
  <section>
    <Credits content={site_content.credits} />
  </section>
</div>
