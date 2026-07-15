const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const localeRoot = path.join(root, "public", "locales");

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const filePath = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(filePath) : [filePath];
});

test("all six locales are valid and contain identical translation keys", () => {
  const locales = ["en", "es", "hi", "pt", "zh", "fr"];
  const dictionaries = Object.fromEntries(locales.map((locale) => [
    locale,
    JSON.parse(fs.readFileSync(path.join(localeRoot, locale, "common.json"), "utf8")),
  ]));
  const baseline = Object.keys(dictionaries.en).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(dictionaries[locale]).sort(), baseline, `${locale} keys differ from English`);
  }
});

test("every static translation key used by the frontend exists in every locale", () => {
  const sourceFiles = walk(path.join(root, "src")).filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));
  const usedKeys = new Set();
  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/\bt\(\s*["'`]([^"'`$]+)["'`]/g)) usedKeys.add(match[1]);
  }

  for (const locale of ["en", "es", "hi", "pt", "zh", "fr"]) {
    const dictionary = JSON.parse(fs.readFileSync(path.join(localeRoot, locale, "common.json"), "utf8"));
    const missing = [...usedKeys].filter((key) => !(key in dictionary));
    assert.deepEqual(missing, [], `${locale} is missing translation keys`);
  }
});
