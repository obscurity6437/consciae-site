const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const sourcePath = path.join(__dirname, "..", "content", "tenets.yaml");
const source = fs.readFileSync(sourcePath, "utf8");
const parsed = YAML.parse(source);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/^the\s+/i, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const list = parsed.tenets.map((tenet) => ({
  ...tenet,
  slug: slugify(tenet.name.en),
  translationKey: `tenet-${tenet.id}`
}));

const byId = Object.fromEntries(list.map((tenet) => [tenet.id, tenet]));

module.exports = {
  ...parsed,
  list,
  byId
};
