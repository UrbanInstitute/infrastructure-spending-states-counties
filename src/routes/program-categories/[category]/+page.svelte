<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { base } from "$app/paths";
  import { afterNavigate } from "$app/navigation";

  // layout helpers
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutHero from "$components/LayoutHero.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import MapSection from "$components/MapSection.svelte";

  // furniture components
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import Meta from "$components/Meta.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import Card from "$components/Card.svelte";
  import CategoryGrid from "$components/CategoryGrid.svelte";
  import Pillbox from "$components/Pillbox.svelte";

  // page components
  import FundingMap from "$components/FundingMap.svelte";
  import ProgramQuantiles from "$components/ProgramQuantiles.svelte";
  import LinkTable from "$components/LinkTable.svelte";
  import ConcentrationScoresSection from "$components/ConcentrationScoresSection.svelte";

  // data and content
  import site_content from "$data/site_content.aml";
  import category_language from "$data/category_language.json";
  import {
    slugify_program,
    dollarsToString,
    get_site_url,
    format_text_template,
    get_program_name,
    TOTAL_FUNDING_HEADER,
  } from "$lib/utils.js";

  /** @type {import('./$types').PageData} */
  export let data;

  $: category_data = data.category_data;
  // The template keys the hero through the quantile section on this slug so
  // that "Explore Another Category" rebuilds them (and their charts) for the
  // next category instead of carrying over the state they had for this one.
  // The key block is written tight against its content because Svelte 4
  // renders whitespace inside a key block as a space in the SSR output, and
  // the prerendered pages must not change.
  $: category_slug = category_data.category;
  $: category_name = category_data.category_name;

  // Per-category copy from the workbook (`npm run content`). Its names are
  // lowercase because the AML inserts them mid-sentence as `[category name]`.
  $: category_language_vars = category_language.find(
    (c) => c.category_short_name === category_slug
  );
  $: category_name_in_text =
    category_language_vars?.category_name ?? category_name.toLowerCase();
  $: description = category_language_vars
    ? format_text_template(site_content.category_page.overview_text, {
        category_name: category_language_vars.category_name,
        description: category_language_vars.description,
      })
    : "TK — description needed";
  $: takeaway = site_content.category_page.takeaways[category_slug];

  // derive agency text from enriched data; every agency is bolded, joined
  // with commas only ("Funded by A, B, C.")
  $: agencies_text = category_data.agencies
    ? category_data.agencies
        .map((/** @type {string} */ a) => `<strong>${a}</strong>`)
        .join(", ")
    : "TK";
  $: agency_line = format_text_template(
    site_content.category_page.agency_text,
    { agencies: agencies_text }
  );

  // national population share reference values for badge comparison
  const NATIONAL_DISADVANTAGED_POP_SHARE = 23.5;
  const NATIONAL_POVERTY_POP_SHARE = 5.5;

  /** @type {"state" | "county" | "cbsa"} */
  let geo_level = "state";

  // All three geographies. `MapSectionInfo`'s default is the two-level pair;
  // the opening level stays State.
  /** @type {{value: "state" | "county" | "cbsa", label: string}[]} */
  const geo_levels = [
    { value: "state", label: "State" },
    { value: "cbsa", label: "CBSA" },
    { value: "county", label: "County" },
  ];

  // Each level's caveat, shown only while that level is selected.
  $: map_note =
    geo_level === "cbsa"
      ? site_content.category_page.data_viz.cbsa_note
      : geo_level === "county"
      ? site_content.category_page.data_viz.county_note
      : null;

  // Build programs table data for LinkTable, with category total as first row
  $: programs_table_data = [
    {
      program: `${category_name} total funding`,
      total_funding: category_data.total_award_amount,
      url: "",
    },
    ...category_data.programs.map(
      (
        /** @type {{short_name: string, total_funding: number | null}} */ p
      ) => ({
        program: get_program_name(p.short_name),
        total_funding: p.total_funding,
        url: `${base}/program/${slugify_program(p.short_name)}/`,
      })
    ),
  ];

  // Disadvantaged/poverty badge computations
  $: dp = category_data.disadvantaged_poverty;
  $: disadv_pct = dp
    ? (dp.share_funds_in_disadvantaged_counties * 100).toFixed(1)
    : null;
  $: poverty_pct = dp
    ? (dp.share_funds_in_poverty_counties * 100).toFixed(1)
    : null;
  $: disadv_direction =
    Number(disadv_pct) >= NATIONAL_DISADVANTAGED_POP_SHARE ? "higher" : "lower";
  $: poverty_direction =
    Number(poverty_pct) >= NATIONAL_POVERTY_POP_SHARE ? "higher" : "lower";
  $: disadv_description = dp
    ? format_text_template(
        site_content.category_page.data_viz.disadvantaged_text,
        {
          value: disadv_pct,
          "higher/lower": disadv_direction,
          "category name": category_name_in_text,
        }
      )
    : "";
  $: poverty_description = dp
    ? format_text_template(
        site_content.category_page.data_viz.persistent_poverty_text,
        {
          value: poverty_pct,
          "higher/lower": poverty_direction,
          "category name": category_name_in_text,
        }
      )
    : "";

  // Landing-page takeaways preselect the quintile chart with
  // `?characteristic=<indicator>&geography=<level>` (the page loads at the top).
  // The site is prerendered, so the params are read client-side, on every
  // navigation (this component is reused from one category to the next).
  // `ProgramQuantiles` ignores values it has no data for.
  /** @type {string | undefined} */
  let requested_indicator;
  /** @type {string | undefined} */
  let requested_data_level;

  afterNavigate(({ to }) => {
    if (!to) return;
    requested_indicator =
      to.url.searchParams.get("characteristic") ?? undefined;
    requested_data_level = to.url.searchParams.get("geography") ?? undefined;
  });
