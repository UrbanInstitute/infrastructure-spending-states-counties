<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { base } from "$app/paths";
  import LayoutBlock from "$components/LayoutBlock.svelte";
  import Pillbox from "$components/Pillbox.svelte";
  import { format_text_template, slugify_program } from "$lib/utils.js";
  import { category_display_name } from "$stores/categories.js";
  import { program_map } from "$stores/programs.js";
  import CategoryIcon from "$components/icons/CategoryIcon.svelte";
  import MoneyIcon from "$components/icons/Money.svelte";
  import site_content from "$data/site_content.aml";

  export let program_language_vars;
  export let program_data;

  // Programs without a program_language.json entry fall back to the display name
  // on programs_simple.json, which every program carries.
  $: program_name =
    program_language_vars?.program_name ??
    $program_map.get(program_data.program_short_name)?.name ??
    "";

  // Derive funding type string; null when neither flag is set, which drops the pill
  $: funding_type = (() => {
    if (program_data.formula === 1 && program_data.competitive === 1)
      return "Formula and Competitive";
    if (program_data.formula === 1) return "Formula";
    if (program_data.competitive === 1) return "Competitive";
    return null;
  })();

  /**
   * `airport_infrastructure` and `infra` lost their separator upstream and read
   * as one run-on string (`…/viewhttps://www.faa.gov/airports`), so separators
   * alone do not reach them. Break at an embedded scheme, but leave a URL encoded
   * inside a query string (`?url=https://…`) alone.
   * @param {string} token
   * @returns {string[]}
   */
  function split_run_on_urls(token) {
    return token.replace(/([^=?&%:/])(https?:\/\/)/g, "$1 $2").split(" ");
  }

  /**
   * `website` holds one or more URLs, separated by `\r\n`, by `, `, or by both.
   * Each one is rendered as its own link, so split on either separator rather
   * than handing the whole field to `new URL()`, which strips the whitespace and
   * silently concatenates them into one invalid URL.
   * @param {string | undefined} website
   * @returns {Array<{href: string, hostname: string}>}
   */
  function parse_website_links(website) {
    if (!website || website === "TK") {
      return [];
    }
    return website
      .split(/[\s,]+/)
      .flatMap(split_run_on_urls)
      .filter(Boolean)
      .flatMap((url) => {
        try {
          const { href, hostname } = new URL(url);
          return [{ href, hostname }];
        } catch {
          return [];
        }
      });
  }

  $: website_links = parse_website_links(program_language_vars?.website);

  /**
   * Splits an AML template around one placeholder so its value can be rendered as
   * markup instead of text. Any other placeholder is substituted in place.
   * @param {string} template
   * @param {string} placeholder
   * @param {Record<string, any>} vars
   * @returns {string[]}
   */
  function split_template(template, placeholder, vars) {
    return template
      .split(`[${placeholder}]`)
      .map((part) => format_text_template(part, vars));
  }

  $: department_parts = split_template(
    site_content.program_pages.department_text,
    "agency_name",
    {}
  );

  $: learn_more_parts = split_template(
    site_content.program_pages.learn_more_text,
    "website_link",
    { program: program_name }
  );

  $: description_vars = Object.assign({}, program_language_vars, {
    program: program_name,
    total_obligated_funds: format_dollars(program_data.total_funding),
    website_text: website_links[0]?.hostname ?? null,
    website_url: website_links[0]?.href ?? null,
  });

  // temporary hotfix for description with missing [uses] variable
  /**
   * @param {string} template
   * @param {Record<string, any>} program_vars
   */
  function get_program_description(template, program_vars) {
    let description = format_text_template(template, program_vars);
    if (!program_vars.uses) {
      description = description.replace("The money can go toward [uses].", "");
    }
    return description;
  }

  /**
   * @param {number} input_num
   * @returns {string | null}
   */
  function format_dollars(input_num) {
    if (!input_num) {
      return null;
    }
    return input_num.toLocaleString("en", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
</script>

<div class="program-info-section">
  <LayoutBlock>
    <h1 class="overview-page--page-title">
      {program_name}
    </h1>

    <div class="program-badges">
      <div class="program-category-funding-wrapper">
        {#each program_data.categories as cat, i}
          <a href="{base}/program-categories/{slugify_program(cat)}/"
            ><div
              class="category-badge"
              data-category-name={category_display_name(cat)}
            >
              <CategoryIcon category={cat} size={50} />
            </div></a
          >{#if i < program_data.categories.length - 1}, {/if}
        {/each}
        {#if funding_type}
          <Pillbox size="large"
            ><span class="description-funding-type-icon"><MoneyIcon /></span
            ><span class="description-funding-type-pill-label"
              >{funding_type} Funding</span
            ></Pillbox
          >
        {/if}
      </div>
      <Pillbox
        ><span class="description-funding-pill-label"
          >{department_parts[0]}<strong>{program_data.agency_name}</strong
          >{department_parts[1] ?? ""}</span
        ></Pillbox
      >
    </div>

    <p class="description-tag">Program overview</p>
    <!-- `about_text` states the total itself, so the hardcoded sentence is only
         a fallback for a program with no copy entry, where `about_text` is skipped. -->
    <p class="page-description">
      {#if program_language_vars}{@html get_program_description(
          site_content.program_pages.about_text,
          description_vars
        )}{:else}
        {program_name}'s
        <strong
          >total obligated funds are
          <span class="description-funds-total"
            >{format_dollars(program_data.total_funding)}</span
          >.</strong
        >
      {/if}
    </p>

    {#if website_links.length > 0}
      <p class="description-tag">Learn more</p>
      <p>
        {learn_more_parts[0]}{#each website_links as link, i}<a
            href={link.href}
            target="_blank"
            rel="noopener">{link.hostname}</a
          >{#if i < website_links.length - 1}{", "}{/if}{/each}{learn_more_parts[1] ??
          ""}
      </p>
    {/if}
  </LayoutBlock>
</div>

<style>
  .category-badge {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: var(--color-gray-shade-lightest);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .program-category-funding-wrapper {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .description-funds-total {
    border-bottom: solid 3px var(--color-green);
  }
  .description-funding-pill-label {
    font-size: 13px;
    line-height: 21px;
  }
  .description-funding-type-pill-label {
    font-family: var(--font-family-sans-alt);
    font-size: 36px;
    line-height: 44px;
  }
  .description-funding-type-icon {
    flex-grow: 0;
    margin: 0;
  }
  .description-funding-type-icon :global(svg) {
    display: block;
    margin: 0;
  }
  .program-badges {
    margin-bottom: 3.5rem;
  }
  /* At 36px "Formula and Competitive Funding" wraps to three lines and the
     pill fills the screen; scale the badges, label, icon and padding down
     together. */
  @media (max-width: 768px) {
    /* Matches the funding-type pill's height (26px line + 8px padding). */
    .category-badge {
      width: 42px;
      height: 42px;
    }
    .category-badge :global(svg) {
      width: 30px;
      height: 30px;
    }
    .description-funding-type-pill-label {
      font-size: 20px;
      line-height: 26px;
    }
    .description-funding-type-icon :global(svg) {
      width: 28px;
      height: 28px;
    }
    .program-category-funding-wrapper :global(.pillbox-wrapper.large) {
      padding-block: var(--spacing-2);
      padding-inline: var(--spacing-2) var(--spacing-4);
      gap: var(--spacing-2);
    }
  }
</style>
