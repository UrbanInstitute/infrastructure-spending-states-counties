<script>
  import { getContext } from "svelte";

  const layout = getContext("layout");
</script>

<div class="layout-column {layout}">
  <slot />
</div>

<style>
  .layout-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    --column-padding: var(--spacing-20);
  }

  .layout-column.col-2 {
    width: 100%;
  }
  @media (min-width: 1024px) {
    .layout-column.col-2 {
      width: 50%;
    }
    .layout-column.col-2:first-child {
      padding-right: var(--column-padding);
    }
    .layout-column.col-2:last-child {
      padding-left: var(--column-padding);
    }
  }
</style>
