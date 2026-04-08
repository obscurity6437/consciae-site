const site = require("./_data/site.js");

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function localeFromItem(item) {
  return item.data.lang || item.data.locale || item.data.entry?.lang || site.defaultLanguage;
}

function localeRoot(localeCode) {
  const segment = site.locales[localeCode]?.pathSegment;
  return segment ? `/${segment}/` : "/";
}

function alternateLinksForGroup(group) {
  const sample = group[0];

  if (sample?.data?.pageType === "landing" || sample?.data?.pageType === "home") {
    return site.languages.map((localeCode) => ({
      hreflang: site.locales[localeCode].hreflang,
      href: new URL(localeRoot(localeCode), site.url).toString()
    }));
  }

  return group
    .map((alternate) => {
      const alternateLang = localeFromItem(alternate);
      const hreflang = site.locales[alternateLang]?.hreflang;

      if (!hreflang) {
        return null;
      }

      return {
        hreflang,
        href: new URL(alternate.url, site.url).toString()
      };
    })
    .filter(Boolean);
}

function xDefaultForGroup(group) {
  const sample = group[0];

  if (sample?.data?.pageType === "landing" || sample?.data?.pageType === "home") {
    return new URL(site.xDefaultHomePath, site.url).toString();
  }

  const xDefault = group.find(
    (alternate) => localeFromItem(alternate) === site.defaultLanguage
  );

  return new URL(xDefault ? xDefault.url : "/", site.url).toString();
}

module.exports = class Sitemap {
  data() {
    return {
      permalink: "/sitemap.xml",
      excludeFromSitemap: true,
      eleventyExcludeFromCollections: true
    };
  }

  render(data) {
    const pages = data.collections.indexable;
    const groups = new Map();

    for (const page of pages) {
      const key = page.data.translationKey || page.url;
      const group = groups.get(key) || [];
      group.push(page);
      groups.set(key, group);
    }

    const urls = [];

    for (const group of groups.values()) {
      for (const page of group) {
        const lang = localeFromItem(page);
        const loc = new URL(page.url, site.url).toString();
        const alternates = alternateLinksForGroup(group)
          .map(
            (alternate) =>
              `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.hreflang)}" href="${xmlEscape(alternate.href)}" />`
          )
          .join("\n");

        urls.push(`  <url>
    <loc>${xmlEscape(loc)}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(xDefaultForGroup(group))}" />
    <changefreq>${lang === site.defaultLanguage ? "weekly" : "monthly"}</changefreq>
  </url>`);
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
  }
};
