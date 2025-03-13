<script>
  // layout helpers
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutColumn from "$components/LayoutColumn.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import TextBlocks from "$components/common/TextBlocks.svelte";

  // page components
  import SubNav from "$components/SubNav.svelte";
  import { LoadingWrapper } from "@urbaninstitute/dataviz-components";
  import PageBreadcrumbs from "$components/PageBreadcrumbs.svelte";
  import FundingMap from "$components/FundingMap.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import FundingMechanism from "$components/FundingMechanism.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import Meta from "$components/Meta.svelte";
  import ProgramEquityScores from "$components/ProgramEquityScores.svelte";
  import Beeswarm from "$components/Beeswarm.svelte";
  import ProgramQuantiles from "$components/ProgramQuantiles.svelte";
  import DropdownSimple from "$components/DropdownSimple.svelte";
  import { base } from "$app/paths";
  import site_content from "$data/site_content.aml";
  import program_language from "$data/program_language.json";
  import { get_funding_data } from "$stores/funding_data.js";
  import {
    format_text_template,
    slugify_program,
    get_site_url,
    get_program_name,
  } from "$lib/utils.js";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  import { content } from "$stores/site_content.js";
  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {"state" | "county" | "cbsa"} */
  let map_level = "state";

  /** @type {"state" | "county" | "cbsa"} */
  let beeswarm_level = "state";

  /** @type {"2022" | "2023"} */
  let funding_year;

  // should the community characteristic dropdown be set to a different default?
  let comm_charateristic_default = undefined;

  $: program_language_vars = program_language.find(
    ({ program_short_name }) => program_short_name === data.short_name
  );
  $: program_link_url =
    program_language_vars && program_language_vars.website !== "TK"
      ? new URL(program_language_vars.website)
      : null;

  // one program edge case to handle differently
  $: is_nuclear_page = $page.params.program == "doe-nuclear";

  // normalize formula competitive strings
  $: formula_comp_normalized = "";

  $: map_program_data = browser
    ? get_funding_data(data.short_name, map_level)
    : new Promise(() => {});
  $: beeswarm_program_data = browser
    ? get_funding_data(data.short_name, beeswarm_level)
    : new Promise(() => {});

  $: funding_years = get_funding_years(data);
  $: current_funding_amount = data[`fy_${funding_year}_funding`];
  $: if (!current_funding_amount && funding_years.length > 0) {
    funding_year = funding_years[0].value;
    current_funding_amount = data[`fy_${funding_year}_funding`];
  }

  // temporary hotfix for description with missing [uses] variable
  function get_program_description(template, program_vars) {
    let description = format_text_template(template, program_vars);
    if (!program_vars.uses) {
      description = description.replace("The money can go toward [uses].", "");
    }
    return description;
  }

  function get_recent_funding(program_data) {
    if (program_data.iija_flag === 1 && program_data.ira_flag === 1) {
      return site_content.program_pages.funding.recent_both;
    }
    if (program_data.iija_flag === 1) {
      return site_content.program_pages.funding.recent_iija;
    }
    if (program_data.ira_flag === 1) {
      return site_content.program_pages.funding.recent_ira;
    }
    return format_text_template(
      site_content.program_pages.funding.recent_none,
      { year: funding_year }
    );
  }

  function get_funding_years(program_data) {
    const possible_years = ["2023", "2022"];
    return possible_years
      .map((year) => {
        return {
          value: year,
          label: `FY${year.substring(2)}`,
          amount: program_data[`fy_${year}_funding`],
          disabled: false,
        };
      })
      .filter((year) => year.amount);
  }

  /**
   * @param {number} input_num
   * @returns {string | null}
   */
  function format_dollars(input_num) {
    if (!input_num) {
      return null;
    }
    return input_num.toLocaleString("en", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  /**
   * @param { string } level
   * @returns { string }
   */
  function format_level(level) {
    if (level === "cbsa") {
      return "CBSA";
    }
    return level;
  }

  onMount(() => {
    if ($page.url.searchParams.has("cc_option")) {
      comm_charateristic_default = $page.url.searchParams.get("cc_option");
    }
  });
</script>

<Meta
  title={format_text_template(site_content.meta.title_program, {
    program: program_language_vars.program_name,
  })}
  description={format_text_template(site_content.meta.description_program, {
    program: program_language_vars.program_name,
  })}
  url={get_site_url(`program/${slugify_program(data.short_name)}`)}
/>
<SearchNavBar
  label="Search for a type of infrastructure, a federal program, or a geography."
/>
<SubNav
  page_type="Program overview"
  page_name={program_language_vars.program_name}
/>
<div class="layout-container--article-width">
  <LayoutSection layout="col-2">
    <LayoutColumn>
      <LayoutBlock>
        <PageBreadcrumbs
          page_type="program overview"
          crumbs={[
            {
              label: program_language_vars.program_name,
              url: `${base}/program/${slugify_program(data.short_name)}`,
            },
          ]}
        />
        <h1 class="overview-page--page-title">
          {program_language_vars.program_name}
        </h1>
        <!-- <p class="detail-page--text"> -->
        <!--   <strong class="detail-page--label">Funding source: </strong> -->
        <!--   {data.type} -->
        <!-- </p> -->
        <p class="detail-page--text">
          {data.agency_name}
        </p>
        <p class="page-description">
          {@html get_program_description(
            site_content.program_pages.about_text,
            Object.assign({}, program_language_vars, {
              website_text: program_link_url?.hostname,
              website_url: program_link_url?.href,
            })
          )}
        </p>
        {#if is_nuclear_page}
          <p class="page-description">
            <strong class="detail-page--label">Note: </strong>
            The Civil Nuclear Credit Program administered only one award in FY22
          </p>
        {/if}
      </LayoutBlock>
      <div class="section-label"><p>Geographic Share</p></div>
      <div class="spacing" />
      <LayoutBlock>
        <!-- <div class="section-label"><p>Funding distributions</p></div> -->
        <h2 class="module-subhead">
          {site_content.program_pages.map_beeswarm.header}
        </h2>
        {#await map_program_data}
          <LoadingWrapper>
            <div class="loading-block" style="height: 500px;" />
          </LoadingWrapper>
        {:then map_data}
          <FundingMap
            data_layer={Array.from(map_data.values())}
            selected_program={data.short_name}
            bind:map_level
            show_program_link={false}
            show_geo_toggle={data.county_level === 1}
            program_state={data.short_name}
            program_select={false}
          />
        {/await}
      </LayoutBlock>
      <div class="section-break">
        <div class="section-line" />
      </div>
      {#if !is_nuclear_page}
        <LayoutBlock>
          <h4>
            {format_text_template(
              site_content.program_pages.map_beeswarm.subhead_beeswarm,
              { geo_level: format_level(beeswarm_level) }
            )}
          </h4>
          {#if data.county_level === 1}
            <div class="geo-toggle">
              <button
                class="geo-toggle-button"
                class:active={beeswarm_level == "state"}
                on:click={() => (beeswarm_level = "state")}
              >
                States
              </button>
              <button
                class="geo-toggle-button"
                class:active={beeswarm_level == "cbsa"}
                on:click={() => (beeswarm_level = "cbsa")}
              >
                CBSAs
              </button>
            </div>
          {/if}
          {#await beeswarm_program_data}
            <LoadingWrapper>
              <div class="loading-block" style="height: 200px;" />
            </LoadingWrapper>
          {:then beeswarm_data}
            <Beeswarm
              data={Array.from(beeswarm_data.values())}
              data_level={beeswarm_level}
              x_key={"funding_per_1k"}
              height={beeswarm_level === "state" ? 200 : 375}
              r={beeswarm_level === "state" ? 6 : 4}
              left_margin={beeswarm_level === "state" ? 80 : 80}
            />
          {/await}
        </LayoutBlock>
      {/if}
    </LayoutColumn>
    <LayoutColumn>
      <LayoutBlock>
        <div class="funding-label-group">
          <div class="section-label">
            <p>{site_content.program_pages.funding.total_label}</p>
          </div>
          {#if funding_years.length > 1}
            <DropdownSimple
              options={funding_years}
              bind:current_value={funding_year}
            />
          {:else}
            <div class="section-label">
              <p>FY {funding_year}</p>
            </div>
          {/if}
        </div>
        <div class="spacing" />
        {#if current_funding_amount}
          <h2 class="program--funding-number">
            {format_dollars(current_funding_amount)}
          </h2>
        {/if}
      </LayoutBlock>
      {#if data.iija_flag === 1 || data.ira_flag === 1}
        <LayoutBlock>
          <div class="section-label"><p>Recent funding</p></div>
          <div class="spacing" />
          <ul class="recent-funding-list">
          {#if data.iija_flag === 1}
            <li>{site_content.program_pages.funding.recent_iija}</li>
          {/if}
          {#if data.ira_flag === 1}
            <li>{site_content.program_pages.funding.recent_ira}</li>
          {/if}
          </ul>
        </LayoutBlock>
      {/if}
      <LayoutBlock>
        <div class="section-label">
          <p>{site_content.program_pages.funding.type_label}</p>
        </div>
        <div class="spacing" />
        <FundingMechanism
          mechanism={data.competitive === 1 ? "competitive" : "formula"}
        />
      </LayoutBlock>
      {#if !is_nuclear_page}
        <LayoutBlock>
          <div class="section-label"><p>Equity measures</p></div>
          <div class="spacing" />
          <h2 class="module-subhead">How equitably were funds distributed?</h2>
          <div class="detail-page--text equity-text">
            <TextBlocks
              blocks={site_content.program_pages.equity_scores.about_text}
            />
          </div>
          <ProgramEquityScores
            equity_scores={data.equity_scores}
            program={data.short_name}
          />
        </LayoutBlock>
      {/if}
    </LayoutColumn>
  </LayoutSection>
  {#if !is_nuclear_page}
    <LayoutSection layout="col-1" id="community-comparison">
      <div class="section-break">
        <div class="section-label"><p>Community comparison</p></div>
        <div class="section-line" />
      </div>
      <LayoutBlock>
        <ProgramQuantiles
          t_test_data={data.t_test_data}
          quantile_funding={data.quantile_funding}
          default_indicator={comm_charateristic_default}
        />
      </LayoutBlock>
    </LayoutSection>
  {/if}
  <section class="section--page-footer">
    <About content={site_content.about} />
  </section>
  <section>
    <Credits content={site_content.credits} />
  </section>
</div>

<style>
  .equity-text {
    margin-bottom: var(--spacing-8) !important;
  }
  .recent-funding-list {
    list-style: none;
    padding: 0;
  }
  .recent-funding-list li{
    margin-bottom: var(--spacing-2);
  }
</style>
