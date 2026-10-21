<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { slide } from "svelte/transition";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import Search from "$lib/components/Search.svelte";
  import AdvancedSearch from "$lib/components/AdvancedSearch.svelte";
  import IconSearch from "$components/IconSearch.svelte";
  import { format_text_template } from "$lib/utils.js";
  import { base } from "$app/paths";
  import { logClickToGA } from "$lib/analytics";
  import { urbanColors } from "@urbaninstitute/dataviz-components/utils";

  export let content;

  let show_advanced_search = false;

  /**
   * @type {HTMLElement}
   */
  let el;

  function toggleAdvancedSearch() {
    show_advanced_search = !show_advanced_search;
    if (!show_advanced_search) return;
    // Once the panel has slid open, scroll the container into view if its
    // bottom sits below the viewport.
    window.setTimeout(() => {
      const winHeight = window.innerHeight;
      const elBounds = el.getBoundingClientRect();
      if (elBounds.bottom > winHeight) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 250);
  }
</script>

<div class="main-search-container" bind:this={el}>
  <LayoutBlock size="xl">
    <div class="main-search">
      <div class="main-search--inner-wrap layout-container--article-width">
        <div class="main-search--left-block">
          <div class="main-search--headline">
            <h2 class="main-search--subhead">
              <IconSearch fill={urbanColors.white} size={30} />
              {@html content.homepage_subhead}
            </h2>
          </div>
          <div class="main-search--ui-wrapper">
            <div class="main-search--search-wrap">
              <Search placeholder={content.placeholder} />
            </div>
            <p class="main-search--prompt">{content.prompt}</p>
            <div class="advanced--search-button-wrapper">
              <button
                class="advanced--search-button"
                on:click={(e) => {
                  toggleAdvancedSearch();
                  logClickToGA(
                    e.target,
                    "main-advanced-search-button--" +
                      (show_advanced_search ? "open" : "close")
                  );
                }}>Search options</button
              >
            </div>
          </div>
        </div>
        <div class="main-search--right-block">
          <p class="main-search--explainer-subhead">
            {content.explainer_subhead}
          </p>
          {#each content.explainer_text as text}
            <p class="main-search--explainer-text">
              {@html format_text_template(text.value, { base: base })}
            </p>
          {/each}
        </div>
      </div>
    </div>
  </LayoutBlock>
</div>
{#if show_advanced_search}
  <div
    class="main-search--advanced-search"
    id="advanced-search"
    transition:slide={{ duration: 250 }}
  >
    <LayoutBlock size="xl">
      <AdvancedSearch on:close={() => (show_advanced_search = false)} />
    </LayoutBlock>
  </div>
{/if}

<style>
  .main-search-container {
    --vertical-spacing: 120px;
    --horizontal-padding: 120px;
    background-color: var(--color-blue-shade-darkest);
    padding-block: var(--vertical-spacing);
  }
  .main-search * {
    color: white;
  }
  .main-search--inner-wrap {
    position: relative;
    display: flex;
  }
  .main-search--left-block,
  .main-search--right-block {
    width: 50%;
  }
  .main-search--left-block {
    padding-right: var(--horizontal-padding);
    border-right: solid 1px var(--color-blue-shade-darker);
  }
  .main-search--right-block {
    padding-left: var(--horizontal-padding);
  }
  .main-search--search-wrap {
    width: 100%;
    max-width: 411px;
    margin-bottom: var(--spacing-6);
  }
  .main-search--explainer-subhead {
    margin-top: var(--spacing-6);
    font-size: 24px;
    line-height: 32px;
    font-family: var(--font-family-sans-alt);
    font-weight: var(--font-weight-bold);
  }
  .main-search--explainer-text {
    font-size: 16px;
    line-height: 24px;
    margin: var(--spacing-4) auto;
  }
  .advanced--search-button {
    background: var(--color-blue);
    color: var(--color-white);
    border: none;
    cursor: pointer;
    appearance: none;
    padding: 8px 13px;
    font-family: var(--font-family-sans);
    font-size: 20px;
    font-weight: var(--font-weight-bold);
  }
  .main-search--subhead {
    margin-bottom: var(--spacing-6);
    line-height: 56px;
    font-size: 44px;
  }
  /* The subhead's highlighted word arrives through `{@html}` from
     `site_content.aml`, so it carries no scoping class and the `.main-search *`
     rule above cannot reach it — the global `.text-highlight` blue wins. This
     override keeps the utility blue everywhere else. */
  .main-search--subhead :global(.text-highlight) {
    color: var(--color-white);
  }
  .main-search--headline,
  .main-search--prompt {
    margin-bottom: var(--spacing-6);
  }
  @media (max-width: 768px) {
    .advanced--search-button-wrapper {
      position: static;
      transform: none;
    }
    .main-search--inner-wrap {
      display: block;
    }
    .main-search--left-block,
    .main-search--right-block {
      padding: 0;
      border-right: none;
      width: 100%;
    }
  }
  .main-search--advanced-search {
    background-color: var(--color-white);
  }
  @media (min-width: 768px) {
    .main-search--inner-wrap {
      padding: 0 !important;
    }
  }
</style>
