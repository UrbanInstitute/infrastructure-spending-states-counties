<script>
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import Meta from "$components/Meta.svelte";
  import site_content from "$data/site_content.json";
  import { get_site_url } from "$lib/utils.js";
</script>

<Meta
  title={site_content.meta.title}
  description={site_content.meta.description}
  url={get_site_url("user-guide")}
/>
<SearchNavBar
  label="Search for a type of infrastructure, a federal program, or a geography."
/>
<div class="layout-container--article-width page--content">
  <LayoutSection layout="col-1">
    <LayoutBlock>
      <h1 class="overview-page--page-title">
        {site_content.user_guide.header}
      </h1>
    </LayoutBlock>
    {#each site_content.user_guide.text as item}
      <p class="user-guide--text">{@html item.value}</p>
    {/each}
  </LayoutSection>
  <section>
    <div class="section-divide-rule" />
    <About content={site_content.about} />
  </section>
  <section>
    <Credits content={site_content.credits} />
  </section>
</div>

<style>
  .page--content {
    margin-top: var(--spacing-12);
  }
  .user-guide--text {
    margin-bottom: var(--spacing-8);
  }
  :global(.user-guide--text h2) {
    font-size: var(--font-size-2xl);
  }
  h1 {
    font-size: var(--font-size-5xl);
  }
</style>
