<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @componentmap
  Generates an SVG Choroplet map.
 -->
<script>
  import { LoadingWrapper } from "@urbaninstitute/dataviz-components";
  import { fade } from "svelte/transition";
  import { raise, dollarsToString } from "$lib/utils";
  import { geoMercator, geoPath } from "d3-geo";
  import { scaleQuantile } from "d3-scale";
  import { format } from "d3-format";
  import { geoAlbersUsaPr } from "./projections.js";
  import { feature } from "topojson-client";
  import { base } from "$app/paths";
  import { current_tooltip } from "$stores/tooltip";
  import { logClickToGA } from "$lib/analytics";
  import { program_to_category } from "$stores/map_category";

  const tickFormat = format("$.2~s");

  /**
   * @typedef {import("geojson").FeatureCollection} FeatureCollection
   */

  /**
   * Geojson data for main map layer
   * @type {FeatureCollection}
   **/
  let geo_data_layer = {
    type: "FeatureCollection",
    features: [],
  };

  /** @type {FeatureCollection | undefined} */
  let geo_data_base_layer;

  /**
   * FIPS code of feature to highlight
   * @type {String | null}
   * @optional
   **/
  export let highlight_fips = null;

  /**
   * What level of the map to show
   * @type {"state" | "county" | "cbsa"}
   **/
  export let map_level;

  /**
   * Data for choropleth map layer
   * @type {Array<Record<string, any>>}
   * @required
   **/
  export let data_layer;

  /**
   * What variable to display on the choropleth
   * @type {string}
   * @required
   **/
  export let color_key;

  /**
   * Scopes a county-level map to a single state, by that state's 2-digit FIPS
   * code. This is the state pages' view: "the 58 counties of California",
   * drawn to fill the frame.
   *
   * Leave it `null` at `map_level="county"` for the **national** county map —
   * all 3,222 counties in the same AlbersUSA frame the state and CBSA maps use.
   * That is what the home and category pages draw.
   *
   * Ignored at any other `map_level`.
   * @type {string | null}
   * @optional
   **/
  export let county_state_fips = null;

  /**
   * Optional layer key to send to linked pages
   * @type {string | null}
   * @optional
   **/
  export let link_program = null;

  export let no_data = false;

  /**
   * Optional units line shown above the color legend, e.g. "Funding amount per
   * 1,000 residents". It goes with the legend, so it is hidden with it.
   * @type {string | null}
   * @optional
   **/
  export let legend_title = null;

  /**
   * What the map's selector picks — used to describe the map to screen readers
   * @type {"program" | "category"}
   * @optional
   **/
  export let option_type = "program";

  // will bind this to the width of the container
  let container_width = 960;

  $: map_level_label =
    map_level === "county"
      ? "county"
      : map_level === "cbsa"
      ? "core-based statistical area"
      : "state";
  $: label = `A map displaying funding per 1,000 residents for the selected ${option_type} by ${map_level_label}`;

  // Geography links carry the *category* the destination can select, never a
  // program. The geography pages' maps are category-driven, so a program slug
  // here used to land the visitor on a map labelled with that program and
  // filled with the default category's data. Those pages resolve programs too,
  // but emitting the category keeps the URL honest and stops a stale value
  // riding along as the visitor clicks from place to place.
  //
  // The param is `category` to match what it holds. It was `program` through
  // the program-centric version of the tool, and the geography routes still
  // accept that spelling so links already in the wild keep working — but
  // nothing generates it any more.
  //
  // An unresolvable value drops the param rather than passing something on:
  // the destination's default is the right answer and needs no query string.
  $: link_category =
    option_type === "category"
      ? link_program
      : program_to_category(link_program);
  $: link_query = link_category ? `?category=${link_category}` : "";

  // The two county maps are different maps and only this flag tells them apart.
  // A *scoped* county map draws one state and is fitted to whatever shape that
  // state happens to be; a *national* one draws the whole country and belongs in
  // the same frame as the state and CBSA maps. Everything below that used to
  // branch on `map_level === "county"` branches on this instead — projection,
  // height, sizing and which geometry to fetch. Getting this wrong is not a
  // subtle bug: a national county map drawn through the scoped path Mercators
  // Alaska off the top of the frame.
  $: is_scoped_county = map_level === "county" && Boolean(county_state_fips);
  $: is_national_county = map_level === "county" && !county_state_fips;

  // will bind this to the height of the container
  $: container_height = is_scoped_county ? 400 : container_width * 0.68;

  // geoData with properties attached.
  //
  // Keyed by FIPS rather than scanned with `.find()` per feature: at 52 states
  // the scan cost nothing, but the national county map turns it into ~10.4M
  // comparisons (3,222 × 3,222) and redoes them every time the category or the
  // level changes.
  $: data_by_fips = new Map(data_layer.map((d) => [d["fips"], d]));
  $: geo_features_with_props = geo_data_layer.features.map((feature) => {
    const data = data_by_fips.get(feature.properties?.["fips"]);
    return {
      ...feature,
      properties: {
        ...feature.properties,
        ...data,
      },
    };
  });

  // projection function to use
  /** @type {any} */
  let projectionFunc;
  $: projectionFunc = is_scoped_county ? geoMercator : geoAlbersUsaPr;

  // what feature to size the projection to
  $: fitFeature = geo_data_layer;

  // projection and path are also calculated reactively based on container_width and maxHeight
  $: projection = is_scoped_county
    ? projectionFunc().fitSize([container_width, container_height], fitFeature)
    : projectionFunc()
        .scale(container_width * 1.2)
        .translate([container_width / 2, container_height / 2]);
  $: path = geoPath().projection(projection);

  /**
   * @type {string[]}
   **/
  const colors_for_scale = ["#CFE8F3", "#73BFE2", "#1696D2", "#0A4C6A"];
  /**
   * @param {number[]} domain
   * @returns {import("d3-scale").ScaleQuantile<string>}
   */
  function make_color_scale(domain) {
    const scale = /** @type {import("d3-scale").ScaleQuantile<string>} */ (
      scaleQuantile()
    );
    return scale.domain(domain).range(colors_for_scale);
  }
  $: color_scale = make_color_scale(
    data_layer.map((d) => d[color_key]).filter((d) => d > 0)
  );
  $: color_scale_quantiles = color_scale.quantiles();
  $: quantiles_differ = color_scale_quantiles[0] !== color_scale_quantiles[1];

  $: get_color = function (/** @type {number} */ val) {
    if (no_data) {
      return "#e3e3e3";
    }
    if (val === 0 || !val) {
      return "#d2d2d2";
    } else {
      return color_scale(val);
    }
  };

  let geo_data = new Promise(() => {});

  /**
   * @returns {Promise<import("geojson").FeatureCollection>}
   */
  async function get_states_geo() {
    const data = await (
      await fetch(`${base}/data/cb_2023_us_state_500k.json`)
    ).json();
    return /** @type {any} */ (feature(data, data.objects.states));
  }

  /**
   * @returns {Promise<import("geojson").FeatureCollection>}
   */
  async function get_cbsa_geo() {
    const data = await (
      await fetch(`${base}/data/cb_2021_us_cbsa_500k.json`)
    ).json();
    return /** @type {any} */ (feature(data, data.objects.cbsas));
  }

  /**
   * @param {string} fips
   * @returns {Promise<import("geojson").FeatureCollection>}
   */
  async function get_counties_geo(fips) {
    if (!fips || fips.length !== 2) {
      throw new Error("Invalid FIPS code");
    }
    const data = await (
      await fetch(`${base}/api/county-geo/${fips}.json`)
    ).json();
    return /** @type {any} */ (feature(data, data.objects.counties));
  }

  /**
   * All 3,222 counties, for the national county map.
   *
   * A separate file from the per-state endpoint above, and deliberately so: it
   * is simplified harder because it draws the whole country at once. See the
   * Makefile target for why.
   * @returns {Promise<import("geojson").FeatureCollection>}
   */
  async function get_national_counties_geo() {
    const data = await (
      await fetch(`${base}/data/cb_2023_us_county_500k_national.json`)
    ).json();
    return /** @type {any} */ (feature(data, data.objects.counties));
  }

  $: if (county_state_fips || map_level) {
    get_geo_data();
  }

  // Tracks which geometry fetch is the current one. `get_geo_data` runs on
  // every level change, and the topojson files differ in size (states 164 KB,
  // CBSAs 332 KB, national counties 624 KB), so on a cold cache a later,
  // smaller request can land before an earlier, larger one. Without this the
  // last response to *arrive* won: toggling CBSA → State let the state file
  // resolve first and the CBSA file then overwrite it, so the map drew CBSA
  // shapes while `map_level` was `state` — every feature grey, because no
  // FIPS matched the state data, and every link pointing at
  // `/state/<cbsa fips>/`. Same guard as the data fetch in `FundingMap`.
  // `{#await geo_data}` already ignores a superseded promise; it is the
  // side-effect assignments to the two layers below that need it.
  let geo_request_id = 0;

  async function get_geo_data() {
    const this_request = ++geo_request_id;
    if (is_scoped_county) {
      geo_data = get_counties_geo(
        /** @type {string} */ (county_state_fips)
      ).then((data) => {
        // A newer level has been requested since this fetch started; drop it.
        if (this_request !== geo_request_id) return data;
        geo_data_layer = data;
        return data;
      });
    } else if (is_national_county || map_level === "cbsa") {
      // Both of these draw the states underneath as well. The CBSA map needs
      // them because CBSAs cover only part of the country and the rest would
      // otherwise be blank; the county map needs them only as an overlay, to
      // keep 3,222 near-identical shapes from reading as one field. Fetching
      // the base layer is the same job either way — see the markup for how the
      // two differ in what they draw with it.
      //
      // The two files are requested together, not the base layer after the
      // main one has landed, and the map renders once both are in: the
      // states file is the smaller of the two, so this costs nothing in the
      // common case and spares the base layer popping in under a map that
      // has already drawn.
      const get_main_layer = is_national_county
        ? get_national_counties_geo
        : get_cbsa_geo;
      geo_data = Promise.all([get_main_layer(), get_states_geo()]).then(
        ([data, base_data]) => {
          if (this_request !== geo_request_id) return data;
          geo_data_layer = data;
          geo_data_base_layer = base_data;
          return data;
        }
      );
    } else {
      geo_data = get_states_geo().then((data) => {
        if (this_request !== geo_request_id) return data;
        geo_data_layer = data;
        return data;
      });
    }
  }

  /**
   * @param {MouseEvent} event
   * @param {{properties: Record<string, any>}} data
   */
  function show_tooltip(event, data) {
    if (no_data) return;
    const tooltip_label = data.properties.name;
    const tooltip_content = [
      {
        text: `<strong>${tooltip_label}</strong>`,
      },
      {
        label: "",
        text: dollarsToString(data.properties[color_key]),
      },
    ];
    $current_tooltip = {
      xPosition: event.pageX,
      yPosition: event.pageY,
      content: tooltip_content,
    };
  }

  /**
   * @param {MouseEvent} event
   * @param {any} [data]
   */
  function handle_mouseover(event, data) {
    raise(
      /** @type {Element} */ (/** @type {Element} */ (event.target).parentNode)
    );
  }

  /**
   * Which place a map click reports to analytics.
   *
   * This used to read `properties.county` at county level and
   * `properties.state` everywhere else. **Neither key exists.** The geometry
   * carries only `fips` (the Makefile's `-each` reduces it to that, plus
   * `state_fips` on the per-state county file), and the funding rows joined
   * onto it carry `fips`, `name`, `funding` and `funding_per_1k`. So every map
   * click on every page has been logging the literal string
   * `map-click--undefined` — not just the county view.
   *
   * FIPS is what identifies a place unambiguously across all three levels, and
   * it is what the destination URL is keyed by, so it is what gets logged.
   * @param {{properties: Record<string, any>}} feature
   * @returns {string}
   */
  function map_click_value(feature) {
    return `map-click--${feature.properties.fips}`;
  }
