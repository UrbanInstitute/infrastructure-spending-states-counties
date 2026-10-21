<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @component
  Generates an SVG Choropleth map with program selection and data fetching.
  Fetches its own funding data based on `selected_program` and `map_level` props.
 -->
<script>
  import { base } from "$app/paths";
  import { browser } from "$app/environment";
  import { get_program_name, slugify_program } from "$lib/utils";
  import { category_display_name } from "$stores/categories";
  import { logClickToGA } from "$lib/analytics";
  import { get_funding_data } from "$stores/funding_data";
  import { LoadingWrapper } from "@urbaninstitute/dataviz-components";
  import Map from "$components/Map";
  import ProgramSelect from "$components/ProgramSelect.svelte";

  /**
   * FIPS code of feature to highlight
   * @type {String | null}
   * @optional
   **/
  export let highlight_fips = null;

  /**
   * What level of the map to show
   * @type {"state" | "county" | "cbsa"}
   * @default "state"
   **/
  export let map_level = "state";

  /**
   * Currently selected program (or category) identifier
   * @type {string}
   **/
  export let selected_program = "cdbg_entitlement";

  /**
   * Options for the selector dropdown. If null, no selector is shown.
   * @type {{"name": string, "short_name": string, "type"?: string}[] | null}
   */
  export let programs = null;

  /**
   * Whether `selected_program` and `programs` identify federal programs or
   * infrastructure categories. Drives the selector's labels and placeholder,
   * the analytics control name, and where the link below the map points.
   * @type {"program" | "category"}
   **/
  export let option_type = "program";

  /**
   * Scopes a county-level map to one state, by that state's 2-digit FIPS code.
   * Leave it `null` for the national county map. Forwarded to `Map`, which
   * documents the distinction.
   * @type {string | null}
   */
  export let county_state_fips = null;

  export let show_program_link = true;

  export let show_select_label = false;

  /**
   * Optional caveat for the level on show, e.g. what a CBSA-level total counts.
   * Rendered as a small note under the map, inside whatever card holds it —
   * pages swap it as `map_level` changes.
   * @type {string | null}
   * @optional
   **/
  export let note = null;

  /**
   * Units line shown above the map's color legend.
   * @type {string | null}
   * @optional
   **/
  export let legend_title = null;

  $: is_category = option_type === "category";
  $: get_option_label = is_category ? category_display_name : get_program_name;
  $: select_placeholder = is_category
    ? "Search for an infrastructure category"
    : "Search for a specific program";
  $: select_ga_control = is_category
    ? "category-select-map"
    : "program-select-map";
  $: detail_url = `${base}/${
    is_category ? "program-categories" : "program"
  }/${slugify_program(selected_program)}/`;

  // Internal data state
  /** @type {Array<Record<string, any>>} */
  let data_layer = [];
  let has_loaded = false;

  // Tracks which fetch is the current one. Responses arrive out of order —
  // a 404 comes back faster than a 200 — and without this the *last to resolve*
  // won rather than the last to be issued, so the map could settle on data the
  // selector was no longer labelling. A geography page reliably hit this: it
  // requests the default category at init and the deep link's category after
  // mount, and the slower of the two overwrote the other.
  let request_id = 0;

  // Fetch funding data reactively when program or level changes.
  // `option_type` also picks the data directory — see `get_funding_data`.
  $: if (browser && selected_program) {
    const this_request = ++request_id;
    get_funding_data(selected_program, map_level, option_type).then((data) => {
      // A newer selection has been made since this fetch started; drop it.
      if (this_request !== request_id) return;
      data_layer = Array.from(data.values());
      has_loaded = true;
    });
  }
</script>

<div class="map-container">
  <div class="map-controls">
    {#if programs}
      <ProgramSelect
        {programs}
        show_label={show_select_label}
        get_label={get_option_label}
        placeholder={select_placeholder}
        on:change={(e) => {
          logClickToGA(e.target, `${select_ga_control}--${selected_program}`);
        }}
        bind:value={selected_program}
      />
    {/if}
  </div>
  {#if !has_loaded}
    <LoadingWrapper>
      <div class="loading-block" style="height: 500px;" />
    </LoadingWrapper>
  {:else}
    <Map
      {highlight_fips}
      {data_layer}
      link_program={selected_program}
      color_key="funding_per_1k"
      {map_level}
      {county_state_fips}
      {option_type}
      {legend_title}
    >
      {#if show_program_link}
        <a
          class="button-link program-link"
          href={detail_url}
          on:click={(event) =>
            logClickToGA(event.target, "map-link-click--full-program-analysis")}
          >View category</a
        >
      {/if}
    </Map>
  {/if}
  {#if note}
    <p class="map-note">{note}</p>
  {/if}
</div>

<style>
  .map-controls {
    margin: var(--spacing-4) auto 0;
    max-width: var(--body-width);
  }
  /* Centred under the map, per design/homepage.png. `a.button-link` is
     inline-block, so it needs an explicit box to centre. */
  .program-link {
    display: block;
    width: fit-content;
    margin-block-start: var(--spacing-6);
    margin-inline: auto;
  }
  @media (min-width: 768px) {
    .map-controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>
