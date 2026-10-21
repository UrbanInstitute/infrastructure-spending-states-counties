<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  // svelte stuff
  import { browser } from "$app/environment";

  // helpers
  import { format_text_template } from "$lib/utils";

  // stores
  import { category_list, category_display_name } from "$stores/categories.js";
  import { DEFAULT_GEOGRAPHY_CATEGORY } from "$stores/map_category";

  // components
  import FundingMap from "$components/FundingMap.svelte";
  import ProgramFundingTables from "$components/ProgramFundingTables.svelte";
  import BarbellCompare from "$components/BarbellCompare.svelte";
  import EquityPercentiles from "$components/EquityPercentiles.svelte";
  import Card from "$components/Card.svelte";
  import LayoutHero from "$components/LayoutHero.svelte";
  import MapSection from "$components/MapSection.svelte";
  import CountyIndicator from "$components/CountyIndicator.svelte";
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import site_content from "$data/site_content.aml";

  export let program_funding;

  /** @type {{bucket: string, fips_list: any, funding_medians: Map<any, any>}[]} */
  export let comparison_buckets;

  /**
   * Category shown by both the funding map and the community-needs section.
   * @type { string }
   */
  export let selected_category;

  /** @type { "county" | "cbsa" | "state"} */
  export let geo_type;

  $: geo_type_text =
    geo_type === "county" ? "county" : geo_type === "cbsa" ? "CBSA" : "state";

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
      return site_content.geography_pages.priority_pp_tooltip;
    }
    if (disadvantaged) {
      return site_content.geography_pages.priority_disadvantaged_tooltip;
    }
    return "";
  }

  // Category selector options: categories with funding > 0
  $: category_options = $category_list
    .filter(
      (cat) =>
        program_funding.category_funding[cat.category] != null &&
        program_funding.category_funding[cat.category] > 0
    )
    .map((cat) => ({
      value: cat.category,
      label: category_display_name(cat.category),
    }));

  // Keep the shared selection to a category this place was funded for: the
  // default when it was, else the first. Runs on arrival too, since the
  // selection carries over from the previous place.
  $: if (
    category_options.length > 0 &&
    !category_options.some((o) => o.value === selected_category)
  ) {
    selected_category = category_options.some(
      (o) => o.value === DEFAULT_GEOGRAPHY_CATEGORY
    )
      ? DEFAULT_GEOGRAPHY_CATEGORY
      : category_options[0].value;
  }

  // Category options reshaped into the program shape FundingMap expects.
  $: map_programs = category_options.map((c) => ({
    short_name: c.value,
    name: c.label,
  }));

  // Get applicable help text based on county data
  $: priority_help_text = get_priority_help_text(
    program_funding.persistent_poverty_county,
    program_funding.disadvantaged_county
  );

  $: overview_eyebrow = `${geo_type_text} overview`;

  // The barbell module's description is geography-specific. The 2026 AML
  // rewrite replaced the old single `about_text` key with these three;
  // `BarbellCompare` was still reading the removed key, which rendered the
  // literal string "undefined" on every geography page.
  $: barbell_description =
    geo_type === "county"
      ? site_content.geography_pages.barbell_graph.county_description
      : geo_type === "cbsa"
      ? site_content.geography_pages.barbell_graph.cbsa_description
      : site_content.geography_pages.barbell_graph.state_description;

  // Map geography-level toggle — state pages only. A county or CBSA page's map
  // already draws the place among its peers (Marin County shows all 58
  // California counties), so the alternative "State" view answered a question
  // nobody asked. A state page is the one case where the other level adds
  // something: its own level is the national 52-state map, so with no toggle
  // there would be no way to reach a state's county breakdown from its own
  // page. An empty list renders no toggle.
  /** @type {{value: "state" | "county" | "cbsa", label: string}[]} */
  $: map_levels =
    geo_type === "state"
      ? [
          { value: "state", label: "State" },
          { value: "county", label: "County" },
        ]
      : [];

  /** @type {"state" | "county" | "cbsa"} */
  let map_level = geo_type;

  // The state-capital caveat for whichever sub-state level is on show; a
  // state-level map has nothing to caveat.
  $: map_note =
    map_level === "county"
      ? site_content.geography_pages.county_note
      : map_level === "cbsa"
      ? site_content.geography_pages.cbsa_note
      : null;

  // Only highlight the place when the map is drawn at its own level; at any
  // other level its FIPS matches no feature.
  $: map_highlight_fips = map_level === geo_type ? program_funding.fips : null;

  // The county geo endpoint (`/api/county-geo/[fips].json`) is keyed by 2-digit
  // state FIPS, and `Map.get_counties_geo` rejects anything else. A state's own
  // `fips` is already two digits; a county's is five. No place JSON carries a
  // `state_fips` field — the old `program_funding.state_fips || …` fallback was
  // therefore always the 5-digit county FIPS, so the county map never loaded on
  // a county page. CBSA pages never offer a county level.
  $: county_geo_state_fips =
    geo_type === "cbsa" ? null : String(program_funding.fips).slice(0, 2);
