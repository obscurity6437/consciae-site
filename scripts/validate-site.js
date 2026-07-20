const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "_site");
const site = require(path.join(ROOT, "src", "_data", "site.js"));
const tenets = require(path.join(ROOT, "src", "_data", "tenets.js"));
const {
  getMachineReadableFiles,
  sourceLastModified
} = require(path.join(ROOT, "src", "_lib", "machine-readable.js"));

const failures = [];
let assertions = 0;

function check(condition, message) {
  assertions += 1;

  if (!condition) {
    failures.push(message);
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function stripBom(value) {
  return value.replace(/^\uFEFF/, "");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function outputPathForUrl(pathname) {
  let outputPath = path.join(OUTPUT, decodeURIComponent(pathname).replace(/^\/+/, ""));

  if (pathname.endsWith("/")) {
    outputPath = path.join(outputPath, "index.html");
  }

  return outputPath;
}

function validateDoctrineSource() {
  const explicitDate = sourceLastModified();
  const parsedDate = new Date(explicitDate);

  check(
    !Number.isNaN(parsedDate.valueOf()) && parsedDate.toISOString() === explicitDate,
    `site.doctrine.lastModified must be a canonical ISO timestamp; received ${explicitDate}`
  );
  check(tenets.version === "0.3", `expected doctrine version 0.3; received ${tenets.version}`);
  check(tenets.status === "draft", `expected doctrine status draft; received ${tenets.status}`);
  check(tenets.list.length === 8, `expected 8 tenets; received ${tenets.list.length}`);

  const ids = new Set();
  const slugs = new Set();

  for (const tenet of tenets.list) {
    check(!ids.has(tenet.id), `duplicate tenet id ${tenet.id}`);
    check(!slugs.has(tenet.slug), `duplicate tenet slug ${tenet.slug}`);
    ids.add(tenet.id);
    slugs.add(tenet.slug);

    for (const locale of site.languages) {
      for (const field of ["name", "short", "gloss"]) {
        check(
          typeof tenet[field]?.[locale] === "string" && tenet[field][locale].trim().length > 0,
          `tenet ${tenet.id} is missing ${field}.${locale}`
        );
      }
    }
  }
}

function validateMachineReadableFiles() {
  const expectedFiles = getMachineReadableFiles();

  for (const file of expectedFiles) {
    const destination = path.join(OUTPUT, file.outputPath);
    check(fs.existsSync(destination), `missing generated file ${file.path}`);

    if (fs.existsSync(destination)) {
      check(read(destination) === file.content, `generated file differs from source renderer: ${file.path}`);
    }
  }

  const canonicalJson = JSON.parse(read(path.join(OUTPUT, "json", "tenets.json")));
  const canonicalYaml = YAML.parse(stripBom(read(path.join(OUTPUT, "yaml", "tenets.yaml"))));

  check(canonicalJson.version === tenets.version, "JSON doctrine version does not match source");
  check(canonicalJson.status === tenets.status, "JSON doctrine status does not match source");
  check(canonicalJson.last_modified === sourceLastModified(), "JSON last_modified is not explicit doctrine metadata");
  check(canonicalJson.tenets.length === tenets.list.length, "JSON tenet count does not match source");
  check(canonicalYaml.version === tenets.version, "published YAML version does not match source");
  check(canonicalYaml.tenets.length === tenets.list.length, "published YAML tenet count does not match source");

  const dataSitemap = read(path.join(OUTPUT, "sitemap-data.xml"));

  for (const file of expectedFiles) {
    check(dataSitemap.includes(`<loc>${file.absoluteUrl}</loc>`), `data sitemap omits ${file.absoluteUrl}`);
    check(
      dataSitemap.includes(`<lastmod>${sourceLastModified()}</lastmod>`),
      "data sitemap does not use explicit doctrine modification metadata"
    );
  }
}

function validateHtml() {
  const htmlFiles = walk(OUTPUT).filter((filePath) => filePath.endsWith(".html"));

  for (const filePath of htmlFiles) {
    const html = read(filePath);
    const relativePath = `/${path.relative(OUTPUT, filePath).split(path.sep).join("/")}`;
    const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;

    check(h1Count === 1, `${relativePath} must contain exactly one h1; found ${h1Count}`);

    for (const match of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
      try {
        JSON.parse(match[1]);
        check(true, `${relativePath} contains valid JSON-LD`);
      } catch (error) {
        check(false, `${relativePath} contains invalid JSON-LD: ${error.message}`);
      }
    }

    for (const match of html.matchAll(/<(?:a|img|link|script)[^>]+(?:href|src)="([^"]+)"/g)) {
      const rawUrl = match[1];
      const basePath = relativePath.endsWith("index.html")
        ? relativePath.slice(0, -"index.html".length)
        : relativePath;
      const url = new URL(rawUrl, `https://consciae.org${basePath}`);

      if (url.origin !== "https://consciae.org") {
        continue;
      }

      const target = outputPathForUrl(url.pathname);
      check(fs.existsSync(target), `${relativePath} links to missing local target ${rawUrl}`);

      if (url.hash && fs.existsSync(target) && target.endsWith(".html")) {
        const targetHtml = read(target);
        check(
          targetHtml.includes(`id="${url.hash.slice(1)}"`),
          `${relativePath} links to missing fragment ${rawUrl}`
        );
      }
    }
  }

  for (const locale of site.languages) {
    const segment = site.locales[locale].pathSegment;
    const home = read(path.join(OUTPUT, segment, "index.html"));
    const tenetCount = (home.match(/class="doctrine-item"/g) || []).length;

    check(tenetCount === tenets.list.length, `${locale} home renders ${tenetCount} of ${tenets.list.length} tenets`);
    check(home.includes(`id="about-heading"`), `${locale} home omits its About section`);
    check(home.includes(`id="forthcoming-heading"`), `${locale} home omits its Forthcoming section`);
  }

  const chineseHome = read(path.join(OUTPUT, site.locales["zh-Hant"].pathSegment, "index.html"));
  check(chineseHome.includes(`id="translation-status"`), "Traditional Chinese home omits translation status");
}

function validateNoLocalFileUrls() {
  for (const filePath of walk(OUTPUT)) {
    const contents = read(filePath);
    check(!contents.includes("file:///"), `${path.relative(OUTPUT, filePath)} contains a local file URL`);
  }
}

function main() {
  check(fs.existsSync(OUTPUT), "build output is missing; run npm run build first");

  if (!fs.existsSync(OUTPUT)) {
    return 1;
  }

  validateDoctrineSource();
  validateMachineReadableFiles();
  validateHtml();
  validateNoLocalFileUrls();

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL: ${failure}`);
    }

    console.error(`\n${failures.length} of ${assertions} validation assertions failed.`);
    return 1;
  }

  console.log(`Site validation passed (${assertions} assertions).`);
  return 0;
}

process.exitCode = main();
