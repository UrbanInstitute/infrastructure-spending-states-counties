<script>
  import { base } from "$app/paths";
  import Logo from "$lib/components/urban-logo-badge.svelte";

  export let title = "";
</script>

<nav>
  <div class="logo">
    <a href="https://www.urban.org">
      <Logo width={30} />
    </a>
  </div>
  {#if title}
  <div class="project-title layout-container--article-width">
    <a href="{base}/">
      <p class="nav--page-title">{title}</p>
    </a>
  </div>
  {/if}
</nav>

<style>
  nav {
    background: var(--color-white);
    color: var(--color-white, #ffffff);
    display: flex;
    border-bottom: solid 1px var(--color-gray);
    padding: var(--spacing-2) 0;
    position: relative;
    min-height: 48px;
  }
  .logo {
    /* margin-left: var(--spacing-2); */
    left: var(--spacing-2);
  }
  a {
    text-decoration: none;
  }
  .nav--page-title {
    margin-left: var(--spacing-4);
    margin-bottom: 0;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-large);
  }
  .project-title {
    width: 100%;
  }
  @media (min-width: 768px) {
    .project-title {
      align-self: center;
      /* transform: translateX(calc(-30px + var(--spacing-2))); */
    }
    .nav--page-title {
      margin-left: 0;
    }
    .logo {
      position: absolute;
    }
  }
</style>
