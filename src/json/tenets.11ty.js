const {
  renderCanonicalJson
} = require("../_lib/machine-readable.js");

module.exports = class TenetsJson {
  data() {
    return {
      permalink: "/json/tenets.json",
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render() {
    return renderCanonicalJson();
  }
};
