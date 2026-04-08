const {
  renderDoctrineMarkdown
} = require("../_lib/machine-readable.js");

module.exports = class EnglishDoctrineMarkdown {
  data() {
    return {
      permalink: "/md/en.md",
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render() {
    return renderDoctrineMarkdown("en");
  }
};
