<script>
  import Select from "svelte-select";
  import { createEventDispatcher } from "svelte";

  /** @type {{value: string, label: string, subtext?: string}[]} */
  export let items;

  /** @type {string | undefined} */
  export let value;

  /** @type {boolean} */
  export let clearable = false;

  export let placeholder = "Search";

  export let searchable = true;

  const dispatch = createEventDispatcher();
  const chevron_path =
    "M15.1313 0.666626C15.5179 0.666626 15.7794 0.846014 15.9272 1.20479C16.0749 1.56356 15.9954 1.85507 15.7111 2.09052L8.65117 9.12027C8.45791 9.26602 8.2419 9.33329 8.00316 9.33329C7.76442 9.33329 7.57115 9.26602 7.42335 9.12027L0.283802 2.09052C-0.000415318 1.85507 -0.0686276 1.55235 0.0677969 1.20479C0.21559 0.846014 0.477071 0.666626 0.863607 0.666626H15.1313Z";
</script>
<div class="select">
    <Select
      {items}
      value={value}
      placeholder={placeholder}
      showChevron
      {searchable}
      {clearable}
      on:select
      on:clear
      on:change={({ detail }) => {
        value = detail.value;
        dispatch("change", {detail});
      }}
      on:clear={() => {
        value = undefined;
      }}
    >
    <div slot="chevron-icon">
        <svg
          width="20"
          height="12"
          viewBox="0 0 20 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><path d={chevron_path} fill="var(--color-blue)" /></svg
        >
      </div>
    </Select>
</div>
<style>

  .select {
    width: 100%;
    max-width: 450px;
    --border-radius: 0;
    --border: solid 1px var(--color-gray-shade-darker, #696969);
    --border-focused: solid 1px var(--color-blue, #1696d2);
    --chevron-color: var(--color-blue, #1696d2);
    --placeholder-color: var(--color-gray-shade-darker, #696969);
    --input-color: var(--color-black, #000000);

    /* list */
    --list-border-radius: 0;
    --item-first-border-radius: 0;
    --input-padding: 0;
    --internal-padding: 0;
    --item-padding: 0 var(--spacing-2) 0 var(--spacing-2);
    --list-border: solid 1px var(--color-gray-shade-lighter);

    /* items */
    --item-is-active-bg: var(--color-gray-shade-lighter);
    --item-is-active-color: var(--color-black);
    --item-hover-bg: var(--color-blue);
    --item-hover-color: var(--color-white);
    /* --selected-item-color: var(--color-black); */
    --selected-item-color: var(--color-black);
  }
  :global(.select .svelte-select input) {
    font-family: var(--font-family-sans);
    color: var(--color-black, #000000);
  }

  /* cursor for input */
  :global(.select input) {
    cursor: pointer !important;
  }

  :global(.select .indicators) {
    cursor: pointer !important;
  }

  /* scrollbar */
  :global(.select .svelte-select-list::-webkit-scrollbar) {
    width: 10px;
  }

  :global(.select .svelte-select-list::-webkit-scrollbar-track) {
    background: var(--color-gray-shade-lightest);
  }

  :global(.select .svelte-select-list::-webkit-scrollbar-thumb) {
    background: var(--color-gray-shade-dark);
    border: 1px solid var(--color-gray-shade-dark);
  }
  /* end scrollboar */
</style>
