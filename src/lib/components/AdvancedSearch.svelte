<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import search_data from "$data/server/search.json";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import categories_simple from "$data/server/categories_simple.json";
  import Select from "$components/Select.svelte";
  import Button from "$components/common/Button.svelte";
  import { slugify_program } from "$lib/utils";
  import { category_display_name } from "$stores/categories.js";
  import site_content from "$data/site_content.aml";
  import { logClickToGA } from "$lib/analytics";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const category_options = categories_simple
    .map(({ category }) => ({
      value: category,
      label: category_display_name(category),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // variables for category search
  /** @type {string | undefined} */
  let category_search_selected;

  // variables for location search
  /** @type {string | undefined} */
  let location_search_selected_state;
  /** @type {string | undefined} */
  let location_search_selected_county;
  /** @type {string | undefined} */
  let location_search_selected_cbsa;
  /** @type {string | undefined} */
  let location_search_selected_category;

  const state_options = search_data
    .filter(({ category }) => category === "state")
    .map(({ name, route_param }) => ({
      value: /** @type {string} */ (route_param),
      label: /** @type {string} */ (name),
    }));
  const cbsa_options = search_data
    .filter(({ category }) => category === "cbsa")
    .map(({ name, route_param }) => ({
      value: /** @type {string} */ (route_param),
      label: /** @type {string} */ (name),
    }));
  $: location_search_county_options = search_data
    .filter(
      ({ category, route_param }) =>
        category === "county" &&
        (location_search_selected_state
          ? location_search_selected_state === route_param?.substr(0, 2)
          : true)
    )
    .map(({ name, route_param }) => ({
      value: /** @type {string} */ (route_param),
      label: /** @type {string} */ (name),
    }));

  // A selection that no longer fits is dropped instead of being left to win
  // in go_to_location: a county belongs to one state, and a county and a CBSA
  // are alternative destinations (review #4). One block rather than one
  // statement per rule, because two statements that each clear the other's
  // variable form a reactive cycle the compiler rejects.
  let prev_selected_state = location_search_selected_state;
  let prev_selected_county = location_search_selected_county;
  let prev_selected_cbsa = location_search_selected_cbsa;
  $: {
    if (location_search_selected_state !== prev_selected_state) {
      prev_selected_state = location_search_selected_state;
      location_search_selected_county = undefined;
    }
    if (location_search_selected_county !== prev_selected_county) {
      prev_selected_county = location_search_selected_county;
      if (location_search_selected_county) {
        location_search_selected_cbsa = undefined;
      }
    }
    if (location_search_selected_cbsa !== prev_selected_cbsa) {
      prev_selected_cbsa = location_search_selected_cbsa;
      if (location_search_selected_cbsa) {
        location_search_selected_county = undefined;
      }
    }
  }

  function go_to_category() {
    goto(
      `${base}/program-categories/${slugify_program(
        /** @type {string} */ (category_search_selected)
      )}/`
    );
  }

  function go_to_location() {
    const category_param = location_search_selected_category
      ? "?category=" + location_search_selected_category
      : "";
    if (location_search_selected_cbsa) {
      goto(`${base}/cbsa/${location_search_selected_cbsa}/${category_param}`);
    } else if (location_search_selected_county) {
      goto(
        `${base}/county/${location_search_selected_county}/${category_param}`
      );
    } else {
      goto(`${base}/state/${location_search_selected_state}/${category_param}`);
    }
  }
</script>

<div class="advanced-search">
  <button
    class="advanced-search--close-button"
    on:click={() => dispatch("close")}
    aria-label="Close advanced search"
  >
    ✕
  </button>
  <div class="advanced-search--program-search">
    <h2 class="advanced-search--subhead">
      {site_content.search.advanced_subhead_a}
    </h2>
    <p class="advanced-search--text">{site_content.search.advanced_text_a}</p>
    <p class="advanced-search--label">Category</p>
    <Select
      items={category_options}
      chevron_color="var(--color-gray-shade-dark)"
      bind:value={category_search_selected}
      placeholder="Select a category"
      clearable
      on:change={(e) => {
        logClickToGA(
          e.target,
          "advanced-search-category-select--" + category_search_selected
        );
      }}
    />
    <div class="spacing" />
    <Button
      style="black"
      disabled={!category_search_selected}
      on:click={(e) => {
        go_to_category();
        logClickToGA(e.target, "advanced-search--category-search");
      }}>Search</Button
    >
  </div>
  <div class="advanced-search--place-search">
    <h2 class="advanced-search--subhead">
      {site_content.search.advanced_subhead_b}
    </h2>
    <p class="advanced-search--text">{site_content.search.advanced_text_b}</p>
    <div class="advanced-search--column-group">
      <div class="advanced-search--filter-group">
        <p class="advanced-search--label">State</p>
        <Select
          items={state_options}
          chevron_color="var(--color-gray-shade-dark)"
          bind:value={location_search_selected_state}
          placeholder="Select a state"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-state-select--" +
                location_search_selected_state
            );
          }}
          clearable
        />
        <div class="spacing" />
        <p class="advanced-search--label">County</p>
        <Select
          items={location_search_county_options}
          chevron_color="var(--color-gray-shade-dark)"
          bind:value={location_search_selected_county}
          placeholder="Select a county"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-county-select--" +
                location_search_selected_county
            );
          }}
          clearable
        />
        <div class="spacing" />
        <p class="advanced-search--label">CBSA</p>
        <Select
          items={cbsa_options}
          bind:value={location_search_selected_cbsa}
          chevron_color="var(--color-gray-shade-dark)"
          placeholder="Select a CBSA"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-cbsa-select--" +
                location_search_selected_cbsa
            );
          }}
          clearable
        />
      </div>
      <div class="advanced-search--filter-group">
        <p class="advanced-search--label">Category</p>
        <Select
          items={category_options}
          bind:value={location_search_selected_category}
          placeholder="Select a category"
          chevron_color="var(--color-gray-shade-dark)"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-category-select--" +
                location_search_selected_category
            );
          }}
          clearable
        />
        <div class="spacing" />
        <Button
          style="black"
          disabled={!location_search_selected_county &&
            !location_search_selected_state &&
            !location_search_selected_cbsa}
          on:click={(e) => {
            logClickToGA(e.target, "advanced-search--location-search");
            go_to_location();
          }}>Search</Button
        >
      </div>
    </div>
  </div>
</div>

<style>
  .advanced-search {
    position: relative;
    padding-block: 72px;
  }
  .advanced-search--close-button {
    position: absolute;
    top: var(--spacing-4);
    right: var(--spacing-4);
    background-color: var(--color-black);
    color: var(--color-white);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .advanced-search--subhead {
    font-weight: var(--font-weight-bold);
    font-size: 28px;
    line-height: 36px;
    margin-bottom: var(--spacing-4);
  }
  .advanced-search--text {
    margin-bottom: var(--spacing-4);
  }
  .advanced-search--label {
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-sans-alt);
    text-transform: uppercase;
    font-size: 16px;
    line-height: 24px;
    margin-bottom: var(--spacing-1);
  }
  @media (min-width: 768px) {
    .advanced-search {
      display: flex;
    }
    .advanced-search--program-search {
      width: 33.33%;
      border-right: solid 1px var(--color-gray-shade-light);
      padding-right: var(--spacing-20);
    }
    .advanced-search--place-search {
      width: 66.66%;
      flex-grow: 1;
      padding-left: var(--spacing-20);
    }
    .advanced-search--column-group {
      display: flex;
      column-gap: var(--spacing-12);
    }
    .advanced-search--filter-group {
      width: 50%;
    }
  }
</style>
