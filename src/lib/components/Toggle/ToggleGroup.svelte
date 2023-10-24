<script>
  import ToggleButton from "./ToggleButton.svelte";
  import { createEventDispatcher } from "svelte";
  /**
   * Group of options to select between
   * @type {Array<{ label: string, value: string }>}
   **/
  export let options = [];

  /**
   * Value of the active option
   * @type {string | null}
   **/
  export let value = null;

  export let disabled = false;

  const dispatch = createEventDispatcher();
</script>

<div class="toggle-group-wrapper">
  {#each options as option}
    <ToggleButton
      label={option.label}
      value={option.value}
      {disabled}
      on:click={(e) => {
        value = option.value;
        dispatch("change", {target: e.target});
      }}
      is_active={value === option.value}
    />
  {/each}
</div>
