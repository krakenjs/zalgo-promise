/* @flow */

module.exports = {
  extends:
    "./node_modules/@krakenjs/grumbler-scripts/config/.eslintrc-browser.js",

  rules: {
    "promise/no-native": "off",
    "no-restricted-globals": "off",
  },
};
