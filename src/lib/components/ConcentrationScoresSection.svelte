<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import Card from "$components/Card.svelte";
  import LinkTable from "$components/LinkTable.svelte";
  import { get_indicator_label_lower } from "$lib/utils.js";
  import { logClickToGA } from "$lib/analytics";

  /**
   * Full array of concentration scores from category data
   * @type {Array<{category: string, indicator: string, indicator_label: string, ratio_of_funding_to_need: number | null, direction_of_ratio: string | null, data_level: string}>}
   */
  export let concentration_scores = [];

  /** Title over the table, inside its card. */
  export let title = "";

  /** @type {string} */
  let geo_level = "state";

  /**
   * The stored ratio as written, with no rounding: "2 times more",
   * "0.7 times less", or "As much as expected" at exactly 1. The row keeps
   * the raw number so the column sorts numerically.
   * @param {number} val
   * @returns {string}
   */
  function format_magnitude(val) {
    if (val > 1) return `${String(val)} times more`;
    if (val < 1) return `${String(val)} times less`;
    return "As much as expected";
  }

  // One table for the selected level: every characteristic with a ratio,
  // whichever direction it falls. `indicator_label` is the shipped direction
  // add-on ("higher"/"lower") that reads in front of the characteristic,
  // capitalized since it starts the cell.
  $: rows = concentration_scores
    .filter(
      (s) => s.data_level === geo_level && s.ratio_of_funding_to_need != null
    )
    .map((s) => ({
      label: get_indicator_label_lower(s.indicator),
      direction: s.indicator_label,
      ratio: /** @type {number} */ (s.ratio_of_funding_to_need),
    }))
    .filter((s) => s.label !== "")
    .map((s) => ({
      characteristic: `${s.direction
        .charAt(0)
        .toUpperCase()}${s.direction.slice(1)} ${s.label}`,
      funding_magnitude: s.ratio,
    }));

  // Same order as the map toggle above this section — State · CBSA · County,
  // largest geography first. These two sat in different orders once the map
  // gained its third option; the labels always matched, only the order did not.
  const levels = /** @type {const} */ ([
    { value: "state", label: "State" },
    { value: "cbsa", label: "CBSA" },
    { value: "county", label: "County" },
  ]);

  /**
   * @param {MouseEvent} event
   * @param {"state" | "county" | "cbsa"} value
   */
  function select_level(event, value) {
    geo_level = value;
    logClickToGA(event.target, `concentration-geo-toggle--${value}`);
  }
</script>

<div class="concentration-section">
  <div class="concentration-toggle">
    <div class="geo-toggle">
      {#each levels as level (level.value)}
        <button
          class="geo-toggle-button"
          class:active={geo_level === level.value}
          on:click={(event) => select_level(event, level.value)}
        >
          {level.label}
        </button>
      {/each}
    </div>
  </div>

  <Card>
    <div class="concentration-card">
      {#if title}
        <p class="concentration-card--title">{title}</p>
      {/if}
      {#if rows.length > 0}
        <LinkTable
          data={rows}
          sort_column="funding_magnitude"
          format_funs={{ funding_magnitude: format_magnitude }}
          column_headers={{
            characteristic: "Characteristic",
            funding_magnitude: "Funding magnitude",
          }}
        />
      {:else}
        <p class="concentration-card--none">
          No characteristics in this category.
        </p>
      {/if}
    </div>
  </Card>
</div>

<style>
  .concentration-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  .concentration-toggle {
    display: flex;
    justify-content: center;
    margin-block: var(--spacing-6);
  }
  /* Card title and empty note match the two-card layout this replaced. */
  .concentration-card {
    padding: var(--spacing-2);
  }
  .concentration-card--title {
    font-size: 16px;
    font-weight: var(--font-weight-bold);
    margin-block-end: var(--spacing-3);
    text-align: center;
  }
  .concentration-card--none {
    font-size: var(--font-size-small);
    color: var(--color-gray-shade-dark);
    font-style: italic;
    text-align: center;
    margin-block: var(--spacing-4);
  }
</style>
