<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { format_text_template, get_site_url } from "$lib/utils";
  import { get_funding_data } from "$stores/funding_data";
  import SubNav from "$components/SubNav.svelte";
  import Meta from "$components/Meta.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import LocationDetails from "$lib/components/LocationDetails.svelte";
  import site_content from "$data/site_content.aml";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {string | null} */
  let program_state = "cdbg_entitlement";

  $: map_program = program_state;
  $: beeswarm_program = program_state;

  /** @type string | null **/
  $: equity_score_program = program_state;

  $: map_program_data =
    browser && map_program
      ? get_funding_data(map_program, "county")
      : new Promise(() => {});
  $: beeswarm_program_data =
    browser && beeswarm_program
      ? get_funding_data(beeswarm_program, "county")
      : new Promise(() => {});

  onMount(() => {
    if ($page.url.searchParams.has("program")) {
      program_state = $page.url.searchParams.get("program");
    }
  });
</script>

<Meta
  title={format_text_template(site_content.meta.title_geography, {
    geography: `${data.place.name}`,
  })}
  description={format_text_template(site_content.meta.description_geography, {
    geography: `${data.place.name}`,
  })}
  url={get_site_url(`county/${data.place.fips}`)}
/>
<SearchNavBar
  label="Search for a type of infrastructure, a federal program, or a geography."
/>
<SubNav page_type="County Overview" page_name={data.place.name} />
<LocationDetails
  program_funding={data.place}
  {map_program_data}
  {beeswarm_program_data}
  comparison_buckets={data.comparison_buckets}
  bind:map_program
  bind:beeswarm_program
  bind:equity_score_program
  geo_type="county"
/>
