<script>
  import SocialButtons from "$components/SocialButtons.svelte";

  /* @type {string} */
  export let headline;
  /* @type {string | null} */
  export let subhead = null;
  /* @type {string} */
  export let date;
</script>
<div class="hero text-width">
  <h1 class="hero--page-headline">{headline}</h1>
  {#if subhead}
    <p class="hero--subhead">{subhead}</p>
  {/if}
  <p class="hero--date">{date}</p>
</div>
<SocialButtons />

<style>
  .hero {
    text-align: center;
    border-bottom: solid 1px var(--color-gray);
    padding-bottom: var(--spacing-12);
    margin-bottom: var(--spacing-12);
  }
  .hero--page-headline {
    margin-bottom: var(--spacing-12);
    margin-top: var(--spacing-12);
  }
  .hero p {
    font-style: italic;
  }
  .hero--subhead {
    margin-bottom: var(--spacing-12);
    color: var(--color-gray-shade-darkest);
  }
  .hero--date {
    color: var(--color-gray-shade-darker);
  }
    
</style>
