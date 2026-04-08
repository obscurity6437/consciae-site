const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const site = require("../_data/site.js");
const tenets = require("../_data/tenets.js");
const UTF8_BOM = "\uFEFF";

function localeRoot(locale) {
  const segment = site.locales[locale]?.pathSegment;
  return segment ? `/${segment}/` : "/";
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

function renderMarkdownIndex() {
  const metadata = {
    site: site.name,
    purpose: "machine-readable doctrine index",
    markdown_paths: site.machineReadable.markdownPaths,
    yaml_path: site.machineReadable.yamlPath,
    json_path: site.machineReadable.jsonPath,
    version: tenets.version,
    status: tenets.status
  };

  return UTF8_BOM + [
    "---",
    yamlBlock(metadata),
    "---",
    "",
    `# ${site.name} machine-readable index`,
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
    ""
  ].join("\n");
}

function renderDoctrineMarkdown(locale) {
  const localeDefinition = site.locales[locale];
  const metadata = {
    site: site.name,
    language: locale,
    canonical_human_url: absoluteUrl(localeRoot(locale)),
    canonical_markdown_url: absoluteUrl(
      site.machineReadable.markdownPaths[locale]
    ),
    canonical_yaml_url: absoluteUrl(site.machineReadable.yamlPath),
    canonical_json_url: absoluteUrl(site.machineReadable.jsonPath),
    version: tenets.version,
    status: tenets.status,
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
        canonical_human_url: absoluteUrl(`${localeRoot(locale)}#tenet-${tenet.slug}`)
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

function readCanonicalYaml() {
  return UTF8_BOM + fs.readFileSync(
    path.join(__dirname, "..", "content", "tenets.yaml"),
    "utf8"
  );
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
    )
  };
}

function renderCanonicalJson() {
  const payload = {
    site: site.name,
    version: tenets.version,
    status: tenets.status,
    default_language: site.defaultLanguage,
    languages: site.languages,
    canonical_human_urls: {
      "x-default": absoluteUrl(site.xDefaultHomePath),
      ...Object.fromEntries(
        site.languages.map((locale) => [locale, absoluteUrl(localeRoot(locale))])
      )
    },
    machine_readable_urls: {
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

function getMachineReadableFiles() {
  return [
    {
      outputPath: site.machineReadable.markdownIndexPath.replace(/^\//, ""),
      content: renderMarkdownIndex()
    },
    ...site.languages.map((locale) => ({
      outputPath: site.machineReadable.markdownPaths[locale].replace(/^\//, ""),
      content: renderDoctrineMarkdown(locale)
    })),
    {
      outputPath: site.machineReadable.yamlPath.replace(/^\//, ""),
      content: readCanonicalYaml()
    },
    {
      outputPath: site.machineReadable.jsonPath.replace(/^\//, ""),
      content: renderCanonicalJson()
    }
  ];
}

module.exports = {
  getMachineReadableFiles,
  renderMarkdownIndex,
  renderDoctrineMarkdown,
  readCanonicalYaml,
  renderCanonicalJson
};
