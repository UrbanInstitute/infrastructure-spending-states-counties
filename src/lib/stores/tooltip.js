// A generative AI model wrote or edited portions of this file with the supervision of a human developer and careful human review.
import { writable } from "svelte/store";

/**
 * @typedef {{xPosition: number, yPosition: number, content: Array<{label?: string, text: any}>}} TooltipState
 */

/** @type {import('svelte/store').Writable<TooltipState | null>} */
export const current_tooltip = writable(null);
