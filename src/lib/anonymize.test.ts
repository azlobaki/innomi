import assert from "node:assert/strict";
import { test } from "node:test";
// Explicit extensions: `node --test` runs this file directly, with no bundler
// to resolve them.
import { anonymize } from "./anonymize.ts";
import type { Rule } from "./types.ts";

let seq = 0;
const rule = (find: string, replace = "", caseSensitive = false): Rule => ({
  id: `r${++seq}`,
  find,
  replace,
  caseSensitive,
});

test("replaces matches and deletes when the replacement is empty", () => {
  const name = rule("Alice", "PERSONNE_1");
  const marking = rule("CONFIDENTIEL", "");
  const result = anonymize("CONFIDENTIEL: Alice a appelé Alice.", [name, marking]);
  assert.equal(result.output, ": PERSONNE_1 a appelé PERSONNE_1.");
  assert.equal(result.counts[name.id], 2);
  assert.equal(result.counts[marking.id], 1);
  assert.equal(result.total, 3);
});

test("does not cascade one rule's output into the next rule", () => {
  const result = anonymize("Alice et Bob", [
    rule("Alice", "Bob"),
    rule("Bob", "Carol"),
  ]);
  assert.equal(result.output, "Bob et Carol");
});

test("never re-scans text it just wrote", () => {
  const result = anonymize("secret", [rule("secret", "secret-secret")]);
  assert.equal(result.output, "secret-secret");
});

test("ignores case by default", () => {
  const result = anonymize("ACME acme AcMe", [rule("acme", "X")]);
  assert.equal(result.output, "X X X");
  assert.equal(result.total, 3);
});

test("honours case-sensitive rules", () => {
  const result = anonymize("ACME acme", [rule("acme", "X", true)]);
  assert.equal(result.output, "ACME X");
  assert.equal(result.total, 1);
});

test("mixes case-sensitive and case-insensitive rules in one pass", () => {
  const exact = rule("IP", "<PROTO>", true);
  const loose = rule("serveur", "<HOST>");
  const result = anonymize("Le Serveur IP et le serveur ip", [exact, loose]);
  assert.equal(result.output, "Le <HOST> <PROTO> et le <HOST> ip");
  assert.equal(result.counts[exact.id], 1);
  assert.equal(result.counts[loose.id], 2);
});

test("prefers the longest match at a given position", () => {
  const result = anonymize("Jean Dupont et Jean", [
    rule("Jean", "P2"),
    rule("Jean Dupont", "P1"),
  ]);
  assert.equal(result.output, "P1 et P2");
});

test("resolves overlapping occurrences like replaceAll", () => {
  const pair = rule("aa", "-");
  const result = anonymize("aaaa", [pair]);
  assert.equal(result.output, "aaaa".replaceAll("aa", "-"));
  assert.equal(result.counts[pair.id], 2);
});

test("keeps indexes aligned on characters that grow when lowercased", () => {
  const result = anonymize("Café CAFÉ İstanbul", [
    rule("café", "<C>"),
    rule("İstanbul", "<V>"),
  ]);
  assert.equal(result.output, "<C> <C> <V>");
});

test("is inert on empty text, empty needles and empty rule lists", () => {
  assert.equal(anonymize("texte", [rule("", "X")]).output, "texte");
  assert.equal(anonymize("", [rule("a", "X")]).output, "");
  assert.equal(anonymize("texte", []).output, "texte");
});

test("reports zero for rules that never match", () => {
  const miss = rule("introuvable", "X");
  const result = anonymize("bonjour", [miss]);
  assert.equal(result.counts[miss.id], 0);
  assert.equal(result.total, 0);
});

test("cuts the source and the output at the same places", () => {
  const name = rule("Alice", "P1");
  const result = anonymize("Bonjour Alice, ici Alice.", [name]);
  assert.equal(result.sourcePieces.map((piece) => piece.text).join(""), "Bonjour Alice, ici Alice.");
  assert.equal(result.outputPieces.map((piece) => piece.text).join(""), result.output);
  assert.deepEqual(
    result.sourcePieces.map((piece) => [piece.text, piece.ruleId]),
    [
      ["Bonjour ", null],
      ["Alice", name.id],
      [", ici ", null],
      ["Alice", name.id],
      [".", null],
    ],
  );
});

test("marks a deletion as an empty output piece the UI can point at", () => {
  const dropped = rule("CONFIDENTIEL ", "");
  const result = anonymize("CONFIDENTIEL rapport", [dropped]);
  assert.deepEqual(result.outputPieces, [
    { text: "", ruleId: dropped.id },
    { text: "rapport", ruleId: null },
  ]);
  assert.equal(result.sourcePieces[0].text, "CONFIDENTIEL ");
});

test("returns one untouched piece when nothing matches", () => {
  const result = anonymize("bonjour", [rule("absent", "X")]);
  assert.deepEqual(result.sourcePieces, [{ text: "bonjour", ruleId: null }]);
  assert.deepEqual(result.outputPieces, [{ text: "bonjour", ruleId: null }]);
  assert.deepEqual(anonymize("", []).sourcePieces, []);
});

test("handles a large paste in reasonable time", () => {
  const text = "nom: Alice, ip: 10.0.0.1\n".repeat(20_000);
  const started = performance.now();
  const result = anonymize(text, [rule("Alice", "P1"), rule("10.0.0.1", "IP1")]);
  const elapsed = performance.now() - started;
  assert.equal(result.total, 40_000);
  assert.ok(elapsed < 2000, `too slow: ${elapsed.toFixed(0)} ms`);
});
