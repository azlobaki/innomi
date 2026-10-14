import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyRule, parseTemplates } from "./types.ts";

test("keeps well-formed templates as they were saved", () => {
  const saved = [
    {
      id: "t1",
      name: "HR data",
      updatedAt: 42,
      rules: [{ id: "r1", find: "Alice", replace: "PERSON_1", caseSensitive: true }],
    },
  ];
  assert.deepEqual(parseTemplates(saved), saved);
});

test("returns nothing for storage that is not a list", () => {
  for (const value of [null, undefined, 3, "x", { name: "HR" }]) {
    assert.deepEqual(parseTemplates(value), []);
  }
});

test("drops templates without a usable name", () => {
  const parsed = parseTemplates([null, 7, { rules: [] }, { name: "   " }, { name: "Kept" }]);
  assert.deepEqual(
    parsed.map((template) => template.name),
    ["Kept"],
  );
});

test("fills in missing fields instead of failing", () => {
  const [template] = parseTemplates([{ name: "Old", rules: [{ find: "Bob" }] }]);
  assert.equal(typeof template.id, "string");
  assert.ok(template.id.length > 0);
  assert.equal(template.updatedAt, 0);
  assert.equal(template.rules.length, 1);
  assert.equal(template.rules[0].replace, "");
  assert.equal(template.rules[0].caseSensitive, false);
});

test("drops rules whose search text is not a string", () => {
  const [template] = parseTemplates([
    { name: "Mixed", rules: [{ find: 1 }, "Bob", null, { find: "Carol", caseSensitive: "yes" }] },
  ]);
  assert.deepEqual(
    template.rules.map((rule) => [rule.find, rule.caseSensitive]),
    [["Carol", false]],
  );
});

test("gives every new rule its own id", () => {
  const ids = new Set(Array.from({ length: 50 }, () => emptyRule().id));
  assert.equal(ids.size, 50);
});
