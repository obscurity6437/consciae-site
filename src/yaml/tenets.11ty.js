const {
  readCanonicalYaml
} = require("../_lib/machine-readable.js");

module.exports = class TenetsYaml {
  data() {
    return {
      permalink: "/yaml/tenets.yaml",
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render() {
    return readCanonicalYaml();
  }
};
