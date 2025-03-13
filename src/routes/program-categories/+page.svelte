<script>
  import { base } from "$app/paths";
  import {
    slugify_program,
    format_category_name,
    get_site_url,
  } from "$lib/utils";

  // Furniture components
  import Meta from "$components/Meta.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";

  // data and content
  import site_content from "$data/site_content.aml";
  import program_language from "$data/program_language.json";

  /** @type {import('./$types').PageData} */
  export let data;
</script>

<Meta
  title={site_content.meta.title}
  description={site_content.meta.description}
  url={get_site_url("program-categories")}
/>
<SearchNavBar
  label="Search for a type of infrastructure, a federal program, or a geography."
/>
<div class="layout-container--article-width page--content">
  <LayoutSection layout="col-1">
    <LayoutBlock>
      <h1 class="overview-page--page-title">
        {site_content.category_page.header}
      </h1>
      <p>{@html site_content.category_page.about_text}</p>
    </LayoutBlock>
  </LayoutSection>
  <LayoutSection layout="col-1">
    {#each data.categories as category}
      <div id={slugify_program(category)} class="category--section">
        <LayoutBlock>
          <h2 class="category--subhead">{format_category_name(category)}</h2>
          <p>{@html site_content.category_page.descriptions[category]}</p>
          <ul class="category--program-list">
            {#each data.programs.filter( (program) => program.categories.includes(category) ) as program}
              {@const program_language_vars = program_language.find(
                ({ program_short_name }) =>
                  program_short_name === program.short_name
              )}
              <li>
                <p>
                  <a href="{base}/program/{slugify_program(program.short_name)}"
                    >{program_language_vars.program_name}</a
                  >
                </p>
              </li>
            {/each}
          </ul>
        </LayoutBlock>
      </div>
    {/each}
  </LayoutSection>
  <section class="section--page-footer">
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
  .category--program-list {
    padding-left: 3em;
    margin-bottom: var(--spacing-6);
  }
  .category--subhead {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-6);
  }
  .category--subhead {
    font-size: var(--font-size-2xl);
  }
</style>
