<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->

<script>
  // layout helpers
  import LayoutSection from "$components/LayoutSection.svelte";
  import LayoutHero from "$components/LayoutHero.svelte";
  import MapSection from "$components/MapSection.svelte";

  // page components
  import ProgramInfo from "$components/ProgramInfo.svelte";
  import FundingMap from "$components/FundingMap.svelte";
  import Card from "$components/Card.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import About from "$components/About.svelte";
  import Credits from "$components/Credits.svelte";
  import Meta from "$components/Meta.svelte";
  import site_content from "$data/site_content.aml";
  import {
    format_text_template,
    slugify_program,
    get_site_url,
    get_program_language_vars,
  } from "$lib/utils.js";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {"state" | "county" | "cbsa"} */
  let map_level = "state";

  $: program_language_vars = get_program_language_vars(data.program_short_name);
</script>

<Meta
  title={format_text_template(site_content.meta.title_program, {
    program: program_language_vars?.program_name ?? null,
  })}
  description={format_text_template(site_content.meta.description_program, {
    program: program_language_vars?.program_name ?? null,
  })}
  url={get_site_url(`program/${slugify_program(data.program_short_name)}`)}
/>
<SearchNavBar
  label="for a type of infrastructure, a federal program, or a geography."
/>
<div class="">
  <LayoutHero>
    <ProgramInfo {program_language_vars} program_data={data} />
  </LayoutHero>

  <!-- Funding Map (state and CBSA only) -->
  <LayoutSection theme="gradient">
    <MapSection
      title={site_content.program_pages.map.header}
      bind:map_level
      ga_control="program-map-geo-toggle"
    >
      <Card>
        <FundingMap
          selected_program={data.program_short_name}
          bind:map_level
          show_program_link={false}
          legend_title={site_content.program_pages.map.subhead_map}
          note={map_level === "cbsa"
            ? site_content.program_pages.map.cbsa_note
            : null}
        />
      </Card>
    </MapSection>
  </LayoutSection>

  <LayoutSection theme="white" hairline>
    <About content={site_content.about} />
    <Credits content={site_content.credits} />
  </LayoutSection>
</div>
