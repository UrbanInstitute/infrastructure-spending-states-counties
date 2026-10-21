<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import HelpTip from "$components/HelpTip.svelte";

  /** @type {string} */
  export let tip_text;
</script>

<div class="indicator-wrapper">
  <HelpTip text={tip_text} align="right" button_size={20} />
  <slot />
</div>

<style>
  .indicator-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-4);
  }
</style>
