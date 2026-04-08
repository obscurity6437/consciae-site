const {
  renderDoctrineMarkdown
} = require("../_lib/machine-readable.js");

module.exports = class ChineseDoctrineMarkdown {
  data() {
    return {
      permalink: "/md/zh-hant.md",
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render() {
    return renderDoctrineMarkdown("zh-Hant");
  }
};
