<script>
  import { onMount, onDestroy } from "svelte";

  /** @type {string} */
  export let page_type;

  /** @type {string} */
  export let page_name;

  let is_sticky = false;

  /** @type {HTMLElement} */
  let el;

  /** @param {IntersectionObserverEntry[]} e */
  function onObserve([e]) {
    if (e.intersectionRatio < 1) {
      is_sticky = true;
    } else {
      is_sticky = false;
    }
  }

  /** @type {IntersectionObserver} */
  let observer;

  onMount(() => {
    observer = new IntersectionObserver(onObserve, {rootMargin: "-5px 0px 0px 0px", threshold: [1]});
    observer.observe(el);
  });
  onDestroy(() => {
    if (observer) {
      observer.disconnect();
    }
  });
</script>

<div class="sub-nav--wrapper" bind:this={el} class:sticky={is_sticky}>
  <div class="sub-nav--inner-wrapper layout-container--article-width">
    <div class="sub-nav--info">
      <p class="sub-nav--page-type">{page_type}</p>
      <h3 class="sub-nav--page-name">{page_name}</h3>
    </div>
  </div>
</div>

<style>
  .sub-nav--wrapper {
    background: var(--color-black, "#000000");
    color: var(--color-white, "#ffffff");
    padding: var(--spacing-4, "2rem") 0;
    position: sticky;
    margin-bottom: var(--spacing-12);
    top: -1px;
    z-index: 20;
    transition: all 250ms ease;
  }
  .sub-nav--wrapper p {
    color: var(--color-white, "#ffffff");
  }
  .sub-nav--page-type {
    font-size: var(--font-size-sm, "1rem");
    text-transform: uppercase;
    margin-bottom: 0;
  }
  .sub-nav--page-name {
    font-size: var(--font-size-2xl, "1rem");
    font-weight: var(--font-weight-light, "400");
    color: var(--color-white, "#ffffff");
  }
  .sub-nav--wrapper.sticky {
    padding: var(--spacing-2, "1rem") 0;
    transition: all 250ms ease;
  }
  .sub-nav--wrapper.sticky .sub-nav--page-name {
    font-size: var(--font-size-large, "1rem");
    /* font-weight: var(--font-weight-bold, "700"); */
    /* text-transform: none; */
  }
  .sub-nav--wrapper.sticky .sub-nav--page-type {
    font-size: var(--font-size-xsmall, "1rem");
  }
</style>
