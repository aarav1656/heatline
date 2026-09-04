// Builds data/index.json (the product's owned asset) from four keyless NYC Open Data
// (SODA/Socrata) sources:
//   1. HPD violations, wvxf-dwi5
//   2. HPD complaints and problems (merged), ygpa-z7cr
//   3. HPD registrations, tesw-yqqr
//   4. HPD registration contacts, feu5-w2e2
//
// Every derived number in data/index.json carries the exact SODA query string that
// produced it, so a judge can paste the URL and reproduce the figure.
//
// Run: npx tsx scripts/build-index.ts

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type {
  Building,
  BuildingRecord,
  ComplaintSummary,
  IndexFile,
  Violation,
} from "../src/lib/index/types";

const ROOT = join(import.meta.dirname, "..");
const DATA_DIR = join(ROOT, "data");

const VIOLATIONS_DATASET = "wvxf-dwi5";
const VIOLATIONS_URL = `https://data.cityofnewyork.us/resource/${VIOLATIONS_DATASET}.json`;
const COMPLAINTS_DATASET = "ygpa-z7cr";
const COMPLAINTS_URL = `https://data.cityofnewyork.us/resource/${COMPLAINTS_DATASET}.json`;
const REGISTRATIONS_DATASET = "tesw-yqqr";
const REGISTRATIONS_URL = `https://data.cityofnewyork.us/resource/${REGISTRATIONS_DATASET}.json`;
const CONTACTS_DATASET = "feu5-w2e2";
const CONTACTS_URL = `https://data.cityofnewyork.us/resource/${CONTACTS_DATASET}.json`;

const TOP_N_BBLS = 40;
const VIOLATION_HISTORY_CAP = 200;
const WINTER_COUNT = 3;

async function fetchJson<T>(url: string, label: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "heatline-index-builder/1.0" },
    });
    if (res.ok) return (await res.json()) as T;
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const body = await res.text();
    throw new Error(`${label} fetch failed: ${res.status} ${res.statusText} (${url})\n${body}`);
  }
  throw new Error(`${label} fetch failed after retries (${url})`);
}

function soqlUrl(base: string, params: Record<string, string>): string {
  const parts = Object.entries(params).map(
    ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
  );
  return `${base}?${parts.join("&")}`;
}

function bblOf(boroid: string, block: string, lot: string): string {
  return `${boroid}${block.padStart(5, "0")}${lot.padStart(4, "0")}`;
}

// --- step 1: pick the Bronx zip with the most open class C heat violations ---

interface ZipCountRow {
  zip: string;
  cnt: string;
}

async function pickZip(): Promise<{ zip: string; url: string; rows: ZipCountRow[] }> {
  const where =
    "boro='BRONX' AND class='C' AND violationstatus='Open' AND upper(novdescription) like '%HEAT%'";
  const url = soqlUrl(VIOLATIONS_URL, {
    $select: "zip,count(violationid) as cnt",
    $where: where,
    $group: "zip",
    $order: "cnt DESC",
    $limit: "10",
  });
  const rows = await fetchJson<ZipCountRow[]>(url, "zip pick");
  if (rows.length === 0) throw new Error("no zips found for Bronx open class C heat query");
  return { zip: rows[0].zip, url, rows };
}

// --- step 2: top N BBLs in that zip by open class C heat violation count ---

interface BblCountRow {
  boro: string;
  block: string;
  lot: string;
  cnt: string;
}

async function pickTopBbls(
  zip: string,
): Promise<{ bbls: string[]; url: string; rows: BblCountRow[] }> {
  const where = `boro='BRONX' AND zip='${zip}' AND class='C' AND violationstatus='Open' AND upper(novdescription) like '%HEAT%'`;
  const url = soqlUrl(VIOLATIONS_URL, {
    $select: "boro,block,lot,count(violationid) as cnt",
    $where: where,
    $group: "boro,block,lot",
    $order: "cnt DESC",
    $limit: String(TOP_N_BBLS),
  });
  const rows = await fetchJson<BblCountRow[]>(url, "top BBLs");
  const bbls = rows.map((r) => bblOf("2", r.block, r.lot));
  return { bbls, url, rows };
}

