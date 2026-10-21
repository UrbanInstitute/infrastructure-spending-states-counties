<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<!--
  @component
  The stacked funding-map layout: a `MapSectionInfo` block above the map card(s),
  which arrive through the default slot. Matches the program, category and
  geography comps. The home page's comp puts the block inside the card instead,
  so it composes `MapSectionInfo` directly rather than using this.

  The level caveat is not part of this layout — it belongs under the map it
  qualifies, inside that map's card, so it is `FundingMap`'s `note` prop.
 -->
<script>
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import MapSectionInfo from "$components/MapSectionInfo.svelte";

  /**
   * Section heading.
   * @type {string}
   **/
  export let title;

  /**
   * Optional line under the heading, e.g. "Funding Distribution by State".
   * @type {string | null}
   * @optional
   **/
  export let subhead = null;

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
   * Toggle options, in display order. Kept identical to `MapSectionInfo`'s
   * default, which documents the labelling convention.
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
   * Width of the block holding the slotted map card(s).
   * @type {"normal" | "large" | "xl"}
   **/
  export let block_size = "large";
</script>

<LayoutBlock>
  <div class="map-section-heading">
    <MapSectionInfo
      {title}
      {subhead}
      {label}
      {levels}
      {ga_control}
      bind:map_level
    />
  </div>
</LayoutBlock>
<LayoutBlock size={block_size}>
  <slot />
</LayoutBlock>

<style>
  /* Gap to the card below belongs to the stacked layout, not to the block. */
  .map-section-heading {
    margin-bottom: 2rem;
  }
</style>
