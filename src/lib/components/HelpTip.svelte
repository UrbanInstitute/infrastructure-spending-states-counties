<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { fade } from "svelte/transition";
  import info_icon from "$assets/information_icon.svg";
  import { logClickToGA } from "$lib/analytics";
  export let text = "";
  export let button_size = 31;
  export let align = "left";

  /** @type {HTMLButtonElement} */
  let buttonEl;

  let show_text = false;
</script>

<svelte:window
  on:click={(e) => {
    const target = /** @type {any} */ (e.target);
    if (target == buttonEl || target.parentNode == buttonEl) {
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
      logClickToGA(
        e.currentTarget,
        "helptip--" + (show_text ? "open" : "close")
      );
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
      class="helptip--text-wrapper {align}-align"
      transition:fade={{ duration: 100 }}
    >
      <p>{@html text}</p>
    </div>
  {/if}
</div>

<style>
  /* The tip is positioned against this wrapper, which shrinks to the button
     (an inline block, or a flex item where the parent is a flex row), so no
     measuring is needed: it sits above the button whatever the page around
     it does (review #5). */
  .helptip--wrapper {
    position: relative;
    display: inline-block;
  }
  button {
    appearance: none;
    background: none;
    border: none;
    cursor: pointer;
  }
  /* Above the button. The default opens to its upper-left, right edges
     aligned; `right-align` opens to its upper-right, left edges aligned. */
  .helptip--text-wrapper {
    background: var(--color-white);
    position: absolute;
    bottom: 100%;
    right: 0;
    width: 350px;
    padding: var(--spacing-4);
    border: solid 1px var(--color-gray-shade-light);
    box-shadow: 0px 4px 4px 1px rgba(0, 0, 0, 0.25);
  }
  .helptip--text-wrapper.right-align {
    right: auto;
    left: 0;
  }
  .helptip--text-wrapper p {
    font-size: var(--font-size-small);
  }
  @media (max-width: 768px) {
    /* The content column starts one gutter in from the viewport edge and the
       button sits at its start, so a tip of the viewport width less both
       gutters spans the column, as it did when it was placed against the
       hero surface. */
    .helptip--text-wrapper,
    .helptip--text-wrapper.right-align {
      right: auto;
      left: 0;
      width: calc(100vw - var(--spacing-12));
    }
  }
</style>
