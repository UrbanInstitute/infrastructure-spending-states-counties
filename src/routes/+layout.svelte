<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import "../app.css";
  import Nav from "$lib/components/Nav.svelte";
  import Fonts from "$lib/components/Fonts.svelte";
  import Tooltip from "$components/Tooltip.svelte";
  import { current_tooltip } from "$stores/tooltip";
  import { browser } from "$app/environment";
  import { beforeNavigate } from "$app/navigation";
  import site_content from "$data/site_content.aml";

  beforeNavigate(() => {
    current_tooltip.set(null);
  });

  // The nav sticks to the top of the viewport. Its measured height is exposed
  // as `--nav-height` so the pages' sticky search bar can stack beneath it and
  // anchor scrolling (`scroll-padding-top` in app.css) clears it. The title
  // wraps on narrow screens, so the height is measured rather than assumed.
  let nav_height = 0;
  $: if (browser && nav_height > 0) {
    document.documentElement.style.setProperty(
      "--nav-height",
      `${nav_height}px`
    );
  }
</script>

<Fonts />
<Nav title={site_content.meta.title} bind:height={nav_height} />
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
  />
{/if}

<style>
  main {
    width: 100%;
  }
</style>
