<script>
  import { base } from "$app/paths";
  import IconBroadband from "$components/IconBroadband.svelte";
  import IconHousing from "$components/IconHousing.svelte";
  import IconTransit from "$components/IconTransit.svelte";

  export let headline = "Data highlights";
  /** @typedef {Object} VignetteItem
   * @property {string} text
   * @property {string} link
   * @property {string} icon
   */
  /** @type {Array<VignetteItem>} */
  export let items;

  const icons = {
    "broadband-icon": IconBroadband,
    "house-icon": IconHousing,
    "transit-icon": IconTransit,
  };

</script>

<div class="vignettes--wrapper">
  <h3 class="vignettes--subhead">{headline}</h3>
  {#each items as item}
    <a class="vignette-link" href={item.link}>
      <div class="vignette-item">
        <div class="vignette-icon" role="presentation">
          <svelte:component this={icons[item.icon]} />
        </div>
        <div class="vignette-text"><p>{@html item.text}</p></div>
      </div>
    </a>
  {/each}
</div>

<style>
  .vignettes--subhead {
    text-align: center;
    margin-bottom: 0;
    padding: var(--spacing-4) 0;
  }
  .vignette-item {
    border-top: solid 1px var(--color-gray-shade-light);
    display: flex;
    gap: var(--spacing-8);
    padding: var(--spacing-8) var(--spacing-8) var(--spacing-8) 0;
  }
  .vignette-item :global(.vignette-icon) {
    --color-accent: var(--color-green);
  }
  .vignette-item:hover :global(.vignette-icon) {
    --color-accent: var(--color-green-shade-lighter);
  }
  .vignette-icon {
    width: 84px;
    height: 84px;
    flex-shrink: 0;
  }
  .vignette-icon img {
    width: 100%;
    display: block;
  }
  .vignette-text :global(strong) {
    color: var(--color-blue);
  }
</style>
