<script>
  import search_data from "$data/search.json";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import program_data from "$data/programs_simple.json";
  import Select from "$components/Select.svelte";
  import Button from "$components/common/Button.svelte";
  import { slugify_program, get_program_name } from "$lib/utils";
  import { logClickToGA } from "$lib/analytics";

  const clean_program_data = program_data.map((program) => ({
    ...program,
    name: get_program_name(program.short_name),
  }));
  const category_options = Array.from(
    new Set(clean_program_data.flatMap(({ categories }) => categories))
  )
    .map((category) => ({
      value: category,
      label: format_category_name(category),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // variables for program search
  let program_search_category_filter;
  let program_search_department_filter;
  let program_search_selected_program;

  // variables for location search
  let location_search_selected_state;
  let location_search_selected_county;
  let location_search_category_filter;
  let location_search_department_filter;
  let location_search_selected_program;

  const department_options = [
    {
      value: "IIJA",
      label: "IIJA",
    },
    {
      value: "HUD",
      label: "HUD",
    },
  ];

  const state_options = search_data
    .filter(({ category }) => category === "state")
    .map(({ name, route_param }) => ({ value: route_param, label: name }));
  $: location_search_county_options = search_data
    .filter(
      ({ category, route_param }) =>
        category === "county" &&
        (location_search_selected_state
          ? location_search_selected_state === route_param.substr(0, 2)
          : true)
    )
    .map(({ name, route_param }) => ({ value: route_param, label: name }));

  $: program_search_options = clean_program_data
    .filter(({ categories }) => {
      if (program_search_category_filter) {
        return categories.includes(program_search_category_filter);
      }
      return true;
    })
    .filter(({ type }) => {
      if (program_search_department_filter) {
        return type === program_search_department_filter;
      }
      return true;
    })
    .map(({ name, short_name }) => ({ label: name, value: short_name }));

  $: location_search_program_search_options = clean_program_data
    .filter(({ categories }) => {
      if (location_search_category_filter) {
        return categories.includes(location_search_category_filter);
      }
      return true;
    })
    .filter(({ type }) => {
      if (location_search_department_filter) {
        return type === location_search_department_filter;
      }
      return true;
    })
    .map(({ name, short_name }) => ({ label: name, value: short_name }));

  function go_to_program(program) {
    goto(`${base}/program/${slugify_program(program)}/`);
  }

  function go_to_location() {
    if (location_search_selected_county) {
      goto(
        `${base}/county/${location_search_selected_county}/${
          location_search_selected_program
            ? "?program=" + location_search_selected_program
            : ""
        }`
      );
    } else {
      goto(
        `${base}/state/${location_search_selected_state}/${
          location_search_selected_program
            ? "?program=" + location_search_selected_program
            : ""
        }`
      );
    }
  }

  function format_category_name(category) {
    return (
      category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ")
    );
  }
</script>

<div class="advanced-search layout-container--article-width">
  <div class="advanced-search--program-search">
    <h2 class="advanced-search--subhead">Search for a program</h2>
    <p class="advanced-search--text">
      Select a filter to search by a funding category or a specific program.
    </p>
    <Select
      items={category_options}
      bind:value={program_search_category_filter}
      placeholder="Select a category"
      clearable
      on:change={(e) => {
        logClickToGA(
          e.target,
          "advanced-search-program-category-select--" + program_search_category_filter
        );
      }}
    />
    <div class="spacing" />
    <Select
      items={department_options}
      bind:value={program_search_department_filter}
      placeholder="Select a department"
      clearable
      on:change={(e) => {
        logClickToGA(
          e.target,
          "advanced-search-program-department-select--" + program_search_department_filter
        );
      }}
    />
    <div class="spacing" />
    <Select
      items={program_search_options}
      bind:value={program_search_selected_program}
      placeholder="Select a program"
      clearable
      on:change={(e) => {
        logClickToGA(
          e.target,
          "advanced-search-program-program-select--" + program_search_selected_program
        );
      }}
    />
    <div class="spacing" />
    <Button
      style="blue"
      disabled={!program_search_selected_program}
      on:click={(e) => {
        go_to_program(program_search_selected_program)
        logClickToGA(e.target, "advanced-search--program-search");
      }}
      >Search</Button
    >
  </div>
  <div class="advanced-search--place-search">
    <h2 class="advanced-search--subhead">Search for a state or county</h2>
    <p class="advanced-search--text">
      Select a filter to search by state or county. Use the category or program
      dropdowns to narrow your search within that geography.
    </p>
    <div class="advanced-search--column-group">
      <div class="advanced-search--filter-group">
        <Select
          items={state_options}
          bind:value={location_search_selected_state}
          placeholder="Select a state"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-state-select--" + location_search_selected_state
            );
          }}
          clearable
        />
        <div class="spacing" />
        <Select
          items={location_search_county_options}
          bind:value={location_search_selected_county}
          placeholder="Select a county"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-county-select--" + location_search_selected_county
            );
          }}
          clearable
        />
        <div class="spacing" />
      </div>
      <div class="advanced-search--filter-group">
        <Select
          items={category_options}
          bind:value={location_search_category_filter}
          placeholder="Select a category"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-category-select--" + location_search_category_filter
            );
          }}
          clearable
        />
        <div class="spacing" />
        <Select
          items={department_options}
          bind:value={location_search_department_filter}
          placeholder="Select a department"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-department-select--" + location_search_department_filter
            );
          }}
          clearable
        />
        <div class="spacing" />
        <Select
          items={location_search_program_search_options}
          bind:value={location_search_selected_program}
          placeholder="Select a program"
          on:change={(e) => {
            logClickToGA(
              e.target,
              "advanced-search-location-program-select--" + location_search_selected_program
            );
          }}
          clearable
        />
        <div class="spacing" />
        <Button
          style="blue"
          disabled={!location_search_selected_county &&
            !location_search_selected_state}
          on:click={(e) => {
            logClickToGA(e.target, "advanced-search--location-search");
            go_to_location()
          }}
          >Search</Button
        >
      </div>
    </div>
  </div>
</div>

<style>
  .advanced-search {
    padding: var(--spacing-12) var(--spacing-4);
  }
  .advanced-search--subhead {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-2xl);
    text-transform: uppercase;
    margin-bottom: var(--spacing-4);
  }
  .advanced-search--text {
    margin-bottom: var(--spacing-4);
  }
  @media (min-width: 768px) {
    .advanced-search {
      display: flex;
      padding: var(--spacing-12);
    }
    .advanced-search--program-search {
      width: 33.33%;
      border-right: solid 1px var(--color-gray-shade-light);
      padding-right: var(--spacing-20);
    }
    .advanced-search--place-search {
      width: 66.66%;
      flex-grow: 1;
      padding-left: var(--spacing-20);
    }
    .advanced-search--column-group {
      display: flex;
      column-gap: var(--spacing-12);
    }
    .advanced-search--filter-group {
      width: 50%;
    }
  }
</style>
