<script>
	import Heading from '$components/common/Heading.svelte';
	import TextBlocks from '$components/common/TextBlocks.svelte';
	import List from '$components/common/List.svelte';

	export let content = {};
</script>

<Heading text="Project Credits" />
<TextBlocks blocks={content.funding} />
<List items={content.individuals} labelKey="role" valueKey="credit" />
<p class="github-link text-width">View the project on <a href={content.github_url} target="_blank">Github</a></p>
