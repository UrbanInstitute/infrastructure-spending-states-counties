<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
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
      {disabled}
      on:click={(e) => {
        value = option.value;
        dispatch("change", { target: e.target });
      }}
      is_active={value === option.value}
    />
  {/each}
</div>
