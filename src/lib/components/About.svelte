<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import Heading from "$components/common/Heading.svelte";
  import TextBlocks from "$components/common/TextBlocks.svelte";
  import IconDownload from "$assets/icon_download.svg";
  import { format_text_template } from "$lib/utils.js";
  import { base } from "$app/paths";
  import { logClickToGA } from "$lib/analytics";
  import site_content from "$data/site_content.aml";

  /** @type {any} */
  export let content = [];
</script>

<Heading text="About" />
<TextBlocks
  blocks={content.text.map((/** @type {{ value: any }} */ { value }) => ({
    type: "text",
    value: format_text_template(value, { base: base }),
  }))}
/>
<div class="text-width about--button-wrap">
  <div class="about--button-item">
    <a
      class="button-link about--button"
      href={site_content.meta.data_url}
      target="_blank"
      on:click={(e) => {
        logClickToGA(e.target, "download-data-button--click");
      }}>Download data <img src={IconDownload} alt="" style:width={"16px"} /></a
    >
  </div>
  <div class="about--button-item">
    <a
      class="button-link about--button"
      href={site_content.meta.hub_url}
      target="_blank"
      on:click={(e) => {
        logClickToGA(e.target, "technical-appendix-button--click");
      }}>Visit the Infrastructure Investments Hub</a
    >
  </div>
</div>

<style>
  /* Wraps so the two buttons stack inside the gutter on narrow screens. */
  .about--button-wrap {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: var(--spacing-4);
    margin-top: var(--spacing-12);
  }
  /* `a.button-link` (app.css) is inline-block; lay the label and icon out
     side by side as the Button component did. The icon asset is black, so
     it is inverted to sit on the blue fill like the white label. */
  .about--button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
  }
  .about--button img {
    filter: brightness(0) invert(1);
  }
</style>
