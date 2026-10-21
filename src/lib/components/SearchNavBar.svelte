<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import Search from "$lib/components/Search.svelte";
  import IconSearch from "$components/IconSearch.svelte";
  import { urbanColors } from "@urbaninstitute/dataviz-components/utils";
  export let label;
</script>

<div class="search-nav-bar">
  <div class="search-nav-bar--inner layout-container--article-width">
    <div class="search-nav-bar--label">
      <div class="search-nav-bar--label-icon">
        <IconSearch fill={urbanColors.white} size={21} />
      </div>
      <div>
        <span class="search-nav-bar--label-highlight">Search</span>
        {label}
      </div>
    </div>
    <div class="search-nav-bar--search-wrap">
      <div class="search-nav-bar--search">
        <Search placeholder="Search" />
      </div>
    </div>
  </div>
</div>

<style>
  .search-nav-bar {
    background-color: var(--color-blue-shade-darkest);
    color: var(--color-white);
    position: sticky;
    /* Directly beneath the sticky nav; see `+layout.svelte`. */
    top: var(--nav-height, 0px);
    z-index: 21;
  }
  .search-nav-bar--inner {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding-top: var(--spacing-3);
    padding-bottom: var(--spacing-3);
  }

  .search-nav-bar--label {
    color: var(--color-white);
    font-size: 20px;
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-sans-alt);
    line-height: 24px;
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
  .search-nav-bar--label-icon {
    margin-right: 0.5rem;
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    align-items: center;
  }

  .search-nav-bar--label-highlight {
    color: var(--color-white);
    gap: 4px;
  }
  @media (min-width: 768px) {
    .search-nav-bar--label {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
</style>
