<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  /**
   * @type {"normal" | "large"}
   */
  export let size = "normal";
</script>

<div class="pillbox-wrapper {size}">
  <slot />
</div>

<style>
  .pillbox-wrapper {
    display: inline-block;
    background-color: var(--color-gray-shade-lightest);
    border-radius: 32px;
    padding-inline: var(--spacing-8);
    padding-block: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
  }
  .pillbox-wrapper.large {
    border-radius: 54px;
    padding-inline: var(--spacing-8);
    padding-inline-start: var(--spacing-4);
    padding-block: var(--spacing-4);
  }
</style>
