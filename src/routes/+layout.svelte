<script>
  import "../app.css";
  import Nav from "$lib/components/Nav.svelte";
  import Tooltip from "$components/Tooltip.svelte"
  import { current_tooltip } from "$stores/tooltip";
  import { page } from "$app/stores";
  import { beforeNavigate } from "$app/navigation";
  import site_content from "$data/site_content.json";

  beforeNavigate(() => {
    current_tooltip.set(null);
  });
</script>

{#if $page.route.id == "/"}
  <Nav/>
{:else}
  <Nav title={site_content.meta.title}/>
{/if}
<main class="main-content-wrapper">
  <slot />
</main>
{#if $current_tooltip}
<Tooltip
  xPosition={$current_tooltip.xPosition}
  yPosition={$current_tooltip.yPosition}
  size="large"
  content={$current_tooltip.content}
  style="light"
  ></Tooltip>
{/if}

<style>
  main {
    width: 100%;
  }
</style>
