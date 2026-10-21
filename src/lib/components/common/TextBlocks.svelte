<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import LayoutBlock from "$components/LayoutBlock.svelte";
  /** @type {Array<{ type: string; value: string }>} */
  export let blocks = [];
</script>

<LayoutBlock>
  {#each blocks as textBlock}
    {#if textBlock.type === "text"}
      <p>{@html textBlock.value}</p>
    {:else if textBlock.type === "header"}
      <h4 class="block-header">{@html textBlock.value}</h4>
    {/if}
  {/each}
</LayoutBlock>

<style>
  p {
    margin-bottom: var(--spacing-8);
  }
  h4.block-header {
    font-size: var(--font-size-small);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    margin-top: var(--spacing-8);
  }
</style>
