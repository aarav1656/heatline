// Types for the per-BBL HPD enforcement index (data/index.json) and its derived
// building-level views. No React or Next.js imports here: this module is plain data
// plus pure functions, importable from server or client code.

export type SourceRef = { dataset: string; query: string; rows: number };

export type Building = {
  bbl: string; // 10-digit borough-block-lot
  address: string; // "123 EXAMPLE ST"
  borough: string;
  zip: string;
  buildingId?: string; // HPD building id
  registration?: {
    ownerName: string;
    agentName?: string;
    portfolioBuildings: number;
    source: SourceRef;
  };
};

export type Violation = {
  violationId: string;
  class: "A" | "B" | "C" | "I";
  status: "open" | "closed";
  inspectionDate: string; // ISO date
  daysOpen: number; // to build date if open, else to close date
  description: string; // novdescription
  codeSection?: string; // e.g. "27-2029" when inferrable from ordernumber/description
  apartment?: string;
};

export type ComplaintSummary = {
  winter: string; // "2024-25"
  heatHotWaterComplaints: number;
  source: SourceRef;
};

export type BuildingRecord = {
  building: Building;
  openClassC: number;
  openClassB: number;
  openClassA: number;
  totalOpen: number;
  oldestOpenDays: number;
  violations: Violation[]; // open first, newest first, capped 200
  heatComplaintsByWinter: ComplaintSummary[];
  source: SourceRef; // the SODA query for violations
};

export type CodeMatch = {
  condition: string; // "heat" | "hot_water" | "mold" | "pests" | "lead" | "gas"
  section: string; // "27-2029"
  title: string;
  requirement: string; // one sentence, plain English, with numbers
  heatSeason?: string; // "Oct 1 - May 31"
  classHint: "A" | "B" | "C";
};

// The on-disk shape of data/index.json.
export type IndexFile = {
  meta: {
    builtAt: string;
    buildings: number;
    violations: number;
    demoBbl: string;
    zip: string;
    sources: string[];
  };
  records: BuildingRecord[];
};
