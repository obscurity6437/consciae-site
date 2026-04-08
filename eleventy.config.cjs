const fs = require("node:fs");
const path = require("node:path");
const site = require("./src/_data/site.js");
const {
  getMachineReadableFiles
} = require("./src/_lib/machine-readable.js");

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function trimSlashes(value = "") {
  return value.replace(/^\/+|\/+$/g, "");
}

function ensureTrailingSlash(value = "/") {
  if (value === "/") {
    return value;
  }

  return `${value.replace(/\/+$/g, "")}/`;
}

function localeSegment(locale) {
  const definition = site.locales[locale];

  if (!definition) {
    throw new Error(`Unknown locale: ${locale}`);
  }

  return definition.pathSegment;
}

function localePath(locale, path = "") {
  const segment = localeSegment(locale);
  const cleanPath = trimSlashes(path);
  const parts = [];

  if (segment) {
    parts.push(segment);
  }

  if (cleanPath) {
    parts.push(cleanPath);
  }

  const joined = parts.length ? `/${parts.join("/")}` : "/";
  return ensureTrailingSlash(joined);
}

function homePermalink(locale) {
  const base = localePath(locale);
  return base === "/" ? "/index.html" : `${base}index.html`;
}

function tenetUrl(tenet, locale) {
  return `${localePath(locale)}#tenet-${tenet.slug}`;
}

function absoluteUrl(pathname) {
  return new URL(pathname, site.url).toString();
}

function localeCode(data) {
  return data.lang || data.locale || data.entry?.lang || site.defaultLanguage;
}

function structuredData(pageType, lang, urlPath, title, description) {
  const locale = site.locales[lang] || site.locales[site.defaultLanguage];
  const pageUrl = absoluteUrl(urlPath);

  const graph = [
    {
      "@type": "Organization",
      "@id": `${site.url}#organization`,
      name: site.name,
      url: site.url,
      foundingDate: site.foundationYear,
      sameAs: site.sameAs
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}#website`,
      url: site.url,
      name: site.name,
      inLanguage: locale.hreflang,
      description: locale.seo.homeDescription
    }
  ];

  graph.push({
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description,
    inLanguage: locale.hreflang,
    isPartOf: {
      "@id": `${site.url}#website`
    }
  });

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": graph
    },
    null,
    2
  );
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.on("eleventy.after", ({ dir }) => {
    const outputDir = dir?.output || "_site";
    const staleDirectories = [
      path.join(outputDir, "tenets"),
      ...site.languages.map((locale) =>
        path.join(outputDir, trimSlashes(localePath(locale, "tenets")))
      )
    ];

    for (const directory of staleDirectories) {
      fs.rmSync(directory, { recursive: true, force: true });
    }

    for (const file of getMachineReadableFiles()) {
      const destination = path.join(outputDir, file.outputPath);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, Buffer.from(file.content, "utf8"));
    }
  });

  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);
  eleventyConfig.addFilter("homePermalink", homePermalink);
  eleventyConfig.addFilter("localeRoot", localePath);
  eleventyConfig.addFilter("tenetUrl", tenetUrl);
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value, null, 2));
  eleventyConfig.addFilter("tenetLabel", (id, locale) => {
    if (locale === "zh-Hant") {
      return `第 ${id} 信條`;
    }

    return `Tenet ${ROMAN_NUMERALS[id - 1] || id}`;
  });

  eleventyConfig.addShortcode(
    "structuredData",
    (pageType, lang, urlPath, title, description) =>
      structuredData(pageType, lang, urlPath, title, description)
  );

  eleventyConfig.addCollection("indexable", (collectionApi) =>
    collectionApi
      .getAll()
      .filter((item) => item.url && !item.data.excludeFromSitemap)
      .sort((left, right) => left.url.localeCompare(right.url))
  );

  eleventyConfig.addGlobalData("build", {
    generatedAt: new Date().toISOString()
  });

  eleventyConfig.addGlobalData("helpers", {
    localeCode,
    localePath,
    absoluteUrl,
    tenetUrl
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};
