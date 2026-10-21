<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { base } from "$app/paths";
  import Table from "$components/LinkTable.svelte";
  import { category_list, category_display_name } from "$stores/categories.js";
  import { slugify_program, TOTAL_FUNDING_HEADER } from "$lib/utils.js";

  /** @type {Record<string, number>} */
  export let data = {};

  /**
   * Generates an array of category funding amounts for the table
   * @param {Record<string, number>} category_funding - The category_funding object
   * @returns {{category: string, url: string, total_funding: number}[]} The formatted category data
   */
  function formatCategoryDataForTable(category_funding) {
    return $category_list
      .filter(
        (cat) =>
          category_funding[cat.category] != null &&
          category_funding[cat.category] > 0
      )
      .map((cat) => {
        return {
          category: category_display_name(cat.category),
          url: `${base}/program-categories/${slugify_program(cat.category)}/`,
          total_funding: category_funding[cat.category],
        };
      });
  }

  const format_funs = {
    total_funding: (/** @type {number} */ val) =>
      `$${Math.round(val).toLocaleString("en-US")}`,
  };

  const column_headers = {
    category: "Infrastructure category",
    total_funding: TOTAL_FUNDING_HEADER,
  };

  $: category_funding_rows = formatCategoryDataForTable(data);
</script>

<div class="funding-table--wrapper">
  {#if category_funding_rows.length > 0}
    <Table
      sort_column="total_funding"
      link_column="category"
      data={category_funding_rows}
      limit_height
      fit_last_column
      {format_funs}
      {column_headers}
    />
  {:else}
    <div class="funding-table--no-programs">
      <p>No category funding data available for this location.</p>
    </div>
  {/if}
</div>

<style>
  .funding-table--no-programs {
    padding: 1rem;
    background: var(--color-gray-shade-lighter);
    border-radius: 0.5rem;
  }
  .funding-table--no-programs p {
    margin: 0;
    font-size: var(--font-size-small);
  }
</style>
