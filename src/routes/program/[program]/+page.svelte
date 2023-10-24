<script>
  // layout helpers
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutColumn from "$components/LayoutColumn.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import TextBlocks from "$components/common/TextBlocks.svelte";

  // page components
  import SubNav from "$components/SubNav.svelte";
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
  import { base } from "$app/paths";
  import site_content from "$data/site_content.json";
  import program_language from "$data/program_language.json";
  import { format_text_template, slugify_program, get_site_url, get_program_name } from "$lib/utils.js";
  import { page } from "$app/stores";


  import { content } from "$stores/site_content.js";
  /** @type {import('./$types').PageData} */
  export let data;
  $: program_language_vars = program_language.find(({ program_short_name }) => program_short_name === data.detail.short_name);
  $: program_link_url = new URL(program_language_vars.website);

  // one program edge case to handle differently
  $: is_nuclear_page = $page.params.program == "doe-nuclear";

  // normalize formula competitive strings
  $: formula_comp_normalized = data.detail.formula_competitive.toLowerCase().includes("formula") ? "formula" : "competitive";

</script>

<Meta
  title={format_text_template(site_content.meta.title_program, { program: program_language_vars.program_name })}
  description={format_text_template(site_content.meta.description_program, { program: program_language_vars.program_name })}
  url={get_site_url(`program/${slugify_program(data.detail.short_name)}`)}
/>
<SearchNavBar
  label="Search for a type of infrastructure, a federal program, or a geography."
/>
<SubNav page_type="Program overview" page_name={program_language_vars.program_name} />
<div class="layout-container--article-width">
  <LayoutSection layout="col-2">
    <LayoutColumn>
      <LayoutBlock>
        <PageBreadcrumbs page_type="program overview" crumbs={[{label: program_language_vars.program_name, url: `${base}/program/${slugify_program(data.detail.short_name)}`}]} />
        <h1 class="overview-page--page-title">{program_language_vars.program_name}</h1>
        <p class="detail-page--text">
          <strong class="detail-page--label">Funding source: </strong>
          {data.detail.type}
        </p>
        <p class="detail-page--text">
          <strong class="detail-page--label">Department: </strong>
          {data.detail.agency_name}
        </p>
        <p class="page-description">{@html format_text_template(site_content.program_pages.about_text, program_language_vars)}</p>
        {#if is_nuclear_page}
        <p class="page-description">
          <strong class="detail-page--label">Note: </strong>
          The Civil Nuclear Credit Program administered only one award in FY22
        </p>
        {/if}
        <p class="detail-page--text">
          <strong class="detail-page--label">Learn more: </strong>
          <a href={program_link_url.href} target="_blank">{program_link_url.hostname}</a>
        </p>
      </LayoutBlock>
      <div class="section-label"><p>Geographic Share</p></div>
      <div class="spacing"></div>
      <LayoutBlock>
        <!-- <div class="section-label"><p>Funding distributions</p></div> -->
        <h2 class="module-subhead">
          {site_content.program_pages.map_beeswarm.header}
        </h2>
        <FundingMap
          data_layer={data.state_data}
          map_level="state"
          program_state={data.detail.short_name}
          program_select={false}
        />
      </LayoutBlock>
      <div class="section-break">
          <div class="section-line"></div>
      </div>
      {#if !is_nuclear_page}
      <LayoutBlock>
        <h4>{site_content.program_pages.map_beeswarm.subhead_beeswarm}</h4>
        <Beeswarm
          data={data.state_data}
          x_key={"funding_per_1k"}
          height={200}
        />
      </LayoutBlock>
      {/if}
    </LayoutColumn>
    <LayoutColumn>
      <LayoutBlock>
        <div class="section-label"><p>Total funding amount in FY 2022</p></div>
        <div class="spacing"></div>
        {#if data.detail.total_funding}
          <h2 class="program--funding-number">
            {data.detail.total_funding.toLocaleString("en", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })}
          </h2>
        {/if}
      </LayoutBlock>
      <LayoutBlock>
        <div class="section-label"><p>Funding mechanism</p></div>
        <div class="spacing"></div>
        <FundingMechanism mechanism={formula_comp_normalized} />
      </LayoutBlock>
      {#if !is_nuclear_page}
      <LayoutBlock>
        <div class="section-label"><p>Equity measures</p></div>
        <div class="spacing"></div>
        <h2 class="module-subhead">How equitably were funds distributed?</h2>
        <div class="detail-page--text">
        <TextBlocks blocks={site_content.program_pages.equity_scores.about_text}></TextBlocks>
        </div>
        <ProgramEquityScores equity_scores={data.equity_scores} variability_scores={data.variability_scores} program={data.detail.short_name}/>
      </LayoutBlock>
      {/if}
    </LayoutColumn>
  </LayoutSection>
  {#if !is_nuclear_page}
  <LayoutSection layout="col-1">
    <div class="section-break">
        <div class="section-label"><p>Community comparison</p></div>
        <div class="section-line"></div>
    </div>
    <LayoutBlock>
      <ProgramQuantiles
        t_test_data={data.t_test_data}
        quantile_funding={data.quantile_funding} />
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
