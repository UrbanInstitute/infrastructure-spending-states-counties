<!--
  @component
  Generates an SVG Choropleth map as well as layer toggles and controls.
 -->
<script>
  import { base } from "$app/paths";
  import { slugify_program } from "$lib/utils";
  import { logClickToGA } from "$lib/analytics";
  import Map from "$components/Map";
  import ProgramSelect from "$components/ProgramSelect.svelte";

  /**
   * @typedef {import("geojson").FeatureCollection} FeatureCollection
   */

  /**
   * FIPS code of feature to highlight
   * @type {String | null}
   * @optional
   **/
  export let highlight_fips = null;

  /**
   * Geojson feature to fit the projection to
   * @type {FeatureCollection | null}
   * @optional
   **/
  export let bound_feature = null;

  /**
   * What level of the map to show
   * @type {"state" | "county"}
   * @default "state"
   **/
  export let map_level = "state";

  /**
   * Data for choropleth map layer
   * @type {Array<Record<string, any>>}
   * @required
   **/
  export let data_layer;

  /**
   * @type {{"name": string, "short_name": string, "type": string}[] | null}
   */
  export let programs = null;

  /**
   * @type {string | null}
   */
  export let show_counties = null;

  export let color_key = "funding_per_1k";

  export let link_program = null;

  export let program_select = true;

  /**
   * @type {string | null}
   */
  export let program_state = null;

  let selected_program =
    map_level == "state" ? "fhwa_nhpp" : "cdbg_entitlement";

  /**
   * List of programs that require NYC special note
   */
  const nyc_programs = [
    "cdbg_entitlement",
    "coc",
    "home",
    "public_hsg",
    "public_hsg_cap",
    "hcv",
  ];

  $: if (
    program_state &&
    programs &&
    programs.map(({ short_name }) => short_name).includes(program_state)
  ) {
    selected_program = program_state;
  } else if (program_state) {
    selected_program = program_state;
  }

  $: map_color_key = program_select ? selected_program + "_per_1k" : color_key;
  $: has_data = Object.keys(data_layer[0]).includes(map_color_key);
</script>

<div class="map-container">
  <div class="map-controls">
    {#if programs}
      <ProgramSelect
        {programs}
        on:change={(e) => {
          // explicitly clear program state when user selects a new program
          program_state = null;
          logClickToGA(e.target, "program-select-map--" + selected_program);
        }}
        bind:value={selected_program}
      />
    {/if}
    {#if map_level == "county" && !has_data}
      <p class="help-text">
        <strong>Note:</strong> county-level data not available for selected program.
      </p>
    {/if}
  </div>
  <Map
    {highlight_fips}
    {bound_feature}
    {data_layer}
    no_data={!has_data}
    link_program={selected_program}
    color_key={map_color_key}
    {map_level}
    {show_counties}
  />
  {#if map_level == "county" && show_counties == "36" && nyc_programs.includes(selected_program)}
    <p class="chart-note">
      <strong>Notes:</strong> For this program, funding for New York City’s five
      counties was estimated by dividing the city’s total funding by county population
      share.
    </p>
  {/if}
  <p class="learn-more-link">
    <a
      href="{base}/program/{slugify_program(selected_program)}"
      on:click={(event) =>
        logClickToGA(event.target, "map-link-click--full-program-analysis")}
      >View full program analysis</a
    >
  </p>
</div>

<style>
  .map-controls {
    margin: var(--spacing-4) auto;
    max-width: var(--body-width);
  }
  .learn-more-link {
    font-size: var(--font-size-small);
    margin-top: 0.5em;
    text-align: center;
    text-transform: uppercase;
  }
  .learn-more-link a,
  .learn-more-link a:visited {
    color: var(--color-black);
  }
  .learn-more-link a:hover {
    color: var(--color-blue);
  }
</style>
