<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  /** @type {string | null} */
  export let image = null;

  /** @type {string | null} */
  export let imageAlt = null;

  /** @type {string | null} */
  export let imageCredit = null;
</script>

<div class="hero-wrap">
  {#if image}
    <figure>
      <div class="hero-image-wrap">
        <img src={image} alt={imageAlt} class="hero-image" />
      </div>
      {#if imageCredit}
        <figcaption>
          <p>{imageCredit}</p>
        </figcaption>
      {/if}
    </figure>
  {/if}
</div>

<style>
  figure {
    margin: 0;
  }
  figcaption {
    margin-left: var(--spacing-4);
    margin-top: var(--spacing-4);
  }
  figcaption p {
    font-size: var(--font-size-small);
    font-style: italic;
    margin-bottom: 0;
    margin: 0;
  }
  .hero-wrap {
    margin-bottom: var(--spacing-8);
  }
  .hero-image-wrap {
    width: 100%;
    aspect-ratio: 144/50;
    max-height: 500px;
  }
  .hero-image-wrap img {
    display: block;
    object-fit: cover;
    object-position: center bottom;
    width: 100%;
    height: 100%;
  }
  @media screen and (min-width: 376px) {
    .hero-wrap {
      margin-bottom: var(--spacing-12);
    }
  }
  @media screen and (min-width: 768px) {
    .hero-wrap {
      margin-bottom: var(--spacing-16);
    }
  }
</style>
