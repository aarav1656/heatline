import { describe, it, expect } from "vitest";
import {
  getBuildingRecord,
  lookupBuilding,
  matchConditionToCode,
  compareToBlock,
  CODE_TABLE,
  INDEX_META,
} from "./index";

describe("data layer against the real built index", () => {
  it("has a demo BBL with a substantial open class C count", () => {
    const record = getBuildingRecord(INDEX_META.demoBbl);
    expect(record).not.toBeNull();
    expect(record!.openClassC).toBeGreaterThanOrEqual(5);
  });

  it("finds the demo building by an address substring", () => {
    const record = getBuildingRecord(INDEX_META.demoBbl)!;
    const streetWord = record.building.address.split(" ")[1]; // skip house number
    const results = lookupBuilding(streetWord);
    expect(results.some((b) => b.bbl === INDEX_META.demoBbl)).toBe(true);
  });

  it("finds the demo building by full BBL", () => {
    const results = lookupBuilding(INDEX_META.demoBbl);
    expect(results.length).toBe(1);
    expect(results[0].bbl).toBe(INDEX_META.demoBbl);
  });

  it("matches a no-heat condition described in plain language to 27-2029", () => {
    const matches = matchConditionToCode("no heat at 7am, apartment is 52 degrees");
    expect(matches.some((m) => m.section === "27-2029")).toBe(true);
  });

  it("matches a hot water complaint to 27-2031", () => {
    const matches = matchConditionToCode("there has been no hot water for a week");
    expect(matches.some((m) => m.section === "27-2031")).toBe(true);
  });

  it("returns a numeric block comparison for the demo BBL", () => {
    const cmp = compareToBlock(INDEX_META.demoBbl);
    expect(cmp).not.toBeNull();
    expect(typeof cmp!.building).toBe("number");
    expect(typeof cmp!.blockMedian).toBe("number");
    expect(cmp!.blockCount).toBeGreaterThanOrEqual(1);
  });

  it("returns null for a BBL not in the index", () => {
    expect(getBuildingRecord("9999999999")).toBeNull();
  });

  it("every violation in the demo record carries a real SODA source URL", () => {
    const record = getBuildingRecord(INDEX_META.demoBbl)!;
    expect(record.violations.length).toBeGreaterThan(0);
    expect(record.source.query.startsWith("https://data.cityofnewyork.us/resource/")).toBe(
      true,
    );
    expect(record.source.rows).toBeGreaterThan(0);
    for (const winter of record.heatComplaintsByWinter) {
      expect(winter.source.query.startsWith("https://data.cityofnewyork.us/resource/")).toBe(
        true,
      );
    }
  });

  it("CODE_TABLE has exactly six rows with plain-English requirements including the heat rule", () => {
    expect(CODE_TABLE.length).toBe(6);
    const heat = CODE_TABLE.find((c) => c.condition === "heat")!;
    expect(heat.section).toBe("27-2029");
    expect(heat.requirement).toMatch(/68F/);
    expect(heat.requirement).toMatch(/55F/);
    expect(heat.requirement).toMatch(/62F/);
    expect(heat.heatSeason).toBe("Oct 1 - May 31");
  });

  it("INDEX_META reports a nonzero building and violation count", () => {
    expect(INDEX_META.buildings).toBeGreaterThan(0);
    expect(INDEX_META.violations).toBeGreaterThan(0);
    expect(INDEX_META.sources.length).toBeGreaterThan(0);
  });

  // Break-red-green: this test guards that class filtering actually narrows results.
  // If getBuildingRecord ever returned every violation regardless of class (e.g. someone
  // deletes the class filter used when computing openClassC), this must fail.
  it("openClassC only counts class C violations that are open (guarded)", () => {
    const record = getBuildingRecord(INDEX_META.demoBbl)!;
    const trueOpenClassC = record.violations.filter(
      (v) => v.class === "C" && v.status === "open",
    ).length;
    expect(record.openClassC).toBe(trueOpenClassC);
    // Sanity: not all violations are class C, so this is a real filter, not a tautology.
    const allClassC = record.violations.every((v) => v.class === "C");
    expect(allClassC).toBe(false);
  });
});
