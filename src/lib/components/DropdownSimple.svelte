<script>
  /** @typedef {Object} DropdownOption
   *  @property {string} label
   *  @property {any} value
   *  @property {boolean} [disabled]
   */

  /** @type {DropdownOption[]} */
  export let options;

  /** @type {any} */
  export let current_value;
</script>

<div class="dropdown-wrapper">
  <select class="simple-dropdown" bind:value={current_value}>
    {#each options as opt}
      <option disabled={opt.disabled} value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  <span class="dropdown-icon">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.1313 3.66667C15.5179 3.66667 15.7794 3.84606 15.9272 4.20483C16.0749 4.56361 15.9954 4.85511 15.7111 5.09056L8.65117 12.1203C8.45791 12.2661 8.2419 12.3333 8.00316 12.3333C7.76442 12.3333 7.57115 12.2661 7.42335 12.1203L0.283802 5.09056C-0.000415318 4.85511 -0.0686276 4.5524 0.0677969 4.20483C0.21559 3.84606 0.477071 3.66667 0.863607 3.66667H15.1313Z"
        fill="black"
      />
    </svg>
  </span>
</div>

<style>
  .dropdown-wrapper {
    background: var(--color-gray-shade-lighter);
    display: inline-block;
    position: relative;
  }
  .dropdown-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    width: 14px;
  }
  .dropdown-icon svg {
    width: 100%;
    display: block;
  }
  .simple-dropdown {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    padding: 10px 30px 10px 10px;
    background: none;
    border: none;
    color: var(--color-black);
    font-family: inherit;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-small);
    line-height: var(--line-height-relaxed);
  }
</style>
