<!--
  @componentmap
  Generates an SVG Choroplet map.
 -->
<script>
  import { onMount } from "svelte";
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

  let geo_data_base_layer;

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
   * @type {"state" | "county" | "cbsa"}
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
   * What variable to display on the choropleth
   * @type {string}
   * @required
   **/
  export let color_key;

  /**
   * What key to join the data_layer to the geo_data_layer on
   * @type {string} [fips]
   */
  export let join_key = "fips";

  /**
   * Optional state FIPS code to load counties for
   * @type {string | null}
   * @optional
   **/
  export let show_counties = null;

  /**
   * Optional layer key to send to linked pages
   * @type {string | null}
   * @optional
   **/
  export let link_program = null;

  export let no_data = false;

  // will bind this to the width of the container
  let container_width = 960;

  $: label =
    map_level === "state"
      ? "A map displaying funding per 1,000 residents for the selected program by state"
      : "A map displaying funding per 1,000 residents by county";

  // will bind this to the height of the container
  $: container_height = map_level == "county" ? 400 : container_width * 0.68;

  // geoData with properties attached
  $: geo_features_with_props = geo_data_layer.features.map((feature) => {
    const data = data_layer.find(
      (d) => d[join_key] === feature.properties[join_key]
    );
    return {
      ...feature,
      properties: {
        ...feature.properties,
        ...data,
      },
    };
  });

  // projection function to use, based on map_level
  $: projectionFunc = map_level === "county" ? geoMercator : geoAlbersUsaPr;

  // what feature to size the projection to, will use bound_feature if provided, otherwise will use the geo_data_layer
  $: fitFeature = bound_feature || geo_data_layer;

  // projection and path are also calculated reactively based on container_width and maxHeight
  $: projection =
    map_level === "county"
      ? projectionFunc().fitSize(
          [container_width, container_height],
          fitFeature
        )
      : projectionFunc()
          .scale(container_width * 1.2)
          .translate([container_width / 2, container_height / 2]);
  $: path = geoPath().projection(projection);

  /**
   * @type {import("d3").ScaleQuantile<number, string>}
   **/
  const colors_for_scale = ["#CFE8F3", "#73BFE2", "#1696D2", "#0A4C6A"];
  $: color_scale = scaleQuantile()
    .domain(data_layer.map((d) => d[color_key]).filter((d) => d > 0))
    .range(colors_for_scale);
  $: color_scale_quantiles = color_scale.quantiles();
  $: quantiles_differ = color_scale_quantiles[0] !== color_scale_quantiles[1];

  $: get_color = function (val) {
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
    return feature(data, data.objects.states);
  }

  /**
   * @returns {Promise<import("geojson").FeatureCollection>}
   */
  async function get_cbsa_geo() {
    const data = await (
      await fetch(`${base}/data/cb_2021_us_cbsa_500k.json`)
    ).json();
    return feature(data, data.objects.cbsas);
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
    return feature(data, data.objects.counties);
  }

  $: if (show_counties) {
    get_geo_data();
  }

  async function get_geo_data() {
    if (show_counties && map_level === "county") {
      geo_data = get_counties_geo(show_counties).then((data) => {
        geo_data_layer = data;
        return data;
      });
    } else if (map_level === "cbsa") {
      geo_data = get_cbsa_geo()
        .then((data) => {
          geo_data_layer = data;
          return data;
        })
        .then(() => {
          get_states_geo().then((data) => {
            geo_data_base_layer = data;
          });
        });
    } else {
      geo_data = get_states_geo().then((data) => {
        geo_data_layer = data;
        return data;
      });
    }
  }

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

  function handle_mouseover(event, data) {
    raise(event.target.parentNode);
  }

  onMount(() => {
    get_geo_data();
  });
</script>

<div class="map-container" bind:clientWidth={container_width}>
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
      {#if map_level === "cbsa" && geo_data_base_layer}
        <g>
          {#each geo_data_base_layer.features as feature}
            <path d={path(feature)} fill="#f5f5f5" class="bg-feature" />
          {/each}
        </g>
      {/if}
      <g>
        {#each geo_features_with_props as feature}
          <a
            href="{base}/{map_level}/{feature.properties
              .fips}?program={link_program ? link_program : color_key}"
          >
            <path
              d={path(feature)}
              fill={get_color(feature.properties[color_key])}
              stroke="#ffffff"
              class="main-feature"
              on:mouseover={handle_mouseover}
              on:mouseleave={() => ($current_tooltip = null)}
              on:mousemove={(e) => show_tooltip(e, feature)}
              on:click={(e) =>
                logClickToGA(
                  e.target,
                  "map-click--" +
                    (map_level == "county"
                      ? feature.properties.county
                      : feature.properties.state)
                )}
            />
          </a>
        {/each}
      </g>
      {#if map_level === "cbsa" && geo_data_base_layer}
        <g>
          {#each geo_data_base_layer.features as feature}
            <path
              d={path(feature)}
              fill="none"
              stroke="#ffffff"
              class="bg-feature"
            />
          {/each}
        </g>
      {/if}
      {#if highlight_fips}
        <g>
          {#each geo_features_with_props as feature}
            {#if feature.properties?.fips === highlight_fips}
              <path
                d={path(feature)}
                fill="none"
                stroke="#fdbf11"
                stroke-width="4"
                on:mousemove={(e) => show_tooltip(e, feature)}
                on:click={(e) =>
                  logClickToGA(
                    e.target,
                    "map-click--" +
                      (map_level == "county"
                        ? feature.properties.county
                        : feature.properties.state)
                  )}
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
    <div class="color-scale--wrapper">
      <p class="color-scale--title">Funding amount per 1,000 residents (2022 + 2023)</p>
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
                {tickFormat(Math.floor(quantile / 100) * 100)}
              </div>
            {/if}
          {/each}
        {:else if color_scale_quantiles[color_scale_quantiles.length - 1]}
          <div
            class="color-scale--label"
            style:left={`${(100 / (color_scale.range().length + 1)) * 2}%`}
          >
            {tickFormat(
              Math.floor(
                color_scale_quantiles[color_scale_quantiles.length - 1] / 100
              ) * 100
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
  .loading-indicator--wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
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
  .color-scale--title {
    font-size: var(--font-size-small);
    /* text-align: center; */
  }
  .color-scale--wrapper {
    margin-bottom: var(--spacing-4);
  }
  @media (min-width: 768px) {
    .map--footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
  }
</style>
