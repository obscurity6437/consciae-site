# consciae-site

Static website for [consciae.org](https://consciae.org): the Consciae doctrine
(eight tenets, English + Traditional Chinese), built with
[Eleventy v3](https://www.11ty.dev/) and deployed to GitHub Pages by GitHub
Actions. The site is intentionally static, fast, and text-forward, and
publishes a machine-readable corpus (`llms.txt`, JSON/YAML/Markdown) alongside
the human pages.

## Prerequisites

- Node.js ≥ 24 (`.nvmrc` pins 24; CI runs 24)
- npm

## Quickstart

```sh
npm ci         # install exact locked dependencies (lifecycle scripts skipped)
npm run dev    # local dev server with incremental rebuilds
npm run check  # clean + build + validate — the gate CI runs before deploy
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Eleventy dev server (`--serve --incremental`) |
| `npm run build` | Build `_site/` |
| `npm test` | Run `scripts/validate-site.js` against `_site/` |
| `npm run check` | `clean && build && test` — the deploy gate |
| `npm run audit` | `npm audit --audit-level=high` (weekly, non-blocking, in CI) |
| `npm run clean` | Remove `_site/` |

## Editing the doctrine

`src/content/tenets.yaml` is the single source of truth for the tenets. A
release ratchet protects it: the validator compares the `contentSha256` in
`src/_data/site.js` against the actual file bytes and fails the build on any
unacknowledged change.

To change doctrine content:

1. Edit `src/content/tenets.yaml`.
2. Update **both** fields under `doctrine` in `src/_data/site.js`:
   - `lastModified` — a canonical ISO timestamp for the revision
     (for example `new Date().toISOString()` from the current UTC time).
   - `contentSha256` — the output of `shasum -a 256 src/content/tenets.yaml`.
3. If version, status, or tenet count changed, update the matching expected
   values in `scripts/validate-site.js` (the release ratchet asserts them).
4. Run `npm run check` until green.

The validator also asserts that every tenet carries `name`, `short`, and
`gloss` in every supported language, so translations cannot silently lag.

### Adding a language or a tenet

- Tenets: append to `src/content/tenets.yaml`, then follow the recipe above.
- Languages: add a locale object under `locales` and the code to `languages`
  in `src/_data/site.js`; routing, hreflang, sitemaps, and the
  machine-readable corpus are all generated from that one config.

## Deployment

- `.github/workflows/deploy.yml` — on every push to `gh-pages` (the default
  branch) or manual dispatch: validate + build, then publish the artifact via
  OIDC. The `build` job runs with `contents: read` only; only the `deploy` job
  holds Pages write permissions.
- `.github/workflows/validate.yml` — validates pull requests targeting
  `gh-pages`.
- `.github/workflows/audit.yml` — weekly non-blocking `npm audit`.
- `.github/dependabot.yml` — weekly npm + GitHub Actions update PRs.
- Third-party GitHub Actions are pinned to commit SHAs; installs run with
  lifecycle scripts disabled (`--ignore-scripts`, also set in `.npmrc`).

## Machine-readable corpus

Generated each build from `src/content/tenets.yaml` + `src/_data/site.js` by
`src/_lib/machine-readable.js`:

- `/llms.txt` — discovery file for automated readers
- `/json/tenets.json` + per-tenet JSON under `/json/tenets/`
- `/yaml/tenets.yaml` — canonical doctrine source
- `/md/index.md`, `/md/{en,zh-hant}.md` + per-tenet Markdown
- `/sitemap.xml` (pages) and `/sitemap-data.xml` (data files)

Every generated file is byte-compared against its renderer by the validator,
so the published corpus cannot drift from the source.

## Repo notes

- `codedb.snapshot` — local binary index used by tooling; untracked, safe to
  delete.
- `tmp/` — local staging area for incoming content; untracked.

## License

- Code, templates, and build tooling: [MIT](LICENSE).
- Doctrine content (`src/content/tenets.yaml`, its translations, and the
  generated JSON/YAML/Markdown corpus): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
