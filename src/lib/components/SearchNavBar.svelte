<script>
  import { slide } from "svelte/transition";
  import Search from "$lib/components/Search.svelte";
  import AdvancedSearch from "$lib/components/AdvancedSearch.svelte";
  import icon_open from "$assets/icon_open.svg";
  import icon_close from "$assets/icon_close.svg";
  import { logClickToGA } from "$lib/analytics";
  export let label;
  let show_advanced_search = false;
</script>

<div class="search-nav-bar">
  <div class="search-nav-bar--inner layout-container--article-width">
    <p class="search-nav-bar--label">{label}</p>
    <div class="search-nav-bar--search-wrap">
      <div class="search-nav-bar--search">
        <Search placeholder="Search" />
      </div>
      {#if !show_advanced_search}
        <button
          class="advanced--search-button"
          on:click={(e) => {
            show_advanced_search = !show_advanced_search;
            logClickToGA(e.target, "search-nav-advanced--open");
          }}><img src={icon_open} alt="open advanced search" /></button
        >
      {:else}
        <button
          class="advanced--search-button"
          on:click={(e) => {
            show_advanced_search = !show_advanced_search;
            logClickToGA(e.target, "search-nav-advanced--close");
          }}><img src={icon_close} alt="close advanced search" /></button
        >
      {/if}
    </div>
  </div>
  {#if show_advanced_search}
    <div
      class="main-search--advanced-search"
      transition:slide={{ duration: 250 }}
    >
      <AdvancedSearch />
    </div>
  {/if}
</div>

<style>
  .search-nav-bar {
    background-color: var(--color-gray-shade-lighter);
    position: relative;
    z-index: 21;
  }
  .search-nav-bar--inner {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding-top: var(--spacing-4);
    padding-bottom: var(--spacing-4);
  }

  .search-nav-bar--label {
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    margin: 0;
    display: none;
  }
  .search-nav-bar--search {
    width: 260px;
    max-width: 100%;
  }
  .search-nav-bar--search-wrap {
    display: flex;
    align-items: center;
  }
  .advanced--search-button {
    width: 37px;
    height: 37px;
    margin-left: var(--spacing-4);
    border-radius: 50%;
    appearance: none;
    border: solid 1px var(--color-blue);
    background: var(--color-blue);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    right: var(--spacing-12);
    /* position: absolute; */
    bottom: calc(-27px - var(--spacing-12) - var(--spacing-4));
  }
  @media (min-width: 768px) {
    .search-nav-bar--label {
      display: block;
    }
  }
</style>
