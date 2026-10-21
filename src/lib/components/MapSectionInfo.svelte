<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @component
  The heading / subhead / units-label / geography-toggle block that sits with
  every funding map. Placement differs by page — the home page's comp puts it
  inside the map card, the program, category and geography comps stack it above
  the card — so this component owns only the block and its analytics. Use
  `MapSection` for the stacked arrangement; drop this straight into a `Card` for
  the home page's.

  A map's level caveat is not part of this block — it is a supporting label that
  belongs under the map it qualifies (`.map-note`), not above it.
 -->
<script>
  import { logClickToGA } from "$lib/analytics";

  /**
   * Optional section heading. Omit it when the page renders its own `h2`
   * outside the block, as the home page does.
   * @type {string | null}
   * @optional
   **/
  export let title = null;

  /**
   * Optional line under the heading, e.g. "Funding Distribution by State".
   * @type {string | null}
   * @optional
   **/
  export let subhead = null;

  /**
   * Heading level for `subhead`. The home page's comp sets it a step larger
   * than the other pages'.
   * @type {4 | 5}
   **/
  export let subhead_level = 5;

  /**
   * Optional units line, e.g. "Funding amount per 1,000 residents".
   * @type {string | null}
   * @optional
   **/
  export let label = null;

  /**
   * Currently selected geography level. Bind this from the page.
   * @type {"state" | "county" | "cbsa"}
   **/
  export let map_level;

  /**
   * Toggle options, in display order.
   *
   * Labels are singular and ordered largest geography first, which is the
   * convention across every map in the tool: **State · CBSA · County**. The
   * default was `CBSA` / `States` — mixed number, and CBSA first — which is
   * what the program page still renders through this default and what home and
   * category rendered before they grew a third option. "CBSAs" has no good
   * plural, so singular is the set that can be consistent.
   * @type {{value: "state" | "county" | "cbsa", label: string}[]}
   **/
  export let levels = [
    { value: "state", label: "State" },
    { value: "cbsa", label: "CBSA" },
  ];

  /**
   * Analytics control name. The selected level is appended as the click value.
   * @type {string}
   **/
  export let ga_control = "map-geo-toggle";

  /**
   * @param {MouseEvent} event
   * @param {"state" | "county" | "cbsa"} value
   */
  function select_level(event, value) {
    map_level = value;
    logClickToGA(event.target, `${ga_control}--${value}`);
  }
</script>

<div class="map-section-info">
  {#if title}
    <h2 class="map-section-title">{title}</h2>
  {/if}
  {#if subhead}
    <svelte:element this={`h${subhead_level}`} class="map-section-description">
      {subhead}
    </svelte:element>
  {/if}
  {#if label}
    <p class="map-section-label">{label}</p>
  {/if}
  <!-- A single level is not a choice, so it renders no toggle at all — the
       geography pages pass an empty list on county and CBSA pages. -->
  {#if levels.length > 1}
    <div class="geo-toggle">
      {#each levels as level}
        <button
          class="geo-toggle-button"
          class:active={map_level === level.value}
          on:click={(event) => select_level(event, level.value)}
        >
          {level.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .map-section-info {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .map-section-description {
    margin-bottom: 0;
  }
  .map-section-label {
    font-size: 16px;
    line-height: 24px;
    margin-bottom: 0;
  }
</style>
