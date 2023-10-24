<script>
  /** @type {"col-1" | "col-2"} */
  export let column = "col-1";
</script>

<div class="layout-block {column} ">
  <slot />
</div>

<style>
  .layout-block {
    margin: 0 0 var(--spacing-16) 0;
    width: 100%;
  }
</style>
