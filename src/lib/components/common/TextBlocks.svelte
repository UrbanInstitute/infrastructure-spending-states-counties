<script>
	export let blocks = [];
</script>

<div class="text-blocks text-width">
	{#each blocks as textBlock}
		<p>{@html textBlock.value}</p>
	{/each}
</div>
<style>
  .text-blocks p {
    margin-bottom: var(--spacing-8);
  }
</style>
