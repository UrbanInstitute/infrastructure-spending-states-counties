<script>
  import Meta from "$components/Meta.svelte";
  import Hero from "$components/common/Hero.svelte";
  import About from "$components/About.svelte";
  import MainSearch from "$components/MainSearch.svelte";
  import TextBlocks from "$components/common/TextBlocks.svelte";
  import Credits from "$components/Credits.svelte";
  import FundingMap from "$components/FundingMap.svelte";
  import site_content from "$data/site_content.json";
  import { program_list } from "$stores/programs.js";
  import { get_site_url } from "$lib/utils";

  /** @type {import('./$types').PageData} */
  export let data;
</script>

<Meta
  title={site_content.meta.title}
  description={site_content.meta.description}
  url={get_site_url("")}
/>
<article>
  <div class="layout-container--article-width">
    <Hero
      headline={site_content.hero.headline}
      date={site_content.hero.date}
    />
    <section class="body">
      <TextBlocks blocks={site_content.intro_before_map} />
      <div class="funding-map--container">
        <h2>{site_content.intro_map.subhead}</h2>
        {#if site_content.intro_map.description}
          <p>{site_content.intro_map.description}</p>
        {/if}
        <FundingMap
          data_layer={data.state_data}
          map_level="state"
          programs={$program_list}
        />
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
    border-top: solid 1px var(--color-gray-shade-light);
    border-bottom: solid 1px var(--color-gray-shade-light);
    padding: var(--spacing-8) 0;
    margin-bottom: var(--spacing-8);
  }
  .funding-map--container h2 {
    margin-bottom: 1rem;
    font-size: var(--font-size-large);
  }
</style>
