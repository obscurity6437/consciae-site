const site = require("./_data/site.js");
const { getMachineReadableFiles } = require("./_lib/machine-readable.js");

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = class DataSitemap {
  data() {
    return {
      permalink: site.machineReadable.dataSitemapPath,
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render() {
    const urls = getMachineReadableFiles()
      .sort((left, right) => left.path.localeCompare(right.path))
      .map(
        (file) => `  <url>
    <loc>${xmlEscape(file.absoluteUrl)}</loc>
    <lastmod>${xmlEscape(file.lastModified)}</lastmod>
  </url>`
      );

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  }
};
