<script>
  import { base } from "$app/paths";
  import { get_site_url } from "$lib/utils";
  import site_content from "$data/site_content.json";

	export let title = "";
	export let description = "";
	export let url = "";
  export let site_name = "Urban Institute";
  /** @type {string[]} */
  export let authors = site_content.meta.authors;
  /** @type {string[]} */
  export let keywords = site_content.meta.keywords;

  $: schema_meta = {
      "@context": "http://schema.org",
      "@type": "NewsArticle",
      "headline": title,
      "url": url,
      "thumbnailUrl": `${get_site_url()}social.jpg`,
      "dateCreated": "2023-10-25T05:00:00.000Z",
      "articleSection": "Data Tool",
      "creator": authors,
      "keywords": keywords
    }
  $: schema_meta_markup = `<script type="application/ld+json">${JSON.stringify(schema_meta)}<\/script>`;

</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content="" />

	<meta property="og:title" content={title} />
	<meta property="og:site_name" content={site_name} />
	<meta property="og:url" content={url} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />

	<meta property="og:image" content="{get_site_url()}social.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="675" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@urbaninstitute" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image:src" content="{get_site_url()}social.jpg" />

	<meta name="robots" content="max-image-preview:large" />

	<link rel="canonical" href="{url}" />

	<!-- Google Tag Manager -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-N0EZ8ZMM8T"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag({}) {
			dataLayer.push(arguments);
		}
		gtag("js", new Date());
		gtag("config", "G-N0EZ8ZMM8T");
	</script>
	<!-- End Google Tag Manager -->
	<!-- schema.org metadata -->
  {@html schema_meta_markup}
	<!-- End shema.org metadata -->
  
</svelte:head>
