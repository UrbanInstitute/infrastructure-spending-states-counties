<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  export let height = 500;
</script>

<div class="loading--wrapper" style:height={`${height}px`}>
  <div class="skeleton skeleton-content" />
</div>

<style>
  @keyframes skeleton-loading {
    0% {
      background-color: var(--color-gray-shade-light);
    }
    100% {
      background-color: var(--color-gray-shade-lightest);
    }
  }
  .skeleton {
    animation: skeleton-loading 1s linear infinite alternate;
  }
  .skeleton-content {
    width: 100%;
    height: 100%;
    border-radius: 8px;
  }
</style>
