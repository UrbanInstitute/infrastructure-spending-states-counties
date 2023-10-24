export const urbanColors = {
  black: "#000000",
  white: "#FFFFFF",
  blue_shade_darkest: "#062635",
  blue_shade_darker: "#0A4C6A",
  blue_shade_dark: "#12719E",
  blue: "#1696D2",
  blue_shade_medium: "#46ABDB",
  blue_shade_light: "#73BFE2",
  blue_shade_lighter: "#A2D4EC",
  blue_shade_lightest: "#CFE8F3",
  gray_shade_darkest: "#353535",
  gray_shade_darker: "#696969",
  gray_shade_dark: "#9D9D9D",
  gray: "#D2D2D2",
  gray_shade_medium: "#DCDBDB",
  gray_shade_light: "#E3E3E3",
  gray_shade_lighter: "#ECECEC",
  gray_shade_lightest: "#F5F5F5",
  yellow_shade_darkest: "#843215",
  yellow_shade_darker: "#CA5800",
  yellow_shade_dark: "#E88E2D",
  yellow: "#FDBF11",
  yellow_shade_medium: "#FCCB41",
  yellow_shade_light: "#FDD870",
  yellow_shade_lighter: "#FCE39E",
  yellow_shade_lightest: "#FFF2CF",
  magenta_shade_darkest: "#351123",
  magenta_shade_darker: "#761548",
  magenta_shade_dark: "#12719E",
  magenta: "#EC00BB",
  magenta_shade_medium: "#E54096",
  magenta_shade_light: "#E46AA7",
  magenta_shade_lighter: "#EB99C2",
  magenta_shade_lightest: "#F5CBDF",
  green_shade_darkest: "#1A2E19",
  green_shade_darker: "#2C5C2D",
  green_shade_dark: "#408941",
  green: "#55B748",
  green_shade_medium: "#78C26D",
  green_shade_light: "#98CF90",
  green_shade_lighter: "#BCDEB4",
  green_shade_lightest: "#DCEDD9",
  red_shade_darkest: "#1A2E19",
  red_shade_darker: "#6E1614",
  red_shade_dark: "#A4201D",
  red: "#DB2B27",
  red_shade_medium: "#E25552",
  red_shade_light: "#E9807D",
  red_shade_lighter: "#F1AAA9",
  red_shade_lightest: "#F8D5D4",
  space_gray_shade_darkest: "#0E0C0D",
  space_gray_shade_darker: "#1A1717",
  space_gray_shade_dark: "#262223",
  space_gray_shade_medium_dark: "#332D2F",
  space_gray: "#5C5859",
  space_gray_shade_light: "#848081",
  space_gray_shade_lighter: "#ADABAC",
  space_gray_shade_lightest: "#D5D5D4",
};

/**
 * Returns a list of up to 8 sequential blues for data visualization based on Urban's style guide
 * @param {number} [numColors = 8] - The number of colors to return up to 8
 * @param {boolean} [reverse = false] - Whether to reverse the order of the colors
 * @returns {string[]} - An array of colors
 */
export function blues(numColors = 8, reverse = false) {
  const colors = [
    urbanColors.blue_shade_darkest,
    urbanColors.blue_shade_darker,
    urbanColors.blue_shade_dark,
    urbanColors.blue,
    urbanColors.blue_shade_medium,
    urbanColors.blue_shade_light,
    urbanColors.blue_shade_lighter,
    urbanColors.blue_shade_lightest,
  ];
  if (numColors > colors.length) {
    numColors = colors.length;
  }
  if (reverse) {
    return colors.reverse();
  }
  return colors.slice(0, numColors);
}

/**
 * Creates a list of up to 10 categorical colors for data visualization based on Urban's style guide
 * @param {number} numColors - The number of colors to return
 * @returns {string[]} - An array of colors
 */
export function getCategoricalColors(numColors) {
  if (numColors > 10) {
    throw new Error("Only 10 colors are available");
  }
  const defaultList = [
    urbanColors.blue,
    urbanColors.black,
    urbanColors.gray,
    urbanColors.yellow,
    urbanColors.magenta,
    urbanColors.green,
    urbanColors.red,
    urbanColors.blue_shade_darker,
    urbanColors.yellow_shade_dark,
    urbanColors.magenta_shade_dark,
  ];
  const smallList = [urbanColors.blue, urbanColors.yellow, urbanColors.black];
  const largeList = [
    urbanColors.blue,
    urbanColors.blue_shade_darker,
    urbanColors.black,
    urbanColors.gray,
    urbanColors.yellow,
    urbanColors.green,
    urbanColors.red,
    urbanColors.magenta,
    urbanColors.yellow_shade_dark,
    urbanColors.magenta_shade_dark,
  ];

  let colors = [];
  for (var i = 0; i < numColors; i++) {
    if (numColors < 4) {
      colors.push(smallList[i]);
    } else if (numColors >= 8) {
      colors.push(largeList[i]);
    } else {
      colors.push(defaultList[i]);
    }
  }
  return colors;
}
