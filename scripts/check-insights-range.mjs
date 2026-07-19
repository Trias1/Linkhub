import assert from "node:assert/strict";
import { insightRange, insightDays } from "../src/lib/insights-range.ts";

const fixed = new Date("2026-07-19T12:00:00.000Z");
assert.equal(insightRange("7", undefined, undefined, fixed).from, "2026-07-13T00:00:00.000Z");
assert.equal(insightRange("custom", "2026-07-01", "2026-07-03", fixed).to, "2026-07-03T23:59:59.999Z");
assert.deepEqual(insightDays("2026-07-17T00:00:00.000Z", "2026-07-19T23:59:59.999Z").map((day) => day.key), ["2026-07-17","2026-07-18","2026-07-19"]);
assert.equal(insightRange("custom", "2020-01-01", "2026-07-19", fixed).selected, "7");
console.log("insights range checks passed");


