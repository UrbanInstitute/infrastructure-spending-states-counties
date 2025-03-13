<script>
  import { slide } from "svelte/transition";
  import Search from "$lib/components/Search.svelte";
  import AdvancedSearch from "$lib/components/AdvancedSearch.svelte";
  import { format_text_template } from "$lib/utils.js";
  import { base } from "$app/paths";
  import icon_open from "$assets/icon_open.svg";
  import icon_close from "$assets/icon_close.svg";
  import { logClickToGA } from "$lib/analytics";

  export let content;

  let show_advanced_search = false;

  /**
   * @type {HTMLElement}
   */
  let el;

  function onShowAdvanced() {
    show_advanced_search = !show_advanced_search;
    // get window height and scroll to calculate the bottom of the viewport
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
  <div class="main-search">
    <div class="main-search--inner-wrap layout-container--article-width">
      <h2 class="main-search--subhead">
        Search for federal infrastructure programs and where they
        distributed&nbsp;funds
      </h2>
      <div class="main-search--ui-wrapper">
        <div class="main-search--search-wrap">
          <Search placeholder={content.placeholder} />
        </div>
        <div class="advanced--search-button-wrapper">
          {#if !show_advanced_search}
            <button
              class="advanced--search-button"
              on:click={(e) => {
                onShowAdvanced();
                logClickToGA(
                  e.target,
                  "main-advanced-search-button--" +
                    (show_advanced_search ? "open" : "close")
                );
              }}
              ><img
                src={icon_open}
                alt="open advanced search"
                class="search-button--icon"
              />Search options</button
            >
          {:else}
            <button
              class="advanced--search-button"
              on:click={(e) => {
                show_advanced_search = !show_advanced_search;
                logClickToGA(
                  e.target,
                  "main-advanced-search-button--" +
                    (show_advanced_search ? "open" : "close")
                );
              }}
              ><img
                src={icon_close}
                alt="close advanced search"
                class="search-button--icon"
              />Search options</button
            >
          {/if}
        </div>
      </div>
      <p class="main-search--explainer-subhead">{content.subhead}</p>
      {#each content.explainer_text as text}
        <p class="main-search--explainer-text">
          {@html format_text_template(text.value, { base: base })}
        </p>
      {/each}
    </div>
  </div>
  {#if show_advanced_search}
    <div
      class="main-search--advanced-search"
      id="advanced-search"
      transition:slide={{ duration: 250 }}
    >
      <AdvancedSearch />
    </div>
  {/if}
</div>

<style>
  .main-search {
    padding: var(--spacing-12) 0;
    background: var(--color-gray-shade-light);
  }
  .main-search--inner-wrap {
    position: relative;
    max-width: var(--body-width);
    margin: 0 auto;
  }
  .main-search--search-wrap {
    max-width: 550px;
    width: 80%;
    margin: 0 auto 0 0;
  }
  .main-search--explainer-subhead {
    margin-top: var(--spacing-6);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
  }
  .main-search--explainer-text {
    font-size: var(--font-size-small);
    margin: var(--spacing-4) auto;
  }
  .main-search--ui-wrapper {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .advanced--search-button {
    background: white;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    appearance: none;
    color: var(--color-black);
    padding: 8px 13px;
    font-family: var(--font-family-sans);
    font-size: var(--font-size-small);
    text-transform: uppercase;
  }
  .search-button--icon {
    width: 37px;
    height: 37px;
    margin-right: var(--spacing-2);
  }
  .main-search--subhead {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-6);
    max-width: 550px;
  }
  @media (max-width: 768px) {
    .advanced--search-button-wrapper {
      position: static;
      transform: none;
    }
  }
  @media (min-width: 768px) {
    .main-search--inner-wrap {
      padding: 0 !important;
    }
  }
</style>
