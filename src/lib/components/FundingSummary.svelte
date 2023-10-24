<script>
  import ToggleGroup from "./Toggle/ToggleGroup.svelte";
  /*
   * What category to show summary data for
   * @type "iija" | "hud"
   **/
  export let summary_option = "iija";

  /**
   * @type {{iija_funding_total: number, hud_funding_total: number}}
   * @required
   */
  export let funding_data;
</script>

<div class="funding-amounts">
  <div class="section-label">
    <p>Total funding amount</p>
  </div>
  <p class="text-3xl funding-amounts-value">
    {#if summary_option === "iija"}
      ${funding_data.iija_funding_total.toLocaleString()}
    {:else if summary_option === "hud"}
      ${funding_data.hud_funding_total.toLocaleString()}
    {/if}
  </p>
  <ToggleGroup
    options={[
      { label: "IIJA funding", value: "iija" },
      { label: "HUD funding", value: "hud" },
    ]}
    bind:active_value={summary_option}
  />
</div>

<style>
  .funding-amounts-value {
    font-weight: var(--font-weight-bold);
  }
</style>
