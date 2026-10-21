<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { base } from "$app/paths";

  /** @type {string | null} */
  export let id = null;
</script>

<!-- The image URL is set inline, not through a CSS custom property: prerendered
     pages get a relative `base`, and a relative `url()` inside a custom property
     resolves against the stylesheet under `_app/`, so it 404s until hydration. -->
<section
  class="layout-hero"
  style="background-image: url({base}/hero_illustration.svg)"
  {id}
>
  <div class="hero-surface">
    <slot />
  </div>
</section>

<style>
  .layout-hero {
    position: relative;
    background-repeat: repeat-x;
    background-position: bottom center;
    background-size: auto;
    margin-block-end: 0;
  }
  .hero-surface {
    position: relative;
    max-width: 940px;
    margin-inline: auto;
    margin-block: 0;
    background-color: var(--color-white);
    padding-block: 120px;
  }
</style>
