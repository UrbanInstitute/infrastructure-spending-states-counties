<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script context="module">
  /**
   * Data for search
   * @typedef {Object} SearchData
   * @property {string} name - The name to search for
   * @property {string} category - The type of item to display in search results
   * @property {string} route_param - What to put at the end of the route when item is selected
   */
</script>

<script>
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { get_program_name } from "$lib/utils";
  import { category_display_name } from "$stores/categories.js";
  import search_data from "$data/server/search.json";
  import Select from "svelte-select";
  import IconSearch from "$components/IconSearch.svelte";

  /**
   * @type {SearchData[]}
   */
  export let data = /** @type {SearchData[]} */ (
    search_data.map((item) => {
      if (item.category === "category") {
        item.name = category_display_name(
          /** @type {string} */ (item.route_param?.replaceAll("-", "_"))
        );
        return item;
      } else if (item.category !== "program") {
        return item;
      }
      return Object.assign({}, item, {
        name: get_program_name(
          /** @type {string} */ (item.route_param?.replaceAll("-", "_"))
        ),
      });
    })
  );

  export let placeholder = "Search";

  /**
   * How many items the list shows while nothing has been typed. svelte-select 5
   * has no virtual list and opens with an empty filter, so without a cap every
   * click on the box built all 4,000-plus items before the user typed (review #8).
   */
  const EMPTY_FILTER_LIMIT = 50;

  /**
   * Replaces svelte-select's default `filter`: the first few items while the
   * box is empty, otherwise the same case-insensitive "label contains text"
   * match the default applies (`itemFilter` is that default match).
   * @param {Parameters<typeof import("svelte-select/filter").default>[0]} options
   * @returns {Record<string, any>[]}
   */
  function search_filter({ items, filterText, itemFilter, label }) {
    /** @type {Record<string, any>[]} */
    const list = items || [];
    if (!filterText) return list.slice(0, EMPTY_FILTER_LIMIT);
    return list.filter((item) => itemFilter(item[label], filterText, item));
  }

  // The select's state, bound so it can be emptied after each pick. Pages that
  // reuse their component across navigations (state to state, category to
  // category) keep this instance alive, and a retained selection blocked the
  // next search.
  /** @type {SearchData | null} */
  let value = null;
  let filter_text = "";
  /** @type {HTMLInputElement | undefined} */
  let input;

  /**
   * Listener for on:select for the Typeahead component. Navigates to the
   * selected item's page, then clears the box for the next search.
   * @type {(e: CustomEvent) => void}
   */
  function handleSelect(e) {
    const { category, route_param } = e.detail;
    let url;
    if (category === "category") {
      url = `${base}/program-categories/${route_param}`;
    } else {
      url = `${base}/${category}`;
      if (route_param) {
        url += `/${route_param}`;
      }
    }
    // trailingSlash is "always"; link straight to the canonical form
    goto(`${url}/`);

    value = null;
    filter_text = "";
    input?.blur();
  }
</script>

<div class="search">
  <Select
    items={data}
    filter={search_filter}
    searchable
    bind:value
    bind:filterText={filter_text}
    bind:input
    on:select={handleSelect}
    {placeholder}
    label="name"
    showChevron
  >
    <div slot="item" let:item class="search--result-item">
      <p class="search--result-item-text">{item.name}</p>
      <p class="search--result-item-subtext">
        {item.category === "category" ? "Category" : item.category}
      </p>
    </div>
    <div slot="chevron-icon" class="icon-wrapper"><IconSearch /></div>
  </Select>
</div>

<style>
  .search--result-item-text {
    margin: 0;
    font-size: var(--font-size-large);
    color: var(--color-gray-shade-darker);
  }
  .search--result-item-subtext {
    color: var(--color-gray-shade-darker);
    margin: 0;
    font-size: var(--font-size-small);
    text-transform: uppercase;
  }
  .search :global(.list-item) {
    border-bottom: solid 1px var(--color-gray-shade-lighter);
    white-space: normal;
  }
  .search :global(.item) {
    overflow: visible !important;
    white-space: normal !important;
    height: auto !important;
  }
  .search :global(input) {
    font-family: var(--font-family-sans-alt);
    font-weight: var(--font-weight-bold);
    --font-size: 24px;
  }
  .search {
    width: 100%;
    --border-radius: 0;
    --border: solid 1px var(--color-gray-shade-medium);
    --border-focused: solid 1px var(--color-blue, #1696d2);
    --chevron-color: var(--color-blue, #1696d2);
    --placeholder-color: var(--color-gray-shade-darker, #696969);
    --list-item-overflows: ;
    --input-color: var(--color-black, #000000);

    /* list */
    --list-border-radius: 0;
    --item-first-border-radius: 0;
    --input-padding: 0;
    --internal-padding: 0;
    /* --internal-padding: var(--spacing-8); */
    --item-padding: var(--spacing-4);
    --item-height: auto;
    --list-border: solid 1px var(--color-gray-shade-lighter);

    /* items */
    --item-is-active-bg: var(--color-gray-shade-lightest);
    --item-is-active-color: var(--color-black);
    --item-hover-bg: var(--color-gray-shade-lightest);
    --item-hover-color: var(--color-black);
    --selected-item-color: var(--color-black);
    --height: 52px;
  }
  :global(.select .svelte-select input) {
    font-family: var(--font-family-sans-alt);
    color: var(--color-black, #000000);
  }
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
