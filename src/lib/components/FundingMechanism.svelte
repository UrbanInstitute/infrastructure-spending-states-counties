<script>
/** @type {"formula" | "competitive" } */
export let mechanism;
</script>
<div class="funding-mechanism--wrap">
  <div class="funding-mechanism--item" class:active={mechanism.toLowerCase() === "formula"}>
    <div class="funding-mechanism--circle"></div>
    <p class="funding-mechanism--text">Formula</p>
  </div>
  <div class="funding-mechanism--item" class:active={mechanism.toLowerCase() === "competitive"}>
    <div class="funding-mechanism--circle"></div>
    <p class="funding-mechanism--text">Competitive</p>
  </div>
</div>
<style>
.funding-mechanism--wrap {
  display: flex;
  margin-top: var(--spacing-6);
}
.funding-mechanism--item {
  display: flex;
}
.funding-mechanism--item:not(:last-child) {
  margin-right: var(--spacing-6);
}
.funding-mechanism--circle {
  border-radius: 50%;
  background: var(--color-gray);
  height: 21px;
  width: 21px;
}
.funding-mechanism--item.active .funding-mechanism--circle {
  background: var(--color-blue);
}
.funding-mechanism--text {
  font-size: var(--font-size-small);
  margin-left: 8px;
}
</style>
