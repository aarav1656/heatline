// The Data layer API for Heatline. Reads data/index.json (built by
// scripts/build-index.ts) and exposes the exact surface documented in
// docs/BUILD-CONTRACT.md. No network calls at runtime, this module is pure reads
// and pure functions over the built index.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Building, BuildingRecord, CodeMatch, IndexFile, SourceRef } from "./types";

export type { SourceRef, Building, Violation, ComplaintSummary, BuildingRecord, CodeMatch } from "./types";

let cachedIndex: IndexFile | null = null;

function loadIndex(): IndexFile {
  if (cachedIndex) return cachedIndex;
  const path = join(process.cwd(), "data", "index.json");
  const raw = readFileSync(path, "utf-8");
  cachedIndex = JSON.parse(raw) as IndexFile;
  return cachedIndex;
}

export const CODE_TABLE: CodeMatch[] = [
  {
    condition: "heat",
    section: "27-2029",
    title: "Heat requirement",
    requirement:
      "Owners must provide heat to at least 68F indoors from 6am to 10pm when it is below 55F outside, and at least 62F overnight, every day of heat season.",
    heatSeason: "Oct 1 - May 31",
    classHint: "C",
  },
  {
    condition: "hot_water",
    section: "27-2031",
    title: "Hot water requirement",
    requirement:
      "Owners must provide hot water at a constant minimum of 120F at every tap, 365 days a year, with no seasonal exception.",
    classHint: "C",
  },
  {
    condition: "mold",
    section: "27-2017",
    title: "Mold and mildew",
    requirement:
      "Owners must correct mold or mildew conditions and the underlying moisture source that caused them within the timeframe set by the violation class.",
    classHint: "B",
  },
  {
    condition: "pests",
    section: "27-2018",
    title: "Pest infestation",
    requirement:
      "Owners must eliminate infestations of rodents, roaches, or other vermin and correct the conditions that allow them to persist.",
    classHint: "B",
  },
  {
    condition: "lead",
    section: "27-2056",
    title: "Lead paint hazard",
    requirement:
      "Owners of pre-1960 buildings (or 1960-78 if known to contain lead paint) must remediate lead paint hazards when a child under 6 resides in the apartment.",
    classHint: "C",
  },
  {
    condition: "gas",
    section: "27-2033",
    title: "Heating system access and gas",
    requirement:
      "Owners must maintain safe, unobstructed access to the building's heating system and correct any gas-related hazard promptly.",
    classHint: "C",
  },
];

const CONDITION_KEYWORDS: Record<string, RegExp> = {
  heat: /\bheat\b|\bcold\b|\bdegree|°F|\b\d{2}\s?f\b/i,
  hot_water: /hot water/i,
  mold: /mold|mildew/i,
  pests: /rodent|roach|mice|mouse|vermin|pest|infestation|insect/i,
  lead: /lead paint|lead-based|\blead\b/i,
  gas: /\bgas\b|boiler|heating system/i,
};

export function matchConditionToCode(text: string): CodeMatch[] {
  const matches: CodeMatch[] = [];
  for (const [condition, pattern] of Object.entries(CONDITION_KEYWORDS)) {
    if (pattern.test(text)) {
      const entry = CODE_TABLE.find((c) => c.condition === condition);
      if (entry) matches.push(entry);
    }
  }
  return matches;
}

export function lookupBuilding(query: string): Building[] {
  const idx = loadIndex();
  const q = query.trim().toUpperCase();
  if (q.length === 0) return [];
  const isBblQuery = /^\d{10}$/.test(q);
  return idx.records
    .filter((r) => {
      if (isBblQuery) return r.building.bbl === q;
      return r.building.address.toUpperCase().includes(q) || r.building.bbl.includes(q);
    })
    .map((r) => r.building);
}

export function getBuildingRecord(bbl: string): BuildingRecord | null {
  const idx = loadIndex();
  return idx.records.find((r) => r.building.bbl === bbl) ?? null;
}

export function compareToBlock(
  bbl: string,
): { building: number; blockMedian: number; blockCount: number; source: SourceRef } | null {
  const idx = loadIndex();
  const record = idx.records.find((r) => r.building.bbl === bbl);
  if (!record) return null;
  // Block = first 8 digits of BBL (boro + block, before the 4-digit lot).
  const block = bbl.slice(0, 6);
  const blockRecords = idx.records.filter((r) => r.building.bbl.slice(0, 6) === block);
  const values = blockRecords.map((r) => r.openClassC).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const blockMedian =
    values.length === 0
      ? 0
      : values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];
  return {
    building: record.openClassC,
    blockMedian,
    blockCount: blockRecords.length,
    source: record.source,
  };
}

export const INDEX_META: {
  builtAt: string;
  buildings: number;
  violations: number;
  sources: string[];
  demoBbl: string;
} = (() => {
  try {
    const idx = loadIndex();
    return idx.meta;
  } catch {
    // Fallback for build/lint contexts run before the index has been generated.
    return { builtAt: "", buildings: 0, violations: 0, sources: [], demoBbl: "" };
  }
})();
