<script>
  import { fade } from "svelte/transition";
  import info_icon from "$assets/information_icon.svg";
  import { logClickToGA } from "$lib/analytics";
  export let text = "";
  export let button_size = 31;

  let buttonEl;

  let show_text = false;
  let text_y_pos = 0;
  let text_x_pos = 0;
</script>

<svelte:window
  on:click={(e) => {
    if (e.target == buttonEl || e.target.parentNode == buttonEl) {
      return;
    }
    show_text = false;
  }}
/>
<div class="helptip--wrapper">
  <button
    bind:this={buttonEl}
    on:click={(e) => {
      show_text = !show_text;
      const rect = e.target.getBoundingClientRect();
      text_y_pos = rect.top + window.scrollY;
      text_x_pos = rect.left;
      logClickToGA(e.detail.target, "helptip--" + (show_text ? "open" : "close"));
    }}
  >
    <img
      src={info_icon}
      alt={"Information icon"}
      style:width="{button_size}px"
    />
  </button>
  {#if show_text}
    <div
      class="helptip--text-wrapper"
      transition:fade={{ duration: 100 }}
      style:top="{text_y_pos}px"
      style:left="{text_x_pos}px"
    >
      <p>{@html text}</p>
    </div>
  {/if}
</div>

<style>
  button {
    appearance: none;
    background: none;
    border: none;
    cursor: pointer;
  }
  .helptip--wrapper {
    /* position: relative; */
  }
  .helptip--text-wrapper {
    background: var(--color-white);
    position: absolute;
    right: 0;
    top: 0;
    width: 350px;
    padding: var(--spacing-4);
    transform: translate(-100%, -100%);
    border: solid 1px var(--color-gray-shade-light);
    box-shadow: 0px 4px 4px 1px rgba(0, 0, 0, 0.25);
  }
  .helptip--text-wrapper p {
    font-size: var(--font-size-small);
  }
  @media (max-width: 768px) {
    .helptip--text-wrapper {
      left: var(--spacing-6) !important;
      width: calc(100% - var(--spacing-12));
      transform: translate(0, -100%);
    }
  }
</style>