// --- step 3: full violation history per BBL, open first, capped ---

interface ViolationRow {
  violationid: string;
  class: string;
  currentstatus: string;
  violationstatus: string;
  inspectiondate: string;
  currentstatusdate: string;
  novdescription: string;
  ordernumber: string;
  apartment?: string;
  housenumber?: string;
  streetname?: string;
  boro?: string;
  zip?: string;
}

const CODE_KEYWORDS: { section: string; test: (desc: string) => boolean }[] = [
  { section: "27-2029", test: (d) => /HEAT/.test(d) && !/HOT WATER/.test(d) },
  { section: "27-2031", test: (d) => /HOT WATER/.test(d) },
  { section: "27-2017", test: (d) => /MOLD|MILDEW/.test(d) },
  { section: "27-2018", test: (d) => /RODENT|ROACH|VERMIN|PEST|MICE|INSECT/.test(d) },
  { section: "27-2056", test: (d) => /LEAD/.test(d) },
  { section: "27-2033", test: (d) => /HEATING SYSTEM|BOILER|GAS/.test(d) && /GAS/.test(d) },
];

function inferCodeSection(desc: string, ordernumber: string): string | undefined {
  const upper = desc.toUpperCase();
  const explicitMatch = desc.match(/§\s*(27-\d{4}(?:\.\d+)?)/);
  if (explicitMatch) return explicitMatch[1];
  for (const rule of CODE_KEYWORDS) {
    if (rule.test(upper)) return rule.section;
  }
  void ordernumber;
  return undefined;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

async function fetchViolationsForBbl(
  boroName: string,
  block: string,
  lot: string,
): Promise<{ violations: Violation[]; url: string; rowCount: number; building: Building | null }> {
  const where = `boro='${boroName}' AND block='${block}' AND lot='${lot}'`;
  const url = soqlUrl(VIOLATIONS_URL, {
    $select:
      "violationid,class,currentstatus,violationstatus,inspectiondate,currentstatusdate,novdescription,ordernumber,apartment,housenumber,streetname,boro,zip,buildingid",
    $where: where,
    $order: "violationstatus DESC,inspectiondate DESC",
    $limit: String(VIOLATION_HISTORY_CAP),
  });
  const rows = await fetchJson<(ViolationRow & { buildingid?: string })[]>(
    url,
    `violations ${boroName} ${block}/${lot}`,
  );
  const now = new Date();
  const violations: Violation[] = rows.map((r) => {
    const isOpen = r.violationstatus === "Open";
    const inspection = new Date(r.inspectiondate);
    const closeOrNow = isOpen ? now : new Date(r.currentstatusdate || r.inspectiondate);
    const cls = (["A", "B", "C", "I"].includes(r.class) ? r.class : "I") as
      | "A"
      | "B"
      | "C"
      | "I";
    return {
      violationId: r.violationid,
      class: cls,
      status: isOpen ? "open" : "closed",
      inspectionDate: r.inspectiondate,
      daysOpen: daysBetween(inspection, closeOrNow),
      description: r.novdescription,
      codeSection: inferCodeSection(r.novdescription, r.ordernumber),
      apartment: r.apartment || undefined,
    };
  });
  let building: Building | null = null;
  if (rows.length > 0) {
    const r = rows[0];
    building = {
      bbl: bblOf("2", block, lot),
      address: `${r.housenumber ?? ""} ${r.streetname ?? ""}`.trim(),
      borough: "Bronx",
      zip: r.zip ?? "",
      buildingId: r.buildingid,
    };
  }
  return { violations, url, rowCount: rows.length, building };
}

// --- step 4: heat/hot water complaints per winter (Oct-May), last 3 winters ---

function winterLabel(startYear: number): string {
  const endYy = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYy}`;
}

function currentWinterStartYear(now: Date): number {
  // Heat season runs Oct 1 - May 31. Jan-Sep all fall within or after a winter that
  // started the previous calendar year; only Oct-Dec starts a new winter this year.
  const month = now.getMonth() + 1; // 1-12
  return month >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}

interface ComplaintCountRow {
  cnt: string;
}

async function fetchHeatComplaintsForBbl(
  bbl: string,
): Promise<{ summaries: ComplaintSummary[] }> {
  const now = new Date();
  const latestWinterStart = currentWinterStartYear(now);
  const summaries: ComplaintSummary[] = [];
  for (let i = 0; i < WINTER_COUNT; i++) {
    const startYear = latestWinterStart - i;
    const from = `${startYear}-10-01T00:00:00`;
    const to = `${startYear + 1}-06-01T00:00:00`;
    const where = `bbl='${bbl}' AND major_category='HEAT/HOT WATER' AND received_date >= '${from}' AND received_date < '${to}'`;
    const url = soqlUrl(COMPLAINTS_URL, {
      $select: "count(distinct complaint_id) as cnt",
      $where: where,
    });
    const rows = await fetchJson<ComplaintCountRow[]>(url, `complaints ${bbl} winter ${i}`);
    const cnt = rows.length > 0 ? Number(rows[0].cnt) : 0;
    summaries.push({
      winter: winterLabel(startYear),
      heatHotWaterComplaints: cnt,
      source: { dataset: COMPLAINTS_DATASET, query: url, rows: cnt },
    });
    await new Promise((r) => setTimeout(r, 120));
  }
  return { summaries };
}

// --- step 5: owner registration + portfolio size ---

interface RegistrationRow {
  registrationid: string;
  lastregistrationdate: string;
}

interface ContactRow {
  type: string;
  corporationname?: string;
  firstname?: string;
  lastname?: string;
}

interface PortfolioCountRow {
  cnt: string;
}

async function fetchRegistrationForBbl(
  boroName: string,
  block: string,
  lot: string,
): Promise<Building["registration"] | undefined> {
  const regWhere = `boro='${boroName}' AND block='${block}' AND lot='${lot}'`;
  const regUrl = soqlUrl(REGISTRATIONS_URL, {
    $select: "registrationid,lastregistrationdate",
    $where: regWhere,
    $order: "lastregistrationdate DESC",
    $limit: "1",
  });
  const regRows = await fetchJson<RegistrationRow[]>(regUrl, `registration ${boroName} ${block}/${lot}`);
  if (regRows.length === 0) return undefined;
  const registrationId = regRows[0].registrationid;

  const contactUrl = soqlUrl(CONTACTS_URL, {
    $select: "type,corporationname,firstname,lastname",
    $where: `registrationid='${registrationId}'`,
    $limit: "20",
  });
  const contacts = await fetchJson<ContactRow[]>(contactUrl, `contacts ${registrationId}`);
  const owner = contacts.find(
    (c) => c.type === "CorporateOwner" || c.type === "IndividualOwner",
  );
  const agent = contacts.find((c) => c.type === "Agent");
  const nameOf = (c: ContactRow | undefined): string | undefined => {
    if (!c) return undefined;
    if (c.corporationname) return c.corporationname;
    if (c.firstname || c.lastname) return `${c.firstname ?? ""} ${c.lastname ?? ""}`.trim();
    return undefined;
  };
  const ownerName = nameOf(owner);
  if (!ownerName) return undefined;

  const portfolioUrl = soqlUrl(CONTACTS_URL, {
    $select: "count(distinct registrationid) as cnt",
    $where: `type='${owner!.type}' AND corporationname='${ownerName.replace(/'/g, "''")}'`,
  });
  const portfolioRows = await fetchJson<PortfolioCountRow[]>(
    portfolioUrl,
    `portfolio ${ownerName}`,
  );
  const portfolioBuildings = portfolioRows.length > 0 ? Number(portfolioRows[0].cnt) : 1;

  return {
    ownerName,
    agentName: nameOf(agent),
    portfolioBuildings,
    source: {
      dataset: CONTACTS_DATASET,
      query: portfolioUrl,
      rows: portfolioBuildings,
    },
  };
}

