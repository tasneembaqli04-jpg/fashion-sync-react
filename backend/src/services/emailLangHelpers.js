function isEnglish(lang) {
  return lang === "en";
}

function dir(lang) {
  return isEnglish(lang) ? "ltr" : "rtl";
}

function textAlign(lang) {
  return isEnglish(lang) ? "left" : "right";
}

module.exports = {
  isEnglish,
  dir,
  textAlign,
};