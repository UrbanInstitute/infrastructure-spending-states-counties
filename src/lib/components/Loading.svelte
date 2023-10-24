<script>
  export let height = 500;
  export let label = "Loading...";
</script>

<div class="loading--wrapper" style:height={`${height}px`}>
    <div class="skeleton skeleton-content"/>
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
  .skeleton-text {
    width: 100%;
    height: 0.7rem;
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
  }

  .skeleton-text__body {
    width: 75%;
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
