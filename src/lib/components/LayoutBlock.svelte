<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  /** @type {"col-1" | "col-2"} */
  export let column = "col-1";
  /** @type {"normal" | "large" | "xl"} */
  export let size = "normal";
</script>

<div class="layout-block {column} {size}">
  <slot />
</div>

<style>
  .layout-block {
    margin-inline: auto;
    margin-block: 0;
    width: 100%;
    max-width: calc(100% - var(--spacing-12));
  }
  .layout-block.normal {
    width: 760px;
  }
  .layout-block.large {
    width: 940px;
  }
  .layout-block.xl {
    width: 1115px;
  }
</style>
