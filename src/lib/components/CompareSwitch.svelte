<script>
  import { logClickToGA } from "$lib/analytics";
  /* @type {string[]} [options] */
  export let options;
  export let value;
  export let label = "";

  let active_index = 0;

  $: value = options[active_index].value;
  $: active_label = options[active_index].label;

  function on_next(e) {
    if (active_index < options.length - 1) {
      active_index++;
    }
    logClickToGA(e.target, "compare-switch-next--" + active_index);
  }
  function on_previous(e) {
    if (active_index > 0) {
      active_index--;
    }
    logClickToGA(e.target, "compare-switch-previous--" + active_index);
  }
</script>

<div class="compare-switch">
  <button class="compare-switch--button" on:click={on_previous} disabled={active_index < 1}>
    <svg width="24" height="16" viewbox="0 0 16 24">
      <path d="M16,0 L0,12 L16,24 Z" fill="black"></path>
    </svg>
  </button>
  <p class="compare-switch--text"> <span class="compare-switch--text-value">{active_label} ({active_index + 1}/{options.length})</span></p>
  <button class="compare-switch--button" on:click={on_next} disabled={active_index >= options.length - 1}>
    <svg width="24" height="16" viewbox="0 0 16 24">
      <path d="M0,0 L16,12 L0,24 Z" fill="black"></path>
    </svg>
  </button>
</div>

<style>
  .compare-switch {
    border-top: solid 1px var(--color-gray-shade-light, #000000);
    border-bottom: solid 1px var(--color-gray-shade-light, #000000);
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-2) 0;
  }

  .compare-switch--button {
    appearance: none;
    background: none;
    border: none;
    cursor: pointer;
  }
  .compare-switch--button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .compare-switch--text {
    font-size: var(--font-size-small);
    line-height: 1.5;
    margin: 0;
    text-transform: uppercase;
    text-align: center;
  }
  .compare-switch--text-value {
    font-weight: var(--font-weight-bold);
  }

</style>
