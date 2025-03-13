<script>
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import Meta from "$components/Meta.svelte";
  import site_content from "$data/site_content.aml";
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
    {#each site_content.user_guide.text as item, i (i)}
      {#if item.type === "text"}
        <div class="user-guide--text">{@html item.value}</div>
      {:else if item.type === "table"}
        <iframe
          title="Indicators and Data Sources"
          aria-label="Table"
          id="datawrapper-chart-CkbAx"
          src="https://datawrapper.dwcdn.net/CkbAx/1/"
          scrolling="no"
          frameborder="0"
          style="width: 0; min-width: 100% !important; border: none;"
          height="5100"
          data-external="1"
        /><script type="text/javascript">
          !(function () {
            "use strict";
            window.addEventListener("message", function (a) {
              if (void 0 !== a.data["datawrapper-height"]) {
                var e = document.querySelectorAll("iframe");
                for (var t in a.data["datawrapper-height"])
                  for (var r = 0; r < e.length; r++)
                    if (e[r].contentWindow === a.source) {
                      var i = a.data["datawrapper-height"][t] + "px";
                      e[r].style.height = i;
                    }
              }
            });
          })();
        </script>
      {/if}
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
    font-size: var(--font-size-large);
    line-height: var(--line-height-normal);
  }
  :global(.user-guide--text h2) {
    font-size: var(--font-size-2xl);
  }
  h1 {
    font-size: var(--font-size-5xl);
  }
  @media (min-width: 769px) {
    .user-guide--text {
      margin-bottom: var(--spacing-8);
      line-height: var(--line-height-relaxed);
    }
  }
</style>
