<script>
  import { LoadingWrapper } from "@urbaninstitute/dataviz-components";
  import Meta from "$components/Meta.svelte";
  import Hero from "$components/common/Hero.svelte";
  import HeroArt from "$components/HeroArt.svelte";
  import About from "$components/About.svelte";
  import MainSearch from "$components/MainSearch.svelte";
  import TextBlocks from "$components/common/TextBlocks.svelte";
  import Credits from "$components/Credits.svelte";
  import FundingMap from "$components/FundingMap.svelte";
  import Vignettes from "$components/Vignettes.svelte";
  import site_content from "$data/site_content.aml";
  import { get_funding_data } from "$stores/funding_data";
  import { program_list } from "$stores/programs.js";
  import { get_site_url } from "$lib/utils";
  import { browser } from "$app/environment";
  import { base } from "$app/paths";

  /** @type {import('./$types').PageData} */
  export let data;

  let map_program = "cdbg_entitlement";
  let map_level = "cbsa";
  $: map_program_data =
    browser && map_program
      ? get_funding_data(map_program, map_level)
      : new Promise(() => {});

  $: current_map_program_info = $program_list.find(
    (d) => d.short_name === map_program
  );
  $: show_map_geo_toggle = current_map_program_info?.county_level === 1;

  // if use is viewing CBSA map, and selects a program without CBSA data, reset map level to state
  $: if (!show_map_geo_toggle && map_level === "cbsa") {
    map_level = "state";
  }

  const vignettes = site_content.data_highlights;
</script>

<Meta
  title={site_content.meta.title}
  description={site_content.meta.description}
  url={get_site_url("")}
/>
<article>
  <HeroArt image="{base}/perc-header-image.svg" />
  <div class="layout-container--article-width">
    <Hero headline={site_content.hero.headline} date={site_content.hero.date} />
    <section class="body">
      <TextBlocks blocks={site_content.intro_before_map} />
      <div class="vignettes--container">
        <Vignettes items={vignettes} />
      </div>
      <div class="funding-map--container">
        <h4>{site_content.intro_map.subhead}</h4>
        {#if site_content.intro_map.description}
          <p>{site_content.intro_map.description}</p>
        {/if}
        <div class="map-spacing" />
        {#await map_program_data}
          <LoadingWrapper>
            <div class="loading-block" style="height: 500px;" />
          </LoadingWrapper>
        {:then map_data}
          <FundingMap
            bind:selected_program={map_program}
            show_geo_toggle={show_map_geo_toggle}
            show_select_label={true}
            bind:map_level
            data_layer={Array.from(map_data.values())}
            programs={$program_list}
          />
        {/await}
      </div>
      <TextBlocks blocks={site_content.intro_after_map} />
    </section>
  </div>
  <section class="home-search">
    <MainSearch content={site_content.search} />
  </section>
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
  .funding-map--container {
    margin: 0 auto;
    max-width: var(--body-width);
    /* border-top: solid 1px var(--color-gray-shade-light); */
    border-bottom: solid 1px var(--color-gray-shade-light);
    padding: var(--spacing-8) 0;
    margin-bottom: var(--spacing-8);
  }
  .funding-map--container h2 {
    margin-bottom: 1rem;
    font-size: var(--font-size-large);
  }
  .map-spacing {
    height: var(--spacing-4);
  }
  .vignettes--container {
    margin: 0 auto;
    max-width: var(--body-width);
    margin-bottom: var(--spacing-8);
    border-top: solid 1px var(--color-gray-shade-light);
  }
</style>