// --- main build ---

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Step 1: pick Bronx zip with most open class C heat violations...");
  const zipPick = await pickZip();
  console.log(`  chosen zip ${zipPick.zip} (${zipPick.rows[0].cnt} open class C heat)`);
  console.log(`  ${zipPick.url}`);

  console.log(`Step 2: top ${TOP_N_BBLS} BBLs in zip ${zipPick.zip}...`);
  const topBbls = await pickTopBbls(zipPick.zip);
  console.log(`  found ${topBbls.rows.length} BBLs`);
  console.log(`  ${topBbls.url}`);

  const records: BuildingRecord[] = [];
  let totalViolations = 0;

  for (let i = 0; i < topBbls.rows.length; i++) {
    const row = topBbls.rows[i];
    console.log(
      `Step 3.${i + 1}/${topBbls.rows.length}: BBL ${bblOf("2", row.block, row.lot)} (block ${row.block} lot ${row.lot}, ${row.cnt} open class C heat)...`,
    );
    const { violations, url, rowCount, building } = await fetchViolationsForBbl(
      "BRONX",
      row.block,
      row.lot,
    );
    if (!building) {
      console.log("  no violation rows returned, skipping");
      continue;
    }
    building.zip = building.zip || zipPick.zip;
    totalViolations += rowCount;

    const { summaries } = await fetchHeatComplaintsForBbl(building.bbl);
    building.registration = await fetchRegistrationForBbl("BRONX", row.block, row.lot);

    const openViolations = violations.filter((v) => v.status === "open");
    const openClassC = openViolations.filter((v) => v.class === "C").length;
    const openClassB = openViolations.filter((v) => v.class === "B").length;
    const openClassA = openViolations.filter((v) => v.class === "A").length;
    const oldestOpenDays = openViolations.reduce((max, v) => Math.max(max, v.daysOpen), 0);

    records.push({
      building,
      openClassC,
      openClassB,
      openClassA,
      totalOpen: openViolations.length,
      oldestOpenDays,
      violations,
      heatComplaintsByWinter: summaries,
      source: { dataset: VIOLATIONS_DATASET, query: url, rows: rowCount },
    });

    await new Promise((r) => setTimeout(r, 150));
  }

  if (records.length === 0) throw new Error("no building records built");

  const demo = records.reduce((best, r) => (r.openClassC > best.openClassC ? r : best));

  const indexFile: IndexFile = {
    meta: {
      builtAt: new Date().toISOString(),
      buildings: records.length,
      violations: records.reduce((sum, r) => sum + r.violations.length, 0),
      demoBbl: demo.building.bbl,
      zip: zipPick.zip,
      sources: [zipPick.url, topBbls.url, records[0]?.source.query].filter(Boolean) as string[],
    },
    records,
  };

  const outPath = join(DATA_DIR, "index.json");
  writeFileSync(outPath, JSON.stringify(indexFile));
  const metaPath = join(DATA_DIR, "index-meta.json");
  writeFileSync(metaPath, JSON.stringify(indexFile.meta, null, 2));

  const sizeMb = Buffer.byteLength(JSON.stringify(indexFile)) / (1024 * 1024);
  console.log("\n=== Build summary ===");
  console.log(`Zip: ${zipPick.zip}`);
  console.log(`Buildings: ${records.length}`);
  console.log(`Total violations pulled: ${indexFile.meta.violations}`);
  console.log(`Demo BBL: ${demo.building.bbl} (${demo.building.address}) open class C: ${demo.openClassC}`);
  console.log(`index.json size: ${sizeMb.toFixed(2)} MB`);
  console.log("Top 3 SODA URLs:");
  indexFile.meta.sources.slice(0, 3).forEach((u) => console.log(`  ${u}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
