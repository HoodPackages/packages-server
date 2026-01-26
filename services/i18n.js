const translations = {
  uk: require("../locales/uk.json"),
  en: require("../locales/en.json"),
  de: require("../locales/de.json"),
  it: require("../locales/it.json"),
  fr: require("../locales/fr.json")
};

module.exports = function getI18n(lang = "uk") {
  return translations[lang] || translations.uk;
};
