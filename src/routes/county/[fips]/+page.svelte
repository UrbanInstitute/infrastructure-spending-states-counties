<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import GeographyPage from "$components/GeographyPage.svelte";

  /** @type {import('./$types').PageData} */
  export let data;
</script>

<GeographyPage {data} geo_type="county" />
