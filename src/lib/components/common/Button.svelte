<script>
  export let style = "default"; // or 'blue'
  export let disabled = false;
</script>

<button on:click {disabled}>
  <div class={`button-content-container ${style}`}>
    <slot>Default Button</slot>
  </div>
</button>

<style>
  button {
    appearance: none;
    cursor: pointer;
    border: none;
    padding: 0px;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .button-content-container {
    padding: 12px 16px;
    font-size: var(--font-size-large);
    font-weight: var(--font-weight-bold);
    line-height: var(--leading-none);
    text-transform: uppercase;
    text-decoration: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    font-family: var(--font-family-sans);
  }
  .button-content-container.default {
    color: var(--color-black);
    background: var(--color-white);
    border: solid 2px var(--color-black);
  }

  .button-content-container.blue {
    color: var(--color-white);
    background: var(--color-blue);
    border: none;
  }

  @media(max-width: 768px) {
    .button-content-container {
      font-size: var(--font-size-medium);
    }
  }
</style>
