<script>
  import { page } from "$app/stores";
  import twitterIcon from "$assets/icon_twitter.svg";
  import facebookIcon from "$assets/icon_facebook.svg";
  import linkedinIcon from "$assets/icon_linkedin.svg";
  import mailIcon from "$assets/icon_mail.svg";
  import { logClickToGA } from "$lib/analytics";

  const base_share_url = "https://www.addtoany.com/add_to";
  $: encoded_url_to_share = encodeURIComponent($page.url.href);

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
