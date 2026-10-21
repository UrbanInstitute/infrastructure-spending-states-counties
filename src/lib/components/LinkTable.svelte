<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { TOTAL_FUNDING_HEADER } from "$lib/utils.js";
  import { current_tooltip } from "$stores/tooltip";

  /**
   * @type {Array<Record<string, any>>}
   */
  export let data = [];
  export let sort_column = "funding_per_1k";
  /**
   * Sort direction for `sort_column`. Defaults to descending, which is what
   * every current caller wants: numbers high to low, and text A–Z (text is
   * flipped, since a descending list of names reads backwards).
   * @type {"asc" | "desc"}
   */
  export let sort_direction = "desc";
  export let limit_height = false;
  /** @type {Record<string, (val: any) => any>} */
  export let format_funs = {};
  /** @type {Record<string, string>} */
  export let column_headers = {};

  /**
   * Highlight the first row as passed (e.g. a category's total funding) and
   * keep it pinned at the top whatever the sort; only the rows below it sort.
   */
  export let highlight_first_row = false;

  /**
   * Column whose cells link to `row.url` when the row carries one. Callers
   * that list programs keep the default; the geography funding table lists
   * categories (review #6).
   */
  export let link_column = "program";

  /**
   * Size the last (numeric) column to its widest cell and keep it on one line,
   * so a long header such as "Total obligated funding (FY 2022–25)" doesn't
   * wrap; the other columns take the remaining width and wrap instead. Once the
   * table itself is too narrow for that, the header wraps only as far as the
   * table's own width-sharing needs, rather than collapsing to one word a line.
   */
  export let fit_last_column = false;

  /**
   * Reserve a wide second column for program names. Tables whose second
   * column is a short value (e.g. the geography equity percentiles) turn it
   * off; ignored with `fit_last_column`, which sizes columns its own way.
   */
  export let wide_second_column = true;

  /**
   * Optional initial order computed from the whole row, for a default sort no
   * single column holds (e.g. the gap between two columns). Sorts descending
   * by its return value until a header is clicked, which sorts by that column.
   * @type {((row: Record<string, any>) => number) | null}
   */
  export let sort_value = null;

  /**
   * Optional hover text per column, built from the cell's row (e.g. the
   * geography equity table's percentile sentences). Shown in the global
   * tooltip; columns without an entry get none.
   * @type {Record<string, (row: Record<string, any>) => string>}
   */
  export let cell_tooltips = {};

  /**
   * @param {MouseEvent} event
   * @param {Record<string, any>} row
   * @param {string} column
   */
  function on_cell_mousemove(event, row, column) {
    if (!cell_tooltips[column]) return;
    $current_tooltip = {
      xPosition: event.pageX,
      yPosition: event.pageY,
      content: [{ text: cell_tooltips[column](row) }],
    };
  }

  /** @param {string} column */
  function on_cell_mouseleave(column) {
    if (cell_tooltips[column]) $current_tooltip = null;
  }

  $: columns = Object.keys(data[0] || []);
  $: format_funs_list = Object.keys(format_funs);

  $: sort_sign = sort_direction === "asc" ? -1 : 1;

  $: pinned_rows = highlight_first_row ? data.slice(0, 1) : [];

  // Sort a copy so the caller's array is left as it was passed, and treat a
  // null like an undefined value: only strings get localeCompare.
  $: sorted_rows = (highlight_first_row ? data.slice(1) : [...data]).sort(
    (a, b) => {
      const a_value = sort_value ? sort_value(a) : a[sort_column];
      const b_value = sort_value ? sort_value(b) : b[sort_column];
      if (a_value == null || b_value == null) {
        return 0;
      }
      if (typeof a_value === "number" && typeof b_value === "number") {
        return sort_sign * (b_value - a_value);
      }
      // Text reads A–Z by default where numbers read high to low.
      return sort_sign * String(a_value).localeCompare(String(b_value));
    }
  );

  $: sortedData = [...pinned_rows, ...sorted_rows];

  /**
   * @param {string} column
   * @returns {void}
   */
  function sortByColumn(column) {
    sort_column = column;
    sort_value = null;
  }

  /** @param {string} column */
  function format_column(column) {
    if (column_headers[column]) {
      return column_headers[column];
    }
    if (column === "total_funding") {
      return TOTAL_FUNDING_HEADER;
    }
    return column.replaceAll("_", " ");
  }

  /**
   * Keep a trailing parenthetical on one line when a header wraps, so
   * "(FY 2022–25)" can't split into "(FY 2022–" and "25)". Spaces inside it
   * become no-break spaces and each en dash is flanked by word joiners, since
   * browsers otherwise allow a break after an en dash. No visible change.
   * @param {string} header
   */
  function keep_parenthetical_together(header) {
    return header.replace(/\([^)]*\)$/, (group) =>
      group.replaceAll(" ", "\u00a0").replaceAll("–", "\u2060–\u2060")
    );
  }
