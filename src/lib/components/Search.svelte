<script context="module">
  /**
   * Data for search
   * @typedef {Object} SearchData
   * @property {string} name - The name to search for
   * @property {"state" | "county" | "program" | "program-categories" } category - The type of item to display in search results
   * @property {"string"} route_param - What to put at the end of the route when item is selected
   */
</script>

<script>
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { format_category_name, get_program_name} from "$lib/utils";
  import search_data from "$data/search.json";
  import Typeahead from "svelte-typeahead";

  const states_to_include = ["24", "36", "48"];
  const filter_counties = false;

  /**
   * @type {SearchData[]}
   */
  export let data = search_data.map((item) => {
    if (item.category !== "program") {
      return item;
    }
    return Object.assign({}, item, {name: get_program_name(item.route_param.replaceAll("-", "_"))})
  });
  $: if(filter_counties) {
    data = data.filter(
      ({ category, route_param }) =>
        category !== "county" ||
        states_to_include.includes(route_param.substring(0, 2))
    );
  }

  let value = "";

  export let limit = 10;
  /**
   * @type {(data: SearchData) => string}
   */
  const extract = ({ name, category }) => category === "program-categories" ? format_category_name(name) : name;

  export let label = "Search";
  export let placeholder = "Search";

  /**
   * Listener for on:select for the Typeahead component. Navigates to the selected item's page.
   * @type {(e: CustomEvent) => void}
   */
  function handleSelect(e) {
    const { category, route_param, page_id } = e.detail.original;
    value = "";
    let url = `${base}/${category}`;
    if (route_param) {
      url += `/${route_param}`;
    }
    if (page_id) {
      url += `#${page_id}`;
    }
    goto(url);
  }
</script>

<div class="search">
  <Typeahead
    {data}
    bind:value
    {extract}
    {label}
    hideLabel
    {placeholder}
    let:result
    let:index
    {limit}
    on:select={handleSelect}
  >
    {#if result.original.category === "program-categories"}
      <p class="search--result-item-text">{@html result.string}</p>
      <p class="search--result-item-subtext">Category</p>
    {:else}
      <p class="search--result-item-text">{@html result.string}</p>
      <p class="search--result-item-subtext">{@html result.original.category}</p>
    {/if}
  </Typeahead>
</div>

<style>
  :global([data-svelte-typeahead] input) {
    color: var(--color-black, black);
    font-style: italic;
    font-family: var(--font-family-sans);
    min-height: 52px;
    border: 1px solid var(--color-gray-shade-medium) !important;
  }
  :global([data-svelte-typeahead] mark) {
    background-color: var(--color-gray-shade-lightest) !important;
    color: var(--color-gray-shade-darker);
  }
  :global([data-svelte-typeahead] li.selected:hover),
  :global([data-svelte-typeahead] li.selected) {
    background-color: var(--color-gray-shade-lightest) !important;
  }
  .search {
    width: 100%;
  }
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
</style>
