const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const site = require("../_data/site.js");
const tenets = require("../_data/tenets.js");
const UTF8_BOM = "\uFEFF";
const sourcePath = path.join(__dirname, "..", "content", "tenets.yaml");

function localeRoot(locale) {
  const segment = site.locales[locale]?.pathSegment;
  return segment ? `/${segment}/` : "/";
}

function localeSlug(locale) {
  return site.locales[locale]?.pathSegment || locale.toLowerCase();
}

function absoluteUrl(pathname) {
  return new URL(pathname, site.url).toString();
}

function yamlBlock(value) {
  return YAML.stringify(value, { lineWidth: 0 }).trimEnd();
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : value;
}

function sourceLastModified() {
  return site.doctrine.lastModified;
}

function tenetJsonPath(tenet) {
  return `/json/tenets/${tenet.slug}.json`;
}

function tenetMarkdownPath(locale, tenet) {
  return `/md/${localeSlug(locale)}/${tenet.slug}.md`;
}

function outputPathFor(pathname) {
  return pathname.replace(/^\//, "");
}

function createMachineReadableFile(pathname, content) {
  return {
    path: pathname,
    outputPath: outputPathFor(pathname),
    absoluteUrl: absoluteUrl(pathname),
    lastModified: sourceLastModified(),
    content
  };
}

function baseMetadata() {
  return {
    site: site.name,
    doctrine: site.doctrine.title,
    schema_version: site.machineReadable.schemaVersion,
    version: tenets.version,
    status: tenets.status,
    last_modified: sourceLastModified()
  };
}

function buildJsonTenetRecord(tenet) {
  return {
    id: tenet.id,
    slug: tenet.slug,
    translation_key: tenet.translationKey,
    concept_key: tenet.concept,
    concept_label: Object.fromEntries(
      site.languages.map((locale) => [
        locale,
        site.locales[locale].concepts[tenet.concept] || tenet.concept
      ])
    ),
    name: Object.fromEntries(
      site.languages.map((locale) => [
        locale,
        cleanText(tenet.name[locale] || tenet.name[site.defaultLanguage])
      ])
    ),
    short: Object.fromEntries(
      site.languages.map((locale) => [
        locale,
        cleanText(tenet.short[locale] || tenet.short[site.defaultLanguage])
      ])
    ),
    gloss: Object.fromEntries(
      site.languages.map((locale) => [
        locale,
        cleanText(tenet.gloss[locale] || tenet.gloss[site.defaultLanguage])
      ])
    ),
    canonical_human_urls: Object.fromEntries(
      site.languages.map((locale) => [
        locale,
        absoluteUrl(`${localeRoot(locale)}#tenet-${tenet.slug}`)
      ])
    ),
    machine_readable_urls: {
      json: absoluteUrl(tenetJsonPath(tenet)),
      markdown: Object.fromEntries(
        site.languages.map((locale) => [
          locale,
          absoluteUrl(tenetMarkdownPath(locale, tenet))
        ])
      )
    }
  };
}

function renderLlmsTxt() {
  return [
    `# ${site.name}`,
    "",
    `> ${site.doctrine.description}`,
    "",
    "This file points language models and other automated readers to the preferred machine-readable resources for this site.",
    `Prefer the JSON corpus at ${absoluteUrl(site.machineReadable.jsonPath)} for structured retrieval.`,
    "Prefer explicit language URLs over `/` when quoting or citing page text.",
    "",
    "## Preferred Sources",
    "",
    `- [Complete doctrine dataset (JSON)](${absoluteUrl(site.machineReadable.jsonPath)}): canonical structured representation of all tenets, multilingual strings, and per-tenet machine URLs.`,
    `- [Canonical doctrine source (YAML)](${absoluteUrl(site.machineReadable.yamlPath)}): published YAML source for the doctrine.`,
    `- [Machine-readable index (Markdown)](${absoluteUrl(site.machineReadable.markdownIndexPath)}): concise index of all machine-readable editions.`,
    ...site.languages.map((locale) => {
      const localeDefinition = site.locales[locale];
      return `- [${localeDefinition.nativeLabel} doctrine (Markdown)](${absoluteUrl(site.machineReadable.markdownPaths[locale])}): full ${localeDefinition.label} edition in machine-readable markdown.`;
    }),
    "",
    "## Human Editions",
    "",
    `- [Landing page](${absoluteUrl(site.xDefaultHomePath)}): stable language chooser.`,
    ...site.languages.map((locale) => {
      const localeDefinition = site.locales[locale];
      return `- [${localeDefinition.nativeLabel}](${absoluteUrl(localeRoot(locale))}): canonical human-readable ${localeDefinition.label} edition.`;
    }),
    "",
    "## Tenets",
    "",
    ...tenets.list.map((tenet) => [
      `- [${tenet.name.en}](${absoluteUrl(`${localeRoot(site.defaultLanguage)}#tenet-${tenet.slug}`)}): JSON [data](${absoluteUrl(tenetJsonPath(tenet))}), English [markdown](${absoluteUrl(tenetMarkdownPath("en", tenet))}), Traditional Chinese [markdown](${absoluteUrl(tenetMarkdownPath("zh-Hant", tenet))}).`
    ]).flat(),
    "",
    "## Notes",
    "",
    `- Doctrine title: ${site.doctrine.title}`,
    `- Doctrine version: ${tenets.version}`,
    `- Status: ${tenets.status}`,
    `- Last modified: ${sourceLastModified()}`,
    `- Data sitemap: ${absoluteUrl(site.machineReadable.dataSitemapPath)}`,
    ""
  ].join("\n");
}

function renderMarkdownIndex() {
  const metadata = {
    ...baseMetadata(),
    purpose: "machine-readable doctrine index",
    llms_path: site.machineReadable.llmsPath,
    data_sitemap_path: site.machineReadable.dataSitemapPath,
    markdown_paths: site.machineReadable.markdownPaths,
    yaml_path: site.machineReadable.yamlPath,
    json_path: site.machineReadable.jsonPath
  };

  return UTF8_BOM + [
    "---",
    yamlBlock(metadata),
    "---",
    "",
    `# ${site.name} machine-readable index`,
    "",
    "## Discovery",
    "",
    `- llms.txt: ${absoluteUrl(site.machineReadable.llmsPath)}`,
    `- data sitemap: ${absoluteUrl(site.machineReadable.dataSitemapPath)}`,
    "",
    "## Markdown editions",
    "",
    ...site.languages.map(
      (locale) =>
        `- ${locale}: ${absoluteUrl(site.machineReadable.markdownPaths[locale])}`
    ),
    "",
    "## YAML source",
    "",
    `- canonical: ${absoluteUrl(site.machineReadable.yamlPath)}`,
    "",
    "## JSON source",
    "",
    `- canonical: ${absoluteUrl(site.machineReadable.jsonPath)}`,
    "",
    "## Per-tenet JSON",
    "",
    ...tenets.list.map(
      (tenet) => `- ${tenet.slug}: ${absoluteUrl(tenetJsonPath(tenet))}`
    ),
    ""
  ].join("\n");
}

function renderDoctrineMarkdown(locale) {
  const localeDefinition = site.locales[locale];
  const metadata = {
    ...baseMetadata(),
    language: locale,
    llms_url: absoluteUrl(site.machineReadable.llmsPath),
    canonical_human_url: absoluteUrl(localeRoot(locale)),
    canonical_markdown_url: absoluteUrl(
      site.machineReadable.markdownPaths[locale]
    ),
    canonical_yaml_url: absoluteUrl(site.machineReadable.yamlPath),
    canonical_json_url: absoluteUrl(site.machineReadable.jsonPath),
    source_file: "src/content/tenets.yaml"
  };

  const sections = [
    "---",
    yamlBlock(metadata),
    "---",
    "",
    `# ${site.name}`,
    "",
    `Language: ${locale}`,
    "",
    ...tenets.list.flatMap((tenet) => {
      const tenetRecord = {
        id: tenet.id,
        slug: tenet.slug,
        translation_key: tenet.translationKey,
        name: tenet.name[locale] || tenet.name[site.defaultLanguage],
        name_en: tenet.name.en,
        concept_key: tenet.concept,
        concept_label:
          localeDefinition.concepts[tenet.concept] || tenet.concept,
        short: tenet.short[locale] || tenet.short[site.defaultLanguage],
        gloss: tenet.gloss[locale] || tenet.gloss[site.defaultLanguage],
        canonical_human_url: absoluteUrl(`${localeRoot(locale)}#tenet-${tenet.slug}`),
        canonical_markdown_url: absoluteUrl(tenetMarkdownPath(locale, tenet)),
        canonical_json_url: absoluteUrl(tenetJsonPath(tenet))
      };

      return [
        `## Tenet ${tenet.id}`,
        "",
        "```yaml",
        yamlBlock(tenetRecord),
        "```",
        ""
      ];
    })
  ];

  return UTF8_BOM + sections.join("\n");
}

function renderTenetMarkdown(locale, tenet) {
  const localeDefinition = site.locales[locale];
  const metadata = {
    ...baseMetadata(),
    language: locale,
    tenet_id: tenet.id,
    slug: tenet.slug,
    translation_key: tenet.translationKey,
    concept_key: tenet.concept,
    concept_label: localeDefinition.concepts[tenet.concept] || tenet.concept,
    canonical_human_url: absoluteUrl(`${localeRoot(locale)}#tenet-${tenet.slug}`),
    canonical_markdown_url: absoluteUrl(tenetMarkdownPath(locale, tenet)),
    canonical_json_url: absoluteUrl(tenetJsonPath(tenet))
  };

  const localizedName = tenet.name[locale] || tenet.name[site.defaultLanguage];
  const localizedShort = tenet.short[locale] || tenet.short[site.defaultLanguage];
  const localizedGloss = tenet.gloss[locale] || tenet.gloss[site.defaultLanguage];

  return UTF8_BOM + [
    "---",
    yamlBlock(metadata),
    "---",
    "",
    `# ${localizedName}`,
    "",
    localizedShort,
    "",
    "## Gloss",
    "",
    localizedGloss,
    "",
    "## Links",
    "",
    `- Human page: ${absoluteUrl(`${localeRoot(locale)}#tenet-${tenet.slug}`)}`,
    `- JSON: ${absoluteUrl(tenetJsonPath(tenet))}`,
    `- Full ${localeDefinition.label} doctrine markdown: ${absoluteUrl(site.machineReadable.markdownPaths[locale])}`,
    ""
  ].join("\n");
}

function readCanonicalYaml() {
  return UTF8_BOM + fs.readFileSync(sourcePath, "utf8");
}

function renderCanonicalJson() {
  const payload = {
    site: site.name,
    doctrine: {
      title: site.doctrine.title,
      description: site.doctrine.description
    },
    schema_version: site.machineReadable.schemaVersion,
    version: tenets.version,
    status: tenets.status,
    last_modified: sourceLastModified(),
    default_language: site.defaultLanguage,
    languages: site.languages,
    canonical_human_urls: {
      "x-default": absoluteUrl(site.xDefaultHomePath),
      ...Object.fromEntries(
        site.languages.map((locale) => [locale, absoluteUrl(localeRoot(locale))])
      )
    },
    machine_readable_urls: {
      llms: absoluteUrl(site.machineReadable.llmsPath),
      data_sitemap: absoluteUrl(site.machineReadable.dataSitemapPath),
      markdown_index: absoluteUrl(site.machineReadable.markdownIndexPath),
      markdown: Object.fromEntries(
        site.languages.map((locale) => [
          locale,
          absoluteUrl(site.machineReadable.markdownPaths[locale])
        ])
      ),
      yaml: absoluteUrl(site.machineReadable.yamlPath),
      json: absoluteUrl(site.machineReadable.jsonPath)
    },
    tenets: tenets.list.map(buildJsonTenetRecord)
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function renderTenetJson(tenet) {
  const payload = {
    site: site.name,
    doctrine: {
      title: site.doctrine.title,
      description: site.doctrine.description
    },
    schema_version: site.machineReadable.schemaVersion,
    version: tenets.version,
    status: tenets.status,
    last_modified: sourceLastModified(),
    default_language: site.defaultLanguage,
    languages: site.languages,
    tenet: buildJsonTenetRecord(tenet)
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function getMachineReadableFiles() {
  return [
    createMachineReadableFile(site.machineReadable.llmsPath, renderLlmsTxt()),
    createMachineReadableFile(
      site.machineReadable.markdownIndexPath,
      renderMarkdownIndex()
    ),
    ...site.languages.map((locale) =>
      createMachineReadableFile(
        site.machineReadable.markdownPaths[locale],
        renderDoctrineMarkdown(locale)
      )
    ),
    ...tenets.list.map((tenet) =>
      createMachineReadableFile(tenetJsonPath(tenet), renderTenetJson(tenet))
    ),
    ...site.languages.flatMap((locale) =>
      tenets.list.map((tenet) =>
        createMachineReadableFile(
          tenetMarkdownPath(locale, tenet),
          renderTenetMarkdown(locale, tenet)
        )
      )
    ),
    createMachineReadableFile(site.machineReadable.yamlPath, readCanonicalYaml()),
    createMachineReadableFile(site.machineReadable.jsonPath, renderCanonicalJson())
  ];
}

module.exports = {
  getMachineReadableFiles,
  renderLlmsTxt,
  renderMarkdownIndex,
  renderDoctrineMarkdown,
  renderTenetMarkdown,
  readCanonicalYaml,
  renderCanonicalJson,
  renderTenetJson,
  sourceLastModified,
  tenetJsonPath,
  tenetMarkdownPath
};
