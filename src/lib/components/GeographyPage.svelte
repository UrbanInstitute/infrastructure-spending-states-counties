<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { format_text_template, get_site_url } from "$lib/utils";
  import Meta from "$components/Meta.svelte";
  import SearchNavBar from "$components/SearchNavBar.svelte";
  import LocationDetails from "$lib/components/LocationDetails.svelte";
  import {
    resolve_map_category,
    DEFAULT_GEOGRAPHY_CATEGORY,
  } from "$stores/map_category";
  import site_content from "$data/site_content.aml";

  /**
   * The page shared by the state, county and CBSA routes. Each route's
   * `+page.svelte` renders this with the data its `load_place` call returned.
   * @type {Awaited<ReturnType<typeof import('$lib/server/place_data').load_place>>}
   */
  export let data;

  /** @type {"state" | "county" | "cbsa"} */
  export let geo_type;

  // The template keys LocationDetails on `data.place.fips` so that navigating
  // between two pages of this route (state to state, county to county)
  // rebuilds it and its charts instead of carrying their local state over to
  // the next place. The key block is written without inner whitespace because
  // Svelte 4 renders whitespace inside a key block as a space in the SSR
  // output, and the prerendered pages must not change.

  /**
   * The page's one category selection, shared by the funding map and the
   * community-needs section: changing either selector changes both. It lives
   * here, outside the `{#key}` below, so it carries over from place to place;
   * `LocationDetails` re-checks it against each place's funded categories.
   *
   * Deep links carry `?category=`. `?program=` is the legacy spelling from the
   * program-centric version of the tool and is still accepted, because the
   * links in the wild under that name are the ones this param exists to
   * protect — and they carry program short names, not categories.
   * `resolve_map_category` takes either. A value it cannot resolve leaves the
   * default in place rather than selecting something the map has no data for.
   * @type {string}
   **/
  let selected_category = DEFAULT_GEOGRAPHY_CATEGORY;

  onMount(() => {
    const params = $page.url.searchParams;
    const requested = params.get("category") ?? params.get("program");
    if (!requested) return;

    const category = resolve_map_category(requested);
    if (category) {
      selected_category = category;
    } else {
      console.warn(
        `Ignoring "${requested}": not an infrastructure category or a known federal program.`
      );
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
  url={get_site_url(`${geo_type}/${data.place.fips}`)}
/>
<SearchNavBar
  label="for a type of infrastructure, a federal program, or a geography."
/>
{#key data.place.fips}<LocationDetails
    program_funding={data.place}
    {geo_type}
    comparison_buckets={data.comparison_buckets}
    bind:selected_category
  />{/key}
