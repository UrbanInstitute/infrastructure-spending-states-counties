<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  // layout helpers
  import LayoutHero from "$components/LayoutHero.svelte";
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";

  // furniture components
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import Card from "$components/Card.svelte";
  import SourcesTable from "$components/SourcesTable.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import Meta from "$components/Meta.svelte";

  // data and content
  import site_content from "$data/site_content.aml";
  import { base } from "$app/paths";
  import { get_site_url, format_text_template } from "$lib/utils.js";
</script>

<Meta
  title={site_content.meta.title}
  description={site_content.meta.description}
  url={get_site_url("user-guide")}
/>
<SearchNavBar
  label="for a type of infrastructure, a federal program, or a geography."
/>
<article>
  <LayoutHero>
    <LayoutBlock>
      <h1 class="overview-page--page-title">
        {site_content.user_guide.header}
      </h1>
    </LayoutBlock>
  </LayoutHero>
  <!--
    Per design/user-guide.png the body runs straight on from the hero on the
    same white surface, so this section supplies no padding of its own — the
    hero's own bottom padding is the whole gap. Same arrangement the categories
    overview uses under its hero.
  -->
  <LayoutSection padding={false}>
    <div class="user-guide--body">
      {#each site_content.user_guide.text as item, i (i)}
        {#if item.type === "text"}
          <LayoutBlock>
            <div
              class="user-guide--text"
              class:user-guide--text-after-table={site_content.user_guide.text[
                i - 1
              ]?.type === "table"}
            >
              {@html format_text_template(item.value, { base })}
            </div>
          </LayoutBlock>
        {:else if item.type === "table"}
          <!-- The comp breaks the table out of the 760px reading column; `xl`
               is the design system's nearest width to the 1058px it draws. The
               box it draws around the table is a Card — its 1px #ececec border
               is `--color-gray-shade-lighter` exactly.

               `item.value` is the AML's position marker, not data: the table
               reads `src/data/sources.csv` directly. -->
          <LayoutBlock size="xl">
            <Card>
              <SourcesTable title={site_content.user_guide.table_title} />
            </Card>
          </LayoutBlock>
        {/if}
      {/each}
    </div>
  </LayoutSection>
  <LayoutSection theme="white" hairline>
    <About content={site_content.about} />
    <Credits content={site_content.credits} />
  </LayoutSection>
</article>

<style>
  .user-guide--body {
    padding-block-end: var(--spacing-20);
  }
  .user-guide--text {
    margin-bottom: var(--spacing-8);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-normal);
  }
  /* The table's Card has no bottom margin, so the heading after it would
     otherwise sit flush against it. Match the gap above other section h2s. */
  .user-guide--text-after-table {
    margin-top: var(--spacing-8);
  }
  @media (min-width: 769px) {
    .user-guide--text {
      line-height: var(--line-height-relaxed);
    }
  }
</style>