</script>

<LayoutHero>
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
    <p class="description-tag">{overview_eyebrow}</p>
    <p class="page-description">
      {#if geo_type === "county"}
        {format_text_template(site_content.geography_pages.county_about_text, {
          county: program_funding.name,
        })}
      {:else if geo_type === "cbsa"}
        <!-- The AML writes this placeholder in capitals: `[CBSA]`. -->
        {format_text_template(site_content.geography_pages.cbsa_about_text, {
          CBSA: program_funding.name,
        })}
      {:else}
        {format_text_template(
          site_content.geography_pages.state_about_text ||
            "Infrastructure funding in [state].",
          { state: program_funding.name }
        )}
      {/if}
    </p>
    <ProgramFundingTables data={program_funding.category_funding} />
  </LayoutBlock>
</LayoutHero>

<!-- Where was funding distributed? Map, plus the similar-places beeswarm. -->
<LayoutSection theme="gradient">
  <MapSection
    title={site_content.geography_pages.map_beeswarm.header}
    levels={map_levels}
    ga_control="geography-map-geo-toggle"
    bind:map_level
  >
    <Card>
      <FundingMap
        highlight_fips={map_highlight_fips}
        programs={map_programs}
        option_type="category"
        bind:selected_program={selected_category}
        {map_level}
        county_state_fips={county_geo_state_fips}
        show_program_link={false}
        legend_title={site_content.geography_pages.map_beeswarm
          .subhead_beeswarm}
        note={map_note}
      />
    </Card>
  </MapSection>
</LayoutSection>

<!-- Was funding allocated according to community need? -->
{#if browser}
  <LayoutSection topShadow>
    <LayoutBlock>
      <h2 class="section-title">
        {site_content.geography_pages.equity_scores.header}
      </h2>
      <p class="section-description">
        {site_content.geography_pages.equity_scores.about_text}
      </p>
    </LayoutBlock>
    <LayoutBlock size="large">
      <EquityPercentiles
        funding_percentile_ranks={program_funding.funding_percentile_ranks}
        indicator_percentile_ranks={program_funding.indicator_percentile_ranks}
        equity_directions={program_funding.equity_directions}
        {category_options}
        {geo_type}
        bind:selected_category
      />
    </LayoutBlock>
  </LayoutSection>
{/if}

<!-- How do similar areas compare? -->
{#if browser}
  <LayoutSection theme="gradient">
    <LayoutBlock>
      <h2 class="section-title">
        {site_content.geography_pages.barbell_graph.header}
      </h2>
      <p class="section-description">{barbell_description}</p>
    </LayoutBlock>
    <LayoutBlock size="large">
      <Card>
        <div class="geography-barbell">
          <BarbellCompare
            {geo_type}
            current_location={program_funding.name}
            category_funding={program_funding.category_funding}
            {comparison_buckets}
          />
        </div>
      </Card>
    </LayoutBlock>
  </LayoutSection>
{/if}

<LayoutSection theme="white" hairline>
  <About content={site_content.about} />
  <Credits content={site_content.credits} />
</LayoutSection>

<style>
  .geography-barbell {
    padding: var(--spacing-6);
  }
  @media (max-width: 768px) {
    /* Give the comparison table back the horizontal room it needs to fit. */
    .geography-barbell {
      padding: var(--spacing-2);
    }
  }
  .section-title {
    text-align: center;
    margin-block-end: var(--spacing-4);
  }
  .section-description {
    max-width: var(--body-width);
    margin-inline: auto;
    text-align: center;
  }
</style>
