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
  import site_content from "$data/site_content.json";
  import { program_list } from "$stores/programs.js";
  import {
    get_equity_scores_by_program,
    format_text_template,
    get_indicator_label,
    get_site_url,
  } from "$lib/utils";
  import { logClickToGA } from "$lib/analytics";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {string | null} */
  let program_state = "fhwa_nhpp";

  $: beeswarm_program = program_state ? program_state : "fhwa_nhpp";
  $: barbell_funding_data = Object.keys(
    data.state_funding_data.get(data.detail.fips)
  )
    .filter((key) => key.includes("_per_1k"))
    .reduce((funding_dict, key) => {
      funding_dict[key] = data.state_funding_data.get(data.detail.fips)[key];
      return funding_dict;
    }, {});

  $: equity_score_program = program_state ? program_state : "fhwa_nhpp";
  $: selected_equity_scores = get_equity_scores_by_program(
    equity_score_program,
    data.equity_scores
  );

  $: equity_table_data = selected_equity_scores
    .filter(({ score }) => score !== null)
    .map(({ indicator, score }) => ({
      indicator: get_indicator_label(indicator),
      score: Math.round(parseFloat(score) * 100) / 100,
    }));

  onMount(() => {
    program_state = $page.url.searchParams.get("program");
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
        <ProgramFundingTables
          data={data.state_funding_data.get(data.detail.fips)}
        />
      </LayoutBlock>
    </LayoutColumn>
    <LayoutColumn>
      <div class="section-label"><p>Geographic Share</p></div>
      <div class="spacing" />
      <LayoutBlock>
        <h2 class="module-subhead">
          {site_content.geography_pages.map_beeswarm.header}
        </h2>
        <FundingMap
          data_layer={Array.from(data.state_funding_data.values())}
          map_level="state"
          highlight_fips={data.detail.fips}
          {program_state}
          programs={$program_list}
        />
      </LayoutBlock>
      <div class="section-break">
        <div class="section-line" />
      </div>
      <LayoutBlock>
        <h4>
          {format_text_template(
            site_content.geography_pages.map_beeswarm.subhead_beeswarm,
            { "state/county": "state" }
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
        <Beeswarm
          data={Array.from(data.state_funding_data.values())}
          data_level="state"
          x_key="{beeswarm_program}_per_1k"
          highlight_name={data.detail.name}
          highlight_fips={data.detail.fips}
          height={250}
        />
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
            <EquityTable data={equity_table_data} />
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
        program_funding={barbell_funding_data}
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