</script>

<div
  class="table-wrapper"
  class:table-wrapper--height-limit={limit_height}
  class:table-wrapper--fit-last={fit_last_column}
>
  <table
    class="data-table"
    class:data-table--fit-last={fit_last_column}
    class:data-table--wide-second={wide_second_column && !fit_last_column}
  >
    <thead>
      <tr>
        {#each columns as column}
          {#if column != "url"}
            <th on:click={(e) => sortByColumn(column)}
              >{keep_parenthetical_together(format_column(column))}</th
            >
          {/if}
        {/each}
      </tr></thead
    >
    <tbody>
      {#each sortedData as row, row_index}
        <tr class:row-highlight={row_index === 0 && highlight_first_row}>
          {#each columns as column}
            {#if column != "url"}
              {#if column === link_column}
                {#if row.url}
                  {#if format_funs_list.includes(column)}
                    <td
                      ><a href={row.url}>{format_funs[column](row[column])}</a
                      ></td
                    >
                  {:else}
                    <td><a href={row.url}>{row[column]}</a></td>
                  {/if}
                {:else}
                  <td>{row[column]}</td>
                {/if}
              {:else if format_funs_list.includes(column)}
                <td
                  on:mousemove={(e) => on_cell_mousemove(e, row, column)}
                  on:mouseleave={() => on_cell_mouseleave(column)}
                  >{format_funs[column](row[column])}</td
                >
              {:else}
                <td
                  on:mousemove={(e) => on_cell_mousemove(e, row, column)}
                  on:mouseleave={() => on_cell_mouseleave(column)}
                  >{row[column]}</td
                >
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
    max-height: clamp(500px, 60vw, 1000px);
  }
  table.data-table {
    border-collapse: collapse;
    width: 100%;
  }
  table.data-table thead th {
    text-align: left;
    padding: 1rem 0.5rem;
    font-size: 18px;
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-sans-alt);
  }
  table.data-table thead tr {
    position: sticky;
    top: 0;
    background: var(--color-blue);
    color: var(--color-white);
  }
  table.data-table tbody td {
    padding: 1rem 0.5rem;
    font-size: 14px;
  }
  table.data-table--wide-second tbody td:nth-child(2) {
    min-width: 250px;
  }
  /* Shrink-to-fit: a 1% width on an auto-layout table makes the column take
     exactly its widest cell, and nowrap makes that the header's full line. */
  table.data-table--fit-last thead th:last-child,
  table.data-table--fit-last tbody td:last-child {
    width: 1%;
    white-space: nowrap;
  }
  /* Keyed to the table's own width rather than the viewport, since the same
     table sits in different-width blocks on different pages. 560px leaves the
     one-line header (~340px) and a usable first column. Below it, the 1% width
     goes too: with wrapping allowed it would shrink the column to its
     narrowest word. Auto layout instead shares the width out by content, so
     the header wraps gradually, two lines before three. */
  .table-wrapper--fit-last {
    container-type: inline-size;
  }
  @container (max-width: 560px) {
    table.data-table--fit-last thead th:last-child,
    table.data-table--fit-last tbody td:last-child {
      width: auto;
    }
    table.data-table--fit-last thead th:last-child {
      white-space: normal;
      text-wrap: balance;
    }
  }
  table.data-table tbody td a,
  table.data-table tbody td a:visited {
    color: var(--color-black);
    text-decoration: underline;
  }
  table.data-table tbody td a:hover {
    color: var(--color-blue);
  }
  table.data-table tbody td:last-child,
  table.data-table thead th:last-child {
    text-align: right;
  }
  table.data-table tbody td:first-child {
    font-weight: var(--font-weight-bold);
    /* border-right: solid 1px var(--color-gray); */
  }
  table tbody tr:nth-child(even) {
    background: var(--color-gray-shade-lightest);
  }
  table tbody tr.row-highlight {
    background: var(--color-blue-shade-lightest);
  }
  @media (max-width: 768px) {
    table.data-table--wide-second tbody td:nth-child(2) {
      min-width: 150px;
    }
  }
</style>
