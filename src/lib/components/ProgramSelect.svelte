<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import Select from "$components/Select.svelte";
  import { get_program_name } from "$lib/utils.js";

  /**
   * @type {{name: string, short_name: string, type?: string}[]}
   * @required
   */
  export let programs;

  /** @type {string} */
  export let value;

  /** @type {boolean} */
  export let clearable = false;

  export let show_label = false;

  /**
   * Produces the option label for a `short_name`. Override when the option list
   * is not federal programs — e.g. `category_display_name` for infrastructure
   * categories.
   * @type {(short_name: string) => string}
   */
  export let get_label = get_program_name;

  /** @type {string} */
  export let placeholder = "Search for a specific program";

  $: program_items = programs.map((program) => {
    return {
      value: program.short_name,
      label: get_label(program.short_name),
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
      {placeholder}
    />
  </div>
</div>

<style>
</style>
