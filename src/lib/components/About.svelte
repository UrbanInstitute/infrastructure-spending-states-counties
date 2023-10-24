<script>
  import Heading from "$components/common/Heading.svelte";
  import TextBlocks from "$components/common/TextBlocks.svelte";
  import Button from "$components/common/Button.svelte";
  import IconDownload from "$assets/icon_download.svg";
  import { format_text_template } from "$lib/utils.js";
  import { base } from "$app/paths";
  import { logClickToGA } from "$lib/analytics";
  import site_content from "$data/site_content.json";

  export let content = [];
</script>

<Heading text="About" />
<TextBlocks
  blocks={content.text.map(({ value }) => ({
    type: "text",
    value: format_text_template(value, { "site-url": base }),
  }))}
/>
<div class="text-width about--button-wrap">
  <div class="about--button-item">
    <a href={site_content.meta.data_url} target="_blank">
    <Button
      on:click={(e) => {
        logClickToGA(e.target, "download-data-button--click");
      }}
      >Download Data <img
        src={IconDownload}
        alt=""
        style:width={"16px"}
      /></Button>
    </a>
  </div>
  <div class="about--button-item">
    <a href={site_content.meta.report_url} target="_blank">
      <Button
        on:click={(e) => {
          logClickToGA(e.target, "technical-appendix-button--click");
        }}
        >Read report <img
          src={IconDownload}
          alt=""
          style:width={"16px"}
        /></Button>
    </a>
  </div>
</div>

<style>
  .about--button-wrap {
    display: flex;
    justify-content: flex-start;
    margin-top: var(--spacing-12);
  }
  .about--button-item {
    margin-right: var(--spacing-4);
  }
  .about--button-item:last-child {
    margin-right: 0;
  }
</style>
