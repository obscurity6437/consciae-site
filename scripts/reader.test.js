const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const reader = fs.readFileSync(path.join(root, "src/assets/reader.js"), "utf8");

function eventTarget(properties = {}) {
  const listeners = new Map();
  return Object.assign(properties, {
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(callback);
    },
    emit(name, event = {}) {
      for (const callback of listeners.get(name) || []) callback(event);
    }
  });
}

function readerFixture(isCompact = false) {
  let focused;
  const frames = [];
  const sections = ["introduction", "tenet-groundbreaking", "tenet-common-mortar", "about"].map((id, index) => ({
    id,
    top: 200 + index * 500,
    getBoundingClientRect() { return { top: this.top }; },
    focus() { focused = id; }
  }));
  const links = sections.map((section) => eventTarget({
    hash: `#${section.id}`,
    attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; }
  }));
  const summary = { focus() { focused = "summary"; } };
  const contents = eventTarget({
    open: true,
    querySelectorAll: () => links,
    querySelector: () => summary
  });
  const compact = eventTarget({ matches: isCompact });
  const window = eventTarget({
    innerHeight: 800,
    matchMedia: () => compact,
    requestAnimationFrame(callback) { frames.push(callback); }
  });
  vm.runInNewContext(reader, {
    window,
    document: {
      querySelector: () => contents,
      querySelectorAll: () => sections,
      getElementById: (id) => sections.find((section) => section.id === id)
    }
  });
  return {
    contents, compact, links, sections, window, frames,
    focus: () => focused,
    flush: () => { while (frames.length) frames.shift()(); },
    current: () => links.filter((link) => link.attributes["aria-current"] === "location").map((link) => link.hash)
  };
}

test("desktop contents starts open with exactly one current section", () => {
  const fixture = readerFixture();
  assert.equal(fixture.contents.open, true);
  assert.deepEqual(fixture.current(), ["#introduction"]);
});

test("mobile selection closes contents and transfers keyboard focus", () => {
  const fixture = readerFixture(true);
  assert.equal(fixture.contents.open, false);
  fixture.contents.open = true;
  fixture.links[1].emit("click", { button: 0 });
  assert.equal(fixture.contents.open, false);
  assert.equal(fixture.focus(), "tenet-groundbreaking");
});

test("modified clicks do not close the mobile contents or move focus", () => {
  for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) {
    const fixture = readerFixture(true);
    fixture.contents.open = true;
    fixture.links[1].emit("click", { button: 0, [modifier]: true });
    assert.equal(fixture.contents.open, true);
    assert.equal(fixture.focus(), undefined);
  }
});

test("Escape closes the mobile menu and focuses its summary", () => {
  const fixture = readerFixture(true);
  fixture.contents.open = true;
  fixture.contents.emit("keydown", { key: "Escape" });
  assert.equal(fixture.contents.open, false);
  assert.equal(fixture.focus(), "summary");
});

test("crossing the responsive breakpoint resets the contents presentation", () => {
  const fixture = readerFixture();
  fixture.compact.matches = true;
  fixture.compact.emit("change");
  assert.equal(fixture.contents.open, false);
  fixture.compact.matches = false;
  fixture.compact.emit("change");
  assert.equal(fixture.contents.open, true);
});

test("reading position updates on scroll, resize and history restoration", () => {
  const fixture = readerFixture();
  fixture.sections[0].top = -500;
  fixture.sections[1].top = 32;
  fixture.window.emit("scroll");
  fixture.window.emit("scroll");
  assert.equal(fixture.frames.length, 1, "scroll events should share one animation frame");
  fixture.flush();
  assert.deepEqual(fixture.current(), ["#tenet-groundbreaking"]);
  fixture.sections[2].top = 100;
  fixture.window.emit("resize");
  fixture.flush();
  assert.deepEqual(fixture.current(), ["#tenet-common-mortar"]);
  fixture.sections[3].top = 120;
  fixture.window.emit("pageshow");
  fixture.flush();
  assert.deepEqual(fixture.current(), ["#about"]);
});

test("reader enhancement is harmless without contents", () => {
  assert.doesNotThrow(() => vm.runInNewContext(reader, { document: { querySelector: () => null } }));
});

function localeFixture({ pathname = "/", search = "", hash = "", saved, blocked = false } = {}) {
  const home = pathname !== "/";
  const html = fs.readFileSync(path.join(root, "_site", home ? "en/index.html" : "index.html"), "utf8");
  const inlineScripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((match) => !match[1].includes("application/ld+json"))
    .map((match) => match[2]);
  const storage = new Map(saved ? [["consciae.locale", saved]] : []);
  let redirect;
  const links = ["en", "zh-Hant"].map((locale) => eventTarget({
    href: `https://consciae.org/${locale.toLowerCase()}/`,
    hasAttribute: (name) => home && name === "data-sync-fragment",
    getAttribute: (name) => name === "data-preferred-locale" ? locale : null
  }));
  const window = eventTarget({ location: { pathname, search, hash, replace: (url) => { redirect = url; } } });
  const context = {
    window, URL, URLSearchParams,
    document: { querySelectorAll: () => links },
    localStorage: {
      getItem(key) { if (blocked) throw new Error("Storage denied"); return storage.get(key); },
      setItem(key, value) { if (blocked) throw new Error("Storage denied"); storage.set(key, value); }
    }
  };
  for (const script of inlineScripts) vm.runInNewContext(script, context);
  return { links, window, storage, redirect: () => redirect };
}

test("the entrance does not choose a language for a first-time visitor", () => {
  assert.equal(localeFixture().redirect(), undefined);
});

test("a saved language is respected without trapping the language chooser", () => {
  assert.equal(localeFixture({ saved: "zh-Hant" }).redirect(), "/zh-hant/");
  assert.equal(localeFixture({ saved: "en" }).redirect(), "/en/");
  assert.equal(localeFixture({ saved: "en", search: "?stay=1" }).redirect(), undefined);
  assert.equal(localeFixture({ saved: "unknown" }).redirect(), undefined);
});

test("language choice works when persistent storage is blocked", () => {
  const fixture = localeFixture({ blocked: true });
  assert.equal(fixture.redirect(), undefined);
  assert.doesNotThrow(() => fixture.links[1].emit("click"));
});

test("choosing an edition stores that explicit preference", () => {
  const fixture = localeFixture();
  fixture.links[1].emit("click");
  assert.equal(fixture.storage.get("consciae.locale"), "zh-Hant");
});

test("language switching carries the current reading fragment, including changes", () => {
  const fixture = localeFixture({ pathname: "/en/", hash: "#tenet-veiled-chamber" });
  assert.equal(fixture.links[1].href, "https://consciae.org/zh-hant/#tenet-veiled-chamber");
  fixture.window.location.hash = "#about";
  fixture.window.emit("hashchange");
  assert.equal(fixture.links[1].href, "https://consciae.org/zh-hant/#about");
  fixture.window.location.hash = "#main-content";
  fixture.window.emit("hashchange");
  assert.equal(fixture.links[1].href, "https://consciae.org/zh-hant/");
});
