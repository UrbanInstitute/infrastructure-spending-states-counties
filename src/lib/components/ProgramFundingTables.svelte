<script>
  import { base } from "$app/paths";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import Table from "$components/LinkTable.svelte";
  import { program_list } from "$stores/programs.js";
  import { slugify_program, get_program_name } from "$lib/utils.js";

  export let data = [];
  /**
   * Generates an array of program funding amounts for the table
   * @param {{name: string, short_name: string, type: string}[]} program_data - The program data to format
   * @returns {{program: string, funding_per_1k: number}[]} The formatted program data
   */
  function formatProgramDataForTable(program_data, funding_data) {
    const county_programs = Object.keys(funding_data).map((program) =>
      program.replace("_per_1k", "")
    );
    return program_data
      .filter(
        (program) =>
          county_programs.includes(program.short_name) &&
          funding_data[`${program.short_name}_per_1k`] > 0
      )
      .map((program) => {
        return {
          program: get_program_name(program.short_name),
          url: `${base}/program/${slugify_program(program.short_name)}`,
          total_funding: funding_data[program.short_name],
        };
      });
  }

  const format_funs = {
    funding_per_1k: (val) => `$${Math.round(val).toLocaleString()}`,
    total_funding: (val) => `$${Math.round(val).toLocaleString()}`,
  };

  $: iija_program_funding = formatProgramDataForTable($program_list, data);
  // $: hud_program_funding = formatProgramDataForTable(
  //   $program_list.filter((program) => program.type == "HUD"),
  //   data
  // );
</script>

<div class="section-label"><p>Program funding</p></div>
<div class="spacing" />
<LayoutBlock>
  <!-- <h2 class="module-subhead">IIJA Program funding</h2> -->
  {#if iija_program_funding.length > 0}
    <Table
      sort_column="total_funding"
      data={iija_program_funding}
      limit_height
      {format_funs}
    />
  {:else}
    <div class="funding-table--no-programs">
      <p>No IIJA program funding data available for this county.</p>
    </div>
  {/if}
</LayoutBlock>

<!-- <div class="section-label"><p>HUD funding</p></div> -->
<!-- <div class="spacing" /> -->
<!-- <LayoutBlock> -->
<!-- <h2 class="module-subhead">HUD Program funding</h2> -->
<!-- <Table data={hud_program_funding} limit_height {format_funs} sort_column="total_funding" /> -->
<!-- </LayoutBlock> -->

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
