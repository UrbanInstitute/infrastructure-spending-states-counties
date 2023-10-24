<script>
  /** @type {string} */
  export let page_type;

 /** @type {{label: string, url: string}[]} */
  export let crumbs = [];
</script>

<p class="page-breadcrumbs text-eyebrow">
  <span class="page-type">{page_type} / </span>
  {#each crumbs as crumb, i}
    <a href={crumb.url} >{crumb.label}</a>
    {#if i < crumbs.length - 1}
      <span> / </span>
    {/if}
  {/each}
</p>

<style>
  .page-breadcrumbs {
    text-transform: uppercase;
    font-style: normal;
    color: var(--color-black);
  }
  .page-breadcrumbs a {
    color: var(--color-black);
    text-decoration: none;
  }
  .page-type {
    color: var(--color-gray-shade-dark);
  }
</style>
