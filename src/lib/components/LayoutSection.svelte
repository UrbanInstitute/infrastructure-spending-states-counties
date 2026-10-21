<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  /** @type {string | null} */
  export let id = null;

  /** @type {"white" | "gradient" | "dark"}  */
  export let theme = "white";

  /** @type {boolean}  */
  export let padding = true;

  export let topShadow = false;

  /**
   * Inset 1px rule at the section seam, the treatment the comps use above the
   * About block. Alternative to `topShadow`, not an addition to it.
   * @type {boolean}
   */
  export let hairline = false;
</script>

<section
  class="layout-section {theme}"
  class:no-padding={!padding}
  class:top-shadow={topShadow}
  class:hairline
  {id}
>
  <slot />
</section>

<style>
  .layout-section {
    --vertical-padding: 120px;
    padding-block-start: var(--vertical-padding);
    padding-block-end: var(--vertical-padding);
    margin-block-end: 0;
  }
  .layout-section.no-padding {
    padding-block-start: 0;
    padding-block-end: 0;
  }
  .layout-section.top-shadow {
    box-shadow: var(--section-top-box-shadow);
  }
  .layout-section.hairline {
    position: relative;
  }
  /* Measured off design/categories-landing-page.png, categories.jpg and
     geography.png, which all draw this identically: a 1px #d2d2d2 rule spanning
     1208px centered on the 1440px artboard. Sits on the seam itself, above the
     section's own padding, so it reads as a divider between sections rather
     than as a rule belonging to the About block. Falls back to the LayoutBlock
     gutter once the viewport is narrower than the capped width. */
  .layout-section.hairline::before {
    content: "";
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    width: min(1208px, calc(100% - var(--spacing-12)));
    height: 1px;
    background-color: var(--color-gray);
  }
  .layout-section.white {
    background-color: var(--color-white);
  }
  .layout-section.gradient {
    background: linear-gradient(
      180deg,
      var(--color-gray-shade-lightest) 0%,
      var(--color-white) 100%
    );
  }
  .layout-section.dark {
    background-color: var(--color-blue-shade-darkest);
  }
</style>
