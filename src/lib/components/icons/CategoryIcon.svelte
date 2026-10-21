<!-- A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review. -->
<script>
  import AirportDocks from "./AirportDocks.svelte";
  import Broadband from "./Broadband.svelte";
  import EnergyPower from "./EnergyPower.svelte";
  import EnvironmentalResilience from "./EnvironmentalResilience.svelte";
  import HousingCommunity from "./HousingCommunity.svelte";
  import Rails from "./Rails.svelte";
  import Transit from "./Transit.svelte";
  import RoadsBridges from "./RoadsBridges.svelte";
  import Water from "./Water.svelte";

  /** @type {number} */
  export let size = 120;

  /**
   * Category slug. One of the nine keys of `iconMap` below; typed as `string`
   * because every call site reads it out of generated JSON.
   * @type {string}
   */
  export let category;

  /** @type {Record<string, import("svelte").ComponentType>} */
  const iconMap = {
    ports: AirportDocks,
    broadband: Broadband,
    energy_and_power: EnergyPower,
    environmental_resilience: EnvironmentalResilience,
    housing_and_community_development: HousingCommunity,
    passenger_and_freight_rail: Rails,
    public_transportation: Transit,
    roads_and_bridges: RoadsBridges,
    water_conservation: Water,
  };
</script>

<svelte:component this={iconMap[category]} {size} />
