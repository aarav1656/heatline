"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type BuildingHit = {
  bbl: string;
  address: string;
  borough: string;
  zip: string;
  openClassC?: number;
};

const CONDITION_TYPES: { value: string; label: string }[] = [
  { value: "heat", label: "Heat" },
  { value: "hot_water", label: "Hot Water" },
  { value: "mold", label: "Mold" },
  { value: "pests", label: "Pests" },
  { value: "lead", label: "Lead" },
  { value: "gas", label: "Gas" },
];

/**
 * Home page flow: search an address, pick the building, then seed the case with an apartment
 * and the first condition. Search hits GET /api/building?q= (tools agent); until that route
 * lands this shows the empty state rather than a fake result list.
 */
export function CreateCase() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<BuildingHit[] | null>(null);

  const [building, setBuilding] = useState<BuildingHit | null>(null);
  const [apartment, setApartment] = useState("");
  const [conditionType, setConditionType] = useState(CONDITION_TYPES[0].value);
  const [reading, setReading] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/building?q=${encodeURIComponent(query.trim())}`);
      const body = (await res.json()) as { buildings?: BuildingHit[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? `Search failed with HTTP ${res.status}.`);
      setResults(body.buildings ?? []);
    } catch (err) {
      setSearchError((err as Error).message);
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!building) return;
    if (!apartment.trim()) {
      setError("Enter the apartment number.");
      return;
    }
    if (!note.trim()) {
      setError("Describe the condition in a sentence.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bbl: building.bbl,
          apartment: apartment.trim(),
          firstCondition: { type: conditionType, reading: reading.trim() || undefined, note: note.trim() },
        }),
      });
      const body = (await res.json()) as { ownerUrl?: string; error?: string };
      if (!res.ok || !body.ownerUrl) {
        throw new Error(body.error ?? `Creating the case failed with HTTP ${res.status}.`);
      }
      router.push(body.ownerUrl);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={search} className="border-t-2 border-ink pt-4">
        <h2 className="colhead">Find the building</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            autoComplete="off"
            name="address"
            placeholder="Street address or BBL…"
            aria-label="Search for a building by address or BBL"
            className="flex-1 border border-hair-strong bg-paper px-2.5 py-2 text-[0.9375rem] focus:border-accent"
          />
          <Button type="submit" variant="primary" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </div>
        {searchError ? (
          <p role="alert" className="mt-2 text-[0.8125rem] font-medium text-tier-out">
            {searchError}
          </p>
        ) : null}
      </form>

      {results !== null ? (
        <section className="border-t-2 border-ink" aria-label="Search results">
          <header className="py-2">
            <h2 className="colhead">
              {results.length} building{results.length === 1 ? "" : "s"} found
            </h2>
          </header>
          {results.length === 0 ? (
            <p className="py-3 text-[0.875rem] text-body">
              No buildings matched that search. Try the street address as it appears on a lease or
              utility bill, or the ten-digit BBL.
            </p>
          ) : (
            <ol>
              {results.map((b) => (
                <li key={b.bbl} className="border-b border-hair py-2.5 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setBuilding(b)}
                    className={`flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-left ${
                      building?.bbl === b.bbl ? "text-accent" : ""
                    }`}
                    data-testid={`building-${b.bbl}`}
                  >
                    <span className="text-[0.9375rem] font-semibold">{b.address}</span>
                    <span className="code num text-[0.75rem] text-body">
                      {b.openClassC !== undefined
                        ? `${b.openClassC} open class C`
                        : b.bbl}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      {building ? (
        <form onSubmit={submit} className="border-t-2 border-ink pt-4">
          <h2 className="colhead">Start a case at {building.address}</h2>

          <label className="mt-3 block text-[0.8125rem] font-semibold">
            Apartment
            <input
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              required
              autoComplete="off"
              name="apartment"
              placeholder="4B"
              className="mt-1 block w-full border border-hair-strong bg-paper px-2.5 py-2 text-[0.9375rem] font-normal focus:border-accent"
            />
          </label>

          <label className="mt-3 block text-[0.8125rem] font-semibold">
            Condition
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value)}
              className="mt-1 block w-full border border-hair-strong bg-paper px-2.5 py-2 text-[0.9375rem] font-normal focus:border-accent"
            >
              {CONDITION_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-[0.8125rem] font-semibold">
            Reading (optional)
            <input
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="60F, measured 7am"
              className="mt-1 block w-full border border-hair-strong bg-paper px-2.5 py-2 text-[0.9375rem] font-normal focus:border-accent"
            />
          </label>

          <label className="mt-3 block text-[0.8125rem] font-semibold">
            What is happening
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={2}
              placeholder="No heat since Monday morning, eleven days now"
              className="mt-1 block w-full border border-hair-strong bg-paper px-2.5 py-2 text-[0.9375rem] font-normal focus:border-accent"
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 text-[0.8125rem] font-medium text-tier-out">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={busy} className="mt-4 w-full">
            {busy ? "Creating…" : "Create Case"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export default CreateCase;
