<script>
  export let blocks = [];
</script>

<div class="text-blocks text-width">
  {#each blocks as textBlock}
    {#if textBlock.type === "text"}
      <p>{@html textBlock.value}</p>
    {:else if textBlock.type === "header"}
      <h4 class="block-header">{@html textBlock.value}</h4>
    {/if}
  {/each}
</div>

<style>
  .text-blocks p {
    margin-bottom: var(--spacing-8);
  }
  .text-blocks h4.block-header {
    font-size: var(--font-size-small);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    margin-top: var(--spacing-8);
  }
</style>
