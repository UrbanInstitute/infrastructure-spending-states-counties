// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
/**
 * refers to the entire viz component this project fuels
 */
let dataviz_title = "PERC-data-tool";

/**
 * describes a click target in a form GA can store: the element's id, else its class
 * attribute, else its tag name. anything that is not an element becomes null.
 * @param {EventTarget | null | undefined} target
 * @returns {string | null}
 */
function describe_target(target) {
  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return null;
  }
  return target.id || target.getAttribute("class") || target.tagName || null;
}

/**
 * sends event data to GTM and GA. call in event handlers for each event type you wish to track.
 * @param {EventTarget | null} target the div experiencing this click, which is accessed differently depending on the handler's event structure
 * @param {String} data a string in the format "what's_happening--click_specifics" where "what's_happening is the type of click, such as "map_click" or "dropdown_select" and "click_specifics" refers to the selected option, region, or specific function.
 */
export let logClickToGA = (target, data) => {
  if (typeof gtag !== "function") {
    return;
  }
  gtag("event", "dataviz_click", {
    dataviz_title: dataviz_title,
    dataviz_target: describe_target(target),
    dataviz_detail: data,
  });
};

/**
 * sets the unique analytics title for the project. call this onload.
 * @param {String} title the unique analytics slug for this project.
 */
export let setDatavizTitle = (title) => {
  dataviz_title = title;
};
