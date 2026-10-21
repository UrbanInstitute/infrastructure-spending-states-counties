<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import Meta from "$components/Meta.svelte";
  import Hero from "$components/common/Hero.svelte";
  import HeroArt from "$components/HeroArt.svelte";
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import Card from "$components/Card.svelte";
  import MapSectionInfo from "$components/MapSectionInfo.svelte";
  import About from "$components/About.svelte";
  import MainSearch from "$components/MainSearch.svelte";
  import TextBlocks from "$components/common/TextBlocks.svelte";
  import Credits from "$components/Credits.svelte";
  import FundingMap from "$components/FundingMap.svelte";
  import CategoryHighlights from "$components/CategoryHighlights.svelte";
  import site_content from "$data/site_content.aml";
  import { category_list } from "$stores/categories.js";
  import { get_site_url } from "$lib/utils";
  import { base } from "$app/paths";

  let map_category = "roads_and_bridges";
  /** @type {"state" | "county" | "cbsa"} */
  let map_level = "state";

  // All three geographies. Passed explicitly because `MapSectionInfo`'s default
  // is the two-level pair the program page uses; the opening level is State.
  /** @type {{value: "state" | "county" | "cbsa", label: string}[]} */
  const map_levels = [
    { value: "state", label: "State" },
    { value: "cbsa", label: "CBSA" },
    { value: "county", label: "County" },
  ];

  // Each level's caveat, shown only while that level is selected — the same
  // rule the program and category maps apply to theirs. State is the one level
  // with nothing to caveat: the state-capital problem is about funding landing
  // in the wrong sub-state geography, which a state-level map cannot show.
  $: map_note =
    map_level === "county"
      ? site_content.intro_map.county_note
      : map_level === "cbsa"
      ? site_content.intro_map.cbsa_note
      : null;

  // Categories reshaped into the option shape the map selector expects.
  $: map_categories = $category_list.map((c) => ({
    short_name: c.category,
    name: c.category_name,
  }));

  const category_highlights = site_content.category_highlights;
</script>

<Meta
  title={site_content.meta.title}
  description={site_content.meta.description}
  url={get_site_url("")}
/>
<article>
  <HeroArt image="{base}/hero_illustration_home.svg" />
  <LayoutSection padding={false}>
    <Hero headline={site_content.hero.headline} date={site_content.hero.date} />
    <TextBlocks blocks={site_content.intro_before_map} />
  </LayoutSection>
  <LayoutSection theme="gradient">
    <CategoryHighlights
      header={category_highlights.header}
      button_text={category_highlights.button_text}
      items={category_highlights.items}
    />
  </LayoutSection>
  <LayoutSection topShadow>
    <TextBlocks blocks={site_content.intro_after_map} />
  </LayoutSection>
  <LayoutSection padding={false}>
    <MainSearch content={site_content.search} />
  </LayoutSection>
  <!--
    Per design/homepage.png the heading sits above the card and the subhead,
    units label and geography toggle sit inside it, unlike the program,
    category and geography pages — hence MapSectionInfo directly rather than
    the stacked MapSection.
  -->
  <LayoutSection theme="gradient">
    <LayoutBlock>
      <h2 class="map-section-title">{site_content.intro_map.header}</h2>
    </LayoutBlock>
    <LayoutBlock size="large">
      <Card>
        <div class="funding-map--container">
          <div class="funding-map--info">
            <MapSectionInfo
              levels={map_levels}
              bind:map_level
              ga_control="home-map-geo-toggle"
            />
          </div>
          <FundingMap
            bind:selected_program={map_category}
            bind:map_level
            programs={map_categories}
            option_type="category"
            legend_title={site_content.intro_map.Description}
            note={map_note}
          />
        </div>
      </Card>
    </LayoutBlock>
  </LayoutSection>
  <div class="layout-container--article-width">
    <section>
      <About content={site_content.about} />
    </section>
    <section>
      <Credits content={site_content.credits} />
    </section>
  </div>
</article>

<style>
  .map-section-title {
    text-align: center;
    margin-bottom: var(--spacing-12);
  }
  .funding-map--container {
    padding: var(--spacing-6);
  }
  .funding-map--info {
    max-width: var(--body-width);
    margin-inline: auto;
    margin-block-end: var(--spacing-3);
  }
</style>