</script>

<!-- `data-sveltekit-preload-data="hover"` on `<body>` would otherwise apply to
     every `<a>` below: each pause of the cursor over a feature fetched that
     page's prerendered `__data.json` (about 20 KB for a county, 11 KB for a
     CBSA, 7.5 KB for a state), and the national county map has 3,222 of them.
     `tap` keeps the preload on mousedown / touchstart, so a click loses
     nothing. SvelteKit reads the option from the anchor's closest ancestor
     that sets it, SVG anchors included (`get_router_options` in
     `@sveltejs/kit/src/runtime/client/utils.js`). -->
<div
  class="map-container"
  bind:clientWidth={container_width}
  data-sveltekit-preload-data="tap"
>
  {#await geo_data}
    <LoadingWrapper>
      <div class="loading-block" style="height: 500px;" />
    </LoadingWrapper>
  {:then _}
    <svg
      width={container_width}
      height={container_height}
      in:fade={{ duration: 500 }}
      role="img"
      aria-label={label}
    >
      <!-- CBSAs cover only part of the country, so they are drawn onto a grey
           map of the states. Counties tile it completely — there is nothing to
           show through — so the national county map skips this layer and takes
           only the outline below. -->
      {#if map_level === "cbsa" && geo_data_base_layer}
        <g>
          {#each geo_data_base_layer.features as feature}
            <path d={path(feature)} fill="#f5f5f5" class="bg-feature" />
          {/each}
        </g>
      {/if}
      <g>
        {#each geo_features_with_props as feature}
          <a href="{base}/{map_level}/{feature.properties.fips}{link_query}">
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions a11y-mouse-events-have-key-events -->
            <path
              d={path(feature)}
              fill={get_color(feature.properties[color_key])}
              stroke="#ffffff"
              class="main-feature"
              on:mouseover={handle_mouseover}
              on:mouseleave={() => ($current_tooltip = null)}
              on:mousemove={(e) => show_tooltip(e, feature)}
              on:click={(e) => logClickToGA(e.target, map_click_value(feature))}
            />
          </a>
        {/each}
      </g>
      <!-- State lines over the top. On the CBSA map they separate the drawn
           areas from the grey ground; on the national county map they are what
           keeps 3,222 shapes at 0.5px strokes from reading as one field. 1px,
           white, so it sits at double the weight of the county borders. -->
      {#if (map_level === "cbsa" || is_national_county) && geo_data_base_layer}
        <g>
          {#each geo_data_base_layer.features as feature}
            <path
              d={path(feature)}
              fill="none"
              stroke="#ffffff"
              stroke-width="1"
              class="bg-feature"
            />
          {/each}
        </g>
      {/if}
      {#if highlight_fips}
        <g>
          {#each geo_features_with_props as feature}
            {#if feature.properties?.fips === highlight_fips}
              <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
              <path
                d={path(feature)}
                fill="none"
                stroke="#fdbf11"
                stroke-width="4"
                on:mousemove={(e) => show_tooltip(e, feature)}
                on:click={(e) =>
                  logClickToGA(e.target, map_click_value(feature))}
              />
            {/if}
          {/each}
        </g>
      {/if}
    </svg>
  {/await}
</div>

{#if !no_data}
  <div class="map--footer">
    {#if legend_title}
      <p class="color-scale--title">{legend_title}</p>
    {/if}
    <div class="color-scale--wrapper">
      <div class="color-scale--labels">
        <div
          class="color-scale--label"
          class:single-label={!color_scale_quantiles[0]}
          style="left: {(100 / (color_scale.range().length + 1)) * 1}%"
        >
          $0
        </div>
        {#if quantiles_differ}
          {#each color_scale_quantiles as quantile, i}
            {#if quantile}
              <div
                class="color-scale--label"
                style:left={`${
                  (100 / (color_scale.range().length + 1)) * (i + 2)
                }%`}
              >
                {tickFormat(quantile)}
              </div>
            {/if}
          {/each}
        {:else if color_scale_quantiles[color_scale_quantiles.length - 1]}
          <div
            class="color-scale--label"
            style:left={`${(100 / (color_scale.range().length + 1)) * 2}%`}
          >
            {tickFormat(
              color_scale_quantiles[color_scale_quantiles.length - 1]
            )}
          </div>
        {/if}
      </div>
      <div class="color-scale--color-bars">
        <div
          class="color-scale--color-bar"
          style="background-color: {get_color(0)}"
        />
        {#if color_scale_quantiles[0] && quantiles_differ}
          {#each color_scale.range() as color, i}
            <div
              class="color-scale--color-bar"
              style="background-color: {color}"
            />
          {/each}
        {:else if color_scale_quantiles[0]}
          <div
            class="color-scale--color-bar"
            style="background-color: {color_scale.range()[
              color_scale.range().length - 1
            ]}"
          />
        {/if}
        <!-- <div class="color-scale--color-bar" style="background-color: {get_color(}"></div> -->
      </div>
    </div>
    <slot />
  </div>
{/if}

<style>
  path.main-feature:hover {
    stroke: #353535;
    stroke-width: 2px;
  }
  path.main-feature {
    stroke-width: 0.5px;
  }
  .color-scale--color-bars {
    display: flex;
    justify-content: flex-start;
    max-width: 250px;
    margin: 0;
  }
  .color-scale--color-bar {
    width: 100%;
    flex-shrink: 1;
    flex-grow: 0;
    max-width: 80px;
    height: 20px;
  }
  .color-scale--labels {
    position: relative;
    font-size: var(--font-size-small);
    max-width: 250px;
    margin: 0;
    height: 1.5em;
    /* top: -45px; */
  }
  .color-scale--label {
    position: absolute;
  }
  .color-scale--label.single-label {
    position: static;
    text-align: center;
  }
  /* Wider than the 250px legend, so the units line can run on one line. */
  .color-scale--title {
    font-size: var(--font-size-small);
    text-align: center;
    margin-block: 0 var(--spacing-2);
  }
  .color-scale--wrapper {
    margin-bottom: var(--spacing-4);
    margin-inline: auto;
    max-width: 100%;
    width: 250px;
  }
  @media (min-width: 768px) {
  }
</style>
