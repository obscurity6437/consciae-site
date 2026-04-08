const {
  renderMarkdownIndex
} = require("../_lib/machine-readable.js");

module.exports = class MarkdownIndex {
  data() {
    return {
      permalink: "/md/index.md",
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render() {
    return renderMarkdownIndex();
  }
};
