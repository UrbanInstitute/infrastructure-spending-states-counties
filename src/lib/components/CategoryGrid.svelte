<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { base } from "$app/paths";
  import CategoryIcon from "$components/icons/CategoryIcon.svelte";
  import { category_display_name } from "$stores/categories.js";
  import { slugify_program } from "$lib/utils.js";
  import { logClickToGA } from "$lib/analytics";

  /** @type {Array<{category: string, category_name: string}>} */
  export let categories = [];

  /** @type {string | null} */
  export let exclude = null;

  $: filtered_categories = exclude
    ? categories.filter((c) => c.category !== exclude)
    : categories;
</script>

<div class="category-grid">
  {#each filtered_categories as cat}
    <a
      class="category-grid--item"
      href="{base}/program-categories/{slugify_program(cat.category)}/"
      on:click={(event) =>
        logClickToGA(event.target, `category-grid--${cat.category}`)}
    >
      <div class="category-grid--icon">
        <CategoryIcon category={cat.category} size={120} />
      </div>
      <span class="category-grid--label"
        >{category_display_name(cat.category)}</span
      >
    </a>
  {/each}
</div>

<style>
  /* Sized from design/categories.jpg: 120px icons on a 154px column pitch,
     capped at five columns so the nine categories break 5 / 4 and wrap
     centered on narrower screens. */
  .category-grid {
    --category-icon-size: 120px;
    --category-column-width: 140px;
    --category-column-gap: 14px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: var(--category-column-gap);
    row-gap: var(--spacing-8);
    max-width: calc(
      5 * var(--category-column-width) + 4 * var(--category-column-gap)
    );
    margin-inline: auto;
  }
  .category-grid--item {
    width: var(--category-column-width);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-4);
    text-decoration: none;
    color: inherit;
  }
  .category-grid--icon {
    width: var(--category-icon-size);
    height: var(--category-icon-size);
    line-height: 0;
  }
  /* The green disc is part of each icon's SVG, so scale the SVG itself rather
     than wrapping it in a second circle. */
  .category-grid--icon :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
  .category-grid--label {
    width: 100%;
    overflow-wrap: break-word;
    font-size: 14px;
    line-height: 1.4;
    font-weight: var(--font-weight-bold);
    text-align: center;
  }
  .category-grid--item:hover .category-grid--label {
    text-decoration: underline;
  }
  @media (max-width: 600px) {
    .category-grid {
      --category-icon-size: 88px;
      --category-column-width: 104px;
      --category-column-gap: var(--spacing-3);
      row-gap: var(--spacing-6);
    }
  }
</style>