</script>

<Meta
  title={`${category_name} | ${site_content.meta.title}`}
  description={format_text_template(site_content.meta.description_category, {
    category: category_name,
  })}
  url={get_site_url(`program-categories/${slugify_program(category_slug)}`)}
/>
<SearchNavBar
  label="for a type of infrastructure, a federal program, or a geography."
/>
<div class="">
  {#key category_slug}<!-- Section 1: Hero with category info and programs table -->
    <LayoutHero>
      <LayoutBlock>
        <h1 class="overview-page--page-title">{category_name}</h1>

        <Pillbox>
          <span class="category--agency-text">{@html agency_line}</span>
        </Pillbox>

        <p class="description-tag">Category overview</p>
        <p class="category--overview-text">{@html description}</p>
        {#if takeaway}
          <p class="category--overview-text">{@html takeaway}</p>
        {/if}

        <LinkTable
          data={programs_table_data}
          sort_column="total_funding"
          format_funs={{ total_funding: dollarsToString }}
          column_headers={{
            program: "Program",
            total_funding: TOTAL_FUNDING_HEADER,
          }}
          highlight_first_row
          fit_last_column
        />
        <p class="category--caption">
          {site_content.category_page.obligated_funds_caption}
        </p>
      </LayoutBlock>
    </LayoutHero>

    <!-- Section 2: Map with geo toggle. Takes the gradient
         that follows the hero, as on the geography pages. -->
    <LayoutSection theme="gradient">
      <MapSection
        title={site_content.category_page.data_viz.header_map}
        levels={geo_levels}
        bind:map_level={geo_level}
        ga_control="category-map-geo-toggle"
      >
        <div class="map-full-width">
          <Card>
            <FundingMap
              selected_program={category_slug}
              option_type="category"
              bind:map_level={geo_level}
              show_program_link={false}
              legend_title={site_content.category_page.data_viz.subhead_map}
              note={map_note}
            />
          </Card>
        </div>
      </MapSection>
    </LayoutSection>

    <!-- Section 3: Disadvantaged/Poverty badges + Equity scores placeholder -->
    <LayoutSection topShadow>
      <LayoutBlock>
        <h2 class="section-title">
          {site_content.category_page.data_viz.header_equity}
        </h2>
        <p class="section-description">
          {@html site_content.category_page.data_viz.equity_description}
        </p>
      </LayoutBlock>
      <LayoutBlock size="large">
        <div class="badges-row">
          {#if dp}
            <Card>
              <div class="badge-card">
                <span class="badge-value">{disadv_pct}%</span>
                <p class="badge-label">Disadvantaged Counties</p>
                <p class="badge-description">{@html disadv_description}</p>
              </div>
            </Card>
            <Card>
              <div class="badge-card">
                <span class="badge-value">{poverty_pct}%</span>
                <p class="badge-label">Persistent Poverty Counties</p>
                <p class="badge-description">{@html poverty_description}</p>
              </div>
            </Card>
          {:else}
            <Card>
              <p>TK — disadvantaged/poverty data unavailable</p>
            </Card>
          {/if}
        </div>
      </LayoutBlock>
      <LayoutBlock>
        <h3 class="section-subtitle">
          {site_content.category_page.data_viz.concentration_table_title}
        </h3>
        <p class="section-description">
          {@html site_content.category_page.data_viz
            .concentration_section_description}
        </p>
        <p class="section-description">
          {@html site_content.category_page.data_viz
            .concentration_table_description}
        </p>
      </LayoutBlock>
      <LayoutBlock size="large">
        <ConcentrationScoresSection
          concentration_scores={category_data.concentration_scores}
          title={site_content.category_page.data_viz.concentration_box_title}
        />
      </LayoutBlock>
    </LayoutSection>

    <!-- Section 4: Community Comparison (Quantile chart) -->
    <LayoutSection theme="gradient">
      <LayoutBlock>
        <h2 class="section-title">
          {site_content.category_page.data_viz.header_quintile}
        </h2>
        <p class="section-description">
          {@html format_text_template(
            site_content.category_page.data_viz.quintile_description,
            { base }
          )}
        </p>
      </LayoutBlock>
      <LayoutBlock>
        {#if category_data.quantile_funding && category_data.quantile_funding.length > 0}
          <Card>
            <ProgramQuantiles
              quantile_funding={category_data.quantile_funding}
              default_indicator={requested_indicator}
              default_data_level={requested_data_level}
            />
          </Card>
        {:else}
          <p>TK — quantile data unavailable</p>
        {/if}
      </LayoutBlock>
    </LayoutSection>{/key}

  <!-- Section 5: Explore Another Category grid. Its top shadow is the seam
       under the gray quintile section, as in design/categories.jpg. -->
  <LayoutSection topShadow>
    <LayoutBlock size="large">
      <h2 class="section-title category-grid-title">
        Explore Another Infrastructure Category
      </h2>
      <CategoryGrid
        categories={data.categories_simple}
        exclude={category_slug}
      />
    </LayoutBlock>
  </LayoutSection>

  <!-- Section 6: About / Credits -->
  <LayoutSection theme="white" hairline>
    <About content={site_content.about} />
    <Credits content={site_content.credits} />
  </LayoutSection>
</div>

<style>
  /* Matches ProgramInfo's .description-funding-pill-label so the agency pill
     reads the same on category and program pages, as design/categories.jpg shows. */
  .category--agency-text {
    font-size: 13px;
    line-height: 21px;
  }
  .category--overview-text {
    margin-block: var(--spacing-6);
  }
  .category--caption {
    font-size: var(--font-size-small);
    color: var(--color-gray-shade-dark);
    margin-block-start: var(--spacing-3);
    font-style: italic;
  }
  .section-title {
    text-align: center;
    margin-block-end: var(--spacing-4);
  }
  .section-description {
    text-align: center;
    margin-block-end: var(--spacing-8);
  }
  .section-subtitle {
    margin-block-start: var(--spacing-8);
    margin-block-end: var(--spacing-3);
    font-weight: var(--font-weight-bold);
    text-transform: none;
    text-align: center;
  }
  .badges-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
    margin-block: 60px;
  }
  .badge-card {
    text-align: center;
    padding: var(--spacing-4);
    display: flex;
    gap: 1rem;
    flex-direction: column;
    align-items: center;
  }
  .badge-value {
    background-color: var(--color-green);
    padding: 0.75rem 1.25rem;
    border-radius: 100px;
    font-size: 36px;
    line-height: 44px;
    font-family: var(--font-family-sans-alt);
    font-weight: var(--font-weight-bold);
    color: var(--color-white);
    margin-top: -3.75rem;
    flex-grow: 0;
  }
  .badge-label {
    font-weight: var(--font-weight-bold);
    font-size: 28px;
    line-height: 36px;
    font-family: var(--font-family-sans-alt);
    margin-block-end: 0;
  }
  .badge-description {
    /* font-size: var(--font-size-small); */
    font-size: 20px;
    /* color: var(--color-gray-shade-dark); */
  }
  /* The map takes the whole row at every level. */
  .map-full-width > :global(*) {
    min-width: 0;
    overflow: hidden;
  }
  .category-grid-title {
    margin-block-end: var(--spacing-8);
  }
  @media (max-width: 768px) {
    .badges-row {
      grid-template-columns: 1fr;
    }
  }
</style>
