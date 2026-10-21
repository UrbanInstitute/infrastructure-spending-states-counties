<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import { page } from "$app/stores";
  import { base, resolveRoute } from "$app/paths";
  import { get_site_url } from "$lib/utils";
  import twitterIcon from "$assets/icon_twitter.svg";
  import facebookIcon from "$assets/icon_facebook.svg";
  import linkedinIcon from "$assets/icon_linkedin.svg";
  import mailIcon from "$assets/icon_mail.svg";
  import { logClickToGA } from "$lib/analytics";

  const base_share_url = "https://www.addtoany.com/add_to";
  // $page.url.href is http://sveltekit-prerender/... at build time, and while
  // prerendering `base` is a relative path ("." or "../.."), so neither can simply
  // be sliced off the pathname. resolveRoute() prefixes that same `base`, so slicing
  // it off the resolved route gives the app-relative path both at build time and in
  // the browser; get_site_url() then adds the host for the build mode and the
  // trailing slash.
  $: app_path = $page.route.id
    ? resolveRoute($page.route.id, $page.params).slice(base.length)
    : "";
  $: url_to_share = get_site_url(app_path.replace(/^\/|\/$/g, ""));
  $: encoded_url_to_share = encodeURIComponent(url_to_share);

  $: socials = [
    {
      name: "twitter",
      icon: twitterIcon,
      url: `${base_share_url}/twitter?linkurl=${encoded_url_to_share}&linknote=`,
    },
    {
      name: "facebook",
      icon: facebookIcon,
      url: `${base_share_url}/facebook?linkurl=${encoded_url_to_share}&linknote=`,
    },
    {
      name: "linkedin",
      icon: linkedinIcon,
      url: `${base_share_url}/linkedin?linkurl=${encoded_url_to_share}&linknote=`,
    },
    {
      name: "contact urban institute",
      icon: mailIcon,
      url: `${base_share_url}/email?linkurl=${encoded_url_to_share}&linknote=`,
    },
  ];
</script>

<div class="social-container">
  {#each socials as social}
    <a
      href={social.url}
      target="_blank"
      rel="noreferrer"
      on:click={(event) =>
        logClickToGA(event.target, "social-button-click--" + social.name)}
      ><img
        class="social-icon"
        src={social.icon}
        alt={`${social.name} link`}
      /></a
    >
  {/each}
</div>

<style>
  .social-container {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-bottom: var(--spacing-12);
  }
  .social-icon {
    height: 24px;
    width: 24px;
  }
</style>
