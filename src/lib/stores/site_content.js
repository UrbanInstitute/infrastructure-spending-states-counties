import { readable } from "svelte/store";

export const content = readable({
  headline: "How Equitable is the Federal Investment in Infrastructure?",
  subhead: "If we have a subtitle, we’ll Insert here, in this area",
  date: "Month XX, 2023",
  body: [
    {
      value:
        "Culpa tempor culpa incididunt tempor voluptate dolor ex est. Incididunt amet do veniam pariatur aliquip commodo pariatur excepteur Lorem excepteur sit fugiat. Id sunt nostrud veniam ex exercitation incididunt sint. Culpa ad voluptate velit qui magna proident sint.",
    },
    {
      value:
        "Culpa duis velit fugiat nulla consectetur aute excepteur voluptate excepteur. Eiusmod ea cillum culpa ut enim mollit deserunt cupidatat excepteur tempor labore. Incididunt eu minim officia ullamco nisi aliqua voluptate. Cillum laborum nulla qui ea do do consequat. Et officia duis eiusmod id mollit laborum excepteur consequat ea ipsum. Incididunt laboris exercitation occaecat cupidatat eiusmod voluptate nulla consequat voluptate cupidatat ut officia elit. Nisi reprehenderit sunt labore irure incididunt veniam laboris esse reprehenderit aliqua id in veniam labore anim.",
    },
  ],
  about: [
    {
      value:
        "Link to the user guide. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  ],
  search: {
    subhead: "Not sure where to start? ",
    explainer_text:
      "Try searching for a state or county (Alabama or Ramsey County, for example) to see if it receives funding proportional to its needs. Or try searching for an infrastructure category (maybe Ports and Waterways) or a specific program (such as the RAISE program) to see if it distributes funds in a way that advances racial and economic equity.",
  },
});
