<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { base } from "$app/paths";
  import { get_site_url } from "$lib/utils";

  // layout helpers
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";

  // furniture components
  import Meta from "$components/Meta.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import HeroArt from "$components/HeroArt.svelte";
  import CategoryGrid from "$components/CategoryGrid.svelte";

  // data and content
  import site_content from "$data/site_content.aml";

  /** @type {import('./$types').PageData} */
  export let data;
</script>

<Meta
  title={site_content.meta.title}
  description={site_content.meta.description}
  url={get_site_url("program-categories")}
/>
<SearchNavBar
  label="for a type of infrastructure, a federal program, or a geography."
/>
<article>
  <!--
    Per design/categories-landing-page.png this page follows the homepage
    arrangement rather than the LayoutHero one the category, program and
    geography pages use: a full-bleed hero band with the headline sitting
    below it rather than on a white surface over it.
  -->
  <HeroArt image="{base}/hero-icons.svg" />
  <LayoutSection padding={false}>
    <LayoutBlock>
      <h1 class="overview-page--page-title categories--title">
        {site_content.category_page.header}
      </h1>
      <p class="categories--intro">
        {@html site_content.category_page.about_text}
      </p>
    </LayoutBlock>
    <LayoutBlock size="large">
      <div class="categories--grid">
        <CategoryGrid categories={data.categories_simple} />
      </div>
    </LayoutBlock>
  </LayoutSection>
  <LayoutSection theme="white" hairline>
    <About content={site_content.about} />
    <Credits content={site_content.credits} />
  </LayoutSection>
</article>

<style>
  .categories--title {
    text-align: center;
  }
  .categories--intro {
    text-align: center;
    margin-block-end: var(--spacing-16);
  }
  .categories--grid {
    padding-block-end: var(--spacing-20);
  }
</style>
