<script>
  /**
   * @type {Array<Record<string, string | number>>}
   */
  export let data = [];
  export let sort_column = "funding_per_1k";
  export let limit_height = false;
  export let format_funs = {};

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
</script>

<div class="table-wrapper" class:table-wrapper--height-limit={limit_height}>
  <table class="data-table">
    <thead>
      <tr>
        {#each columns as column}
          <th on:click={(e) => sortByColumn(column)}>{column}</th>
        {/each}
      </tr></thead
    >
    <tbody>
      {#each sortedData as row}
        <tr>
          {#each columns as column}
            {#if format_funs_list.includes(column)}
            <td>{format_funs[column](row[column])}</td>
            {:else}
            <td>{row[column]}</td>
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
    text-transform: uppercase;
  }
  table.data-table thead tr {
    position: sticky;
    top: 0;
    /* background: var(--color-white); */
    background: var(--color-black);
    border-bottom: solid 1px var(--color-gray-shade-darker);
    color: var(--color-white);
  }
  table.data-table tbody td {
    padding: 0.5em;
    width: 100px;
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
  
  /* scrollbar */
  :global(.table-wrapper::-webkit-scrollbar) {
    width: 10px;
  }

  :global(.table-wrapper::-webkit-scrollbar-track) {
    background: var(--color-gray-shade-lightest);
  }

  :global(.table-wrapper::-webkit-scrollbar-thumb) {
    background: var(--color-gray-shade-dark);
    border: 1px solid var(--color-gray-shade-dark);
  }
  /* end scrollboar */
</style>
