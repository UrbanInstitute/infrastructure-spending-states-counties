<script>
import IconCheck from "./IconCheck.svelte";
/** @type {"formula" | "competitive" } */
export let mechanism;

$: isFormula = mechanism.toLowerCase() === "formula";
$: isCompetitive = mechanism.toLowerCase() === "competitive";
</script>
<div class="funding-mechanism--wrap">
  <div class="funding-mechanism--item" class:active={isFormula}>
    <div class="funding-mechanism--circle">
    {#if isFormula}
      <div class="icon-check" >
        <IconCheck fill="#FFFFFF" />
      </div>
    {/if}
    </div>
    <p class="funding-mechanism--text">Formula</p>
  </div>
  <div class="funding-mechanism--item" class:active={isCompetitive}>
    <div class="funding-mechanism--circle">
    {#if isCompetitive}
      <div class="icon-check" >
        <IconCheck fill="#FFFFFF" />
      </div>
    {/if}
    </div>
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
.funding-mechanism--circle {
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-check {
  width: 60%;
}
</style>
