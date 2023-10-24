<script>
  import { slugify_program } from "$lib/utils.js";
  import { base } from "$app/paths";
  /**
   * @type {Array<Record<string, string | number>>}
   */
  export let data = [];
  export let sort_column = "funding_per_1k";
  export let limit_height = false;
  export let format_funs = {};
  export let program_slugs = [];

  $: columns = Object.keys(data[0] || []);
  $: format_funs_list = Object.keys(format_funs);

  $: sortedData = data.sort((a, b) => {
    if (
      typeof a[sort_column] === "undefined" ||
      typeof b[sort_column] === "undefined"
    ) {
      return 0;
    }
    if (
      typeof a[sort_column] === "number" &&
      typeof b[sort_column] === "number"
    ) {
      return b[sort_column] - a[sort_column];
    } else {
      return b[sort_column].localeCompare(a[sort_column]);
    }
  });

  /**
   * @param {string} column
   * @returns {void}
   */
  function sortByColumn(column) {
    sort_column = column;
  }


  function format_column(column) {
    return column.replaceAll("_", " ");
  }
</script>

<div class="table-wrapper" class:table-wrapper--height-limit={limit_height}>
  <table class="data-table">
    <thead>
      <tr>
        {#each columns as column}
          {#if column != "url"}
            <th on:click={(e) => sortByColumn(column)}>{format_column(column)}</th>
          {/if}
        {/each}
      </tr></thead
    >
    <tbody>
      {#each sortedData as row, row_index}
        <tr>
          {#each columns as column}
            {#if column != "url"}
              {#if column === "program"}
                {#if format_funs_list.includes(column)}
                  <td
                    ><a href="{row.url}"
                      >{format_funs[column](row[column])}</a
                    ></td
                  >
                {:else}
                  <td
                    ><a href="{row.url}"
                      >{row[column]}</a
                    ></td
                  >
                {/if}
              {:else if format_funs_list.includes(column)}
                <td>{format_funs[column](row[column])}</td>
              {:else}
                <td>{row[column]}</td>
              {/if}
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper {
    --scrollbar-foreground: var(--color-gray-shade-dark);
    --scrollbar-background: var(--color-gray-shade-light);
    overflow: auto;
    scrollbar-color: var(--scrollbar-foreground) var(--scrollbar-background);
  }
  .table-wrapper::-webkit-scrollbar-thumb {
    /* Foreground */
    background: var(--scrollbar-foreground);
  }
  .table-wrapper::-webkit-scrollbar-track {
    /* Background */
    background: var(--scrollbar-background);
  }
  .table-wrapper--height-limit {
    max-height: 500px;
  }
  table.data-table {
    border-collapse: collapse;
    width: 100%;
  }
  table.data-table thead th {
    text-align: left;
    padding: 0.5em 1em;
    font-size: var(--font-size-small);
    text-transform: uppercase;
  }
  table.data-table thead tr {
    position: sticky;
    top: 0;
    background: var(--color-black);
    border-bottom: solid 1px var(--color-gray-shade-darker);
    color: var(--color-white);
  }
  table.data-table tbody td {
    padding: 0.5em;
  }
  table.data-table tbody td:nth-child(2) {
    min-width: 150px;
  }
  table.data-table tbody td a, table.data-table tbody td a:visited{
    color: var(--color-black);
  }
  table.data-table tbody td a:hover {
    color: var(--color-blue);
  }
  table.data-table tbody td:last-child,
  table.data-table thead th:last-child {
    text-align: right;
  }
  table.data-table thead th:first-child {
    /* border-right: solid 1px var(--color-gray); */
  }
  table.data-table tbody td:first-child {
    font-weight: var(--font-weight-bold);
    /* border-right: solid 1px var(--color-gray); */
  }
  table tbody tr:nth-child(even) {
    background: var(--color-gray-shade-lightest);
  }
  table.data-table thead tr {
  }
</style>
