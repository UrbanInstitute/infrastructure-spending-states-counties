<script>
  import Select from "$components/Select.svelte";
  import { get_program_name } from "$lib/utils.js";

  /**
   * @type {{name: string, short_name: string, type: string}[]}
   * @required
   */
  export let programs;

  /** @type {string} */
  export let value;

  /** @type {boolen} */
  export let clearable = false;

  export let show_label = false;

  $: program_items = programs.map((program) => {
    return {
      value: program.short_name,
      label: get_program_name(program.short_name),
      subtext: program.type,
    };
  });
</script>

<div class="program-select--wrapper">
  {#if show_label}
    <p class="program-select--label"><em>Search for a program</em></p>
  {/if}
  <div class="program-select--select-wrapper">
    <Select
      items={program_items}
      bind:value
      on:change
      {clearable}
      placeholder="Search for a specific program"
    />
  </div>
</div>

<style>
</style>
