<script>
  import LayoutColumn from "$components/LayoutColumn.svelte";
  import { setContext } from "svelte";

  /** @type {string | null} */
  export let id = null;

  /** @type {"col-2" | "col-1"} */
  export let layout = "col-2";

  setContext("layout", layout);
</script>

<section class="layout-section {layout}" {id}>
  <slot />
</section>

<style>
  .layout-section.col-2 {
    width: 100%;
  }
  @media (min-width: 1024px) {
    .layout-section.col-2 {
      display: flex;
    }
  }
</style>
