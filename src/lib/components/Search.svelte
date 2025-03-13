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
  import { format_category_name, get_program_name } from "$lib/utils";
  import search_data from "$data/server/search.json";
  import Select from "svelte-select";

  const states_to_include = ["24", "36", "48"];
  const filter_counties = false;

  /**
   * @type {SearchData[]}
   */
  export let data = search_data.map((item) => {
    if (item.category === "program-categories") {
      item.name = format_category_name(item.name);
      return item;
    } else if (item.category !== "program") {
      return item;
    }
    return Object.assign({}, item, {
      name: get_program_name(item.route_param?.replaceAll("-", "_")),
    });
  });
  $: if (filter_counties) {
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
  const extract = ({ name, category }) =>
    category === "program-categories" ? format_category_name(name) : name;

  export let label = "Search";
  export let placeholder = "Search";

  /**
   * Listener for on:select for the Typeahead component. Navigates to the selected item's page.
   * @type {(e: CustomEvent) => void}
   */
  function handleSelect(e) {
    const { category, route_param, page_id } = e.detail;
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
  <Select items={data} searchable on:select={handleSelect} {placeholder} label="name">
    <div slot="item" let:item class="search--result-item">
      <p class="search--result-item-text">{item.name}</p>
      <p class="search--result-item-subtext">
        {item.category === "program-categories" ? "Category" : item.category}
      </p>
    </div>
  </Select>
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
    font-family: inherit;
    font-style: italic;
  }
  .search {
    width: 100%;
    --border-radius: 0;
    --border: solid 1px var(--color-gray-shade-medium);
    --border-focused: solid 1px var(--color-blue, #1696d2);
    --chevron-color: var(--color-blue, #1696d2);
    --placeholder-color: var(--color-gray-shade-darker, #696969);
    --list-item-overflows:
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
    font-family: var(--font-family-sans);
    color: var(--color-black, #000000);
  }
</style>
