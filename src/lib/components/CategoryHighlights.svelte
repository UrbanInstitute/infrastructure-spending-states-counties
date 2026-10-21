<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import CategoryIcon from "$components/icons/CategoryIcon.svelte";
  import { category_display_name } from "$stores/categories.js";
  import { logClickToGA } from "$lib/analytics";
  import { takeaway_link_suffix } from "$lib/takeaway_links.js";

  /** @type {string} */
  export let header = "Infrastructure Funding Trends";
  /** @type {string} */
  export let button_text = "See all categories";
  /**
   * @typedef {Object} HighlightItem
   * @property {string} category_short_name
   * @property {string} text
   */
  /** @type {Array<HighlightItem>} */
  export let items;

  // tracking current group of categories by page: 3 categories per "page",
  // or 1 below the site's 768px breakpoint, where three cards don't fit. The
  // prerendered page uses 3; phones switch once mounted.
  let items_per_page = 3;
  let page = 0;

  onMount(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    /** @param {MediaQueryList | MediaQueryListEvent} mq */
    const update = (mq) => set_items_per_page(mq.matches ? 3 : 1);
    update(wide);
    wide.addEventListener("change", update);
    return () => wide.removeEventListener("change", update);
  });

  /**
   * Re-chunk while keeping the first card on screen in view, so the new page
   * is always within the new page count.
   * @param {number} n
   */
  function set_items_per_page(n) {
    if (n === items_per_page) return;
    page = Math.floor((page * items_per_page) / n);
    items_per_page = n;
  }

  $: category_pages = Array.from(
    { length: Math.ceil(items.length / items_per_page) },
    (_, i) =>
      items.slice(i * items_per_page, i * items_per_page + items_per_page)
  );

  /** @param {number} n */
  const wrap = (n) =>
    ((n % category_pages.length) + category_pages.length) %
    category_pages.length;
  /** @param {MouseEvent} event */
  const prev = (event) => {
    page = wrap(page - 1);
    logClickToGA(event.target, "category-highlights-arrow--previous");
  };

  /** @param {MouseEvent} event */
  const next = (event) => {
    page = wrap(page + 1);
    logClickToGA(event.target, "category-highlights-arrow--next");
  };
</script>

<div class="category-highlights--wrapper">
  <LayoutBlock size="xl">
    <h2 class="category-highlights--header">{header}</h2>

    <div class="category-highlights--window">
      <div
        class="category-highlights--track"
        style="transform: translateX({page * -100}%)"
      >
        {#each category_pages as group}
          <div class="category-highlights--page">
            {#each group as item}
              <a
                class="category-highlights--link"
                href="{base}/program-categories/{item.category_short_name.replaceAll(
                  '_',
                  '-'
                )}/{takeaway_link_suffix(item.category_short_name)}"
              >
                <div class="category-highlights--item">
                  <div class="category-highlights--icon" role="presentation">
                    <CategoryIcon
                      category={item.category_short_name}
                      size={64}
                    />
                  </div>
                  <div class="category-highlights--text">
                    <h4 class="category-highlights--name">
                      {category_display_name(item.category_short_name)}
                    </h4>
                    <p>{@html item.text}</p>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <div class="category-highlights--controls">
      <button
        class="category-highlights--arrow"
        on:click={prev}
        aria-label="Previous categories"
      >
        &laquo;
      </button>

      {#each category_pages as _, i}
        <button
          class="category-highlights--dot"
          class:active={i === page}
          on:click={() => (page = i)}
          aria-label="Go to page {i + 1}"
        />
      {/each}

      <button
        class="category-highlights--arrow"
        on:click={next}
        aria-label="Next categories"
      >
        &raquo;
      </button>
    </div>

    <div class="category-highlights--button-wrapper">
      <a class="category-highlights--button" href="{base}/program-categories/"
        >{button_text}</a
      >
    </div>
  </LayoutBlock>
</div>

<style>
  .category-highlights--wrapper {
    text-align: center;
  }
  .category-highlights--window {
    overflow: hidden;
    padding-block: 4rem 1rem;
  }
  .category-highlights--track {
    display: flex;
    transition: transform 0.5s ease;
  }
  .category-highlights--page {
    flex: 0 0 100%;
    display: flex;
    gap: 1rem;
  }
  /* sizing lives on the link — it's the real flex child of the page */
  .category-highlights--link {
    flex: 1;
    min-width: 0;
    display: flex;
    text-decoration: none;
    color: inherit;
  }
  .category-highlights--item {
    background: var(--color-white);
    border: solid 1px var(--color-gray-shade-lighter);
    box-shadow: var(--card-box-shadow);
    padding: 2rem;
    flex: 1;
    min-width: 0;
    position: relative;
  }
  .category-highlights--controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 1.5rem 0;
  }
  .category-highlights--arrow {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-gray);
    font-size: 2rem;
    line-height: 1;
    padding: 0;
    display: block;
  }
  .category-highlights--dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    border: none;
    padding: 0;
    cursor: pointer;
    background: var(--color-gray);
    display: block;
  }
  .category-highlights--dot.active {
    background: var(--color-green);
  }
  .category-highlights--icon {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .category-highlights--name {
    margin-block: 1rem;
  }
</style>
