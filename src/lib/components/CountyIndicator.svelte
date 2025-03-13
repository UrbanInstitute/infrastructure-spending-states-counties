<script>
  import HelpTip from "$components/HelpTip.svelte";

  /** @type {string} */
  export let tip_text;
</script>

<div class="indicator-wrapper">
  <HelpTip text={tip_text} align="right" button_size={20}/>
  <slot />
</div>

<style>
  .indicator-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-4);
  }
</style>
