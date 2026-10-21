<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import SocialButtons from "$components/SocialButtons.svelte";

  /* @type {string} */
  export let headline;
  /* @type {string} */
  export let date;
</script>

<div class="hero text-width">
  <h1 class="hero--page-headline">{headline}</h1>
  <p class="hero--date">{@html date}</p>
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
  .hero--date {
    color: var(--color-gray-shade-darker);
  }
  .hero--date :global(strong) {
    font-style: normal;
    font-weight: var(--font-weight-bold);
  }
</style>
