"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCase } from "./CaseProvider";
import { PartnerLink } from "./PartnerLink";
import { Button } from "@/components/ui/Button";
import { SourceNote } from "@/components/ui/SourceNote";
import { WebMCPTools } from "@/components/webmcp/WebMCPTools";
import { Report311Form } from "@/components/webmcp/Report311Form";
import type { BuildingRecord } from "@/lib/index";

const CONDITION_TYPES: { value: string; label: string }[] = [
  { value: "heat", label: "Heat" },
  { value: "hot_water", label: "Hot Water" },
  { value: "mold", label: "Mold" },
  { value: "pests", label: "Pests" },
  { value: "lead", label: "Lead" },
  { value: "gas", label: "Gas" },
];

/** A stream is either carrying versions or it is not. Say which, in one glyph and one word. */
function StreamDot({ state }: { state: "connecting" | "open" | "closed" }) {
  const colour =
    state === "open"
      ? "var(--color-tier-reliable)"
      : state === "connecting"
        ? "var(--color-tier-watch)"
        : "var(--color-tier-out)";
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colour }} aria-hidden />
      <span className="text-ink-soft">case {state}</span>
    </span>
  );
}

/** A panel on the docket: a hairline frame with a stated heading, never a floating card. */
function Panel({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-hair-strong bg-paper">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hair bg-paper-sunk px-3 py-1.5">
        <h2 className="colhead">{title}</h2>
        {meta ? <span className="text-[0.6875rem] text-ink-soft">{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

function BuildingRecordPanel({ record, bbl }: { record: BuildingRecord | null; bbl: string }) {
  if (!record) {
    return (
      <Panel title="Building record">
        <p className="px-3 py-3 text-[0.875rem] text-ink-soft">
          No building record for BBL {bbl} yet. The index has not covered this building.
        </p>
      </Panel>
    );
  }
  const { building, openClassC, openClassB, openClassA, oldestOpenDays, source } = record;
  return (
    <Panel title="Building record">
      <div className="grid grid-cols-3 gap-px border-b border-hair bg-hair">
        <div className="bg-paper px-3 py-2.5">
          <p className="colhead">Class C, out</p>
          <p className="num text-tier-out text-[1.5rem] font-bold">{openClassC}</p>
        </div>
        <div className="bg-paper px-3 py-2.5">
          <p className="colhead">Class B, watch</p>
          <p className="num text-tier-watch text-[1.5rem] font-bold">{openClassB}</p>
        </div>
        <div className="bg-paper px-3 py-2.5">
          <p className="colhead">Class A, reliable</p>
          <p className="num text-tier-reliable text-[1.5rem] font-bold">{openClassA}</p>
        </div>
      </div>
      <div className="border-b border-hair px-3 py-2.5 text-[0.8125rem]">
        Oldest open violation: <span className="num font-semibold">{oldestOpenDays}</span> days.
        {building.registration ? (
          <>
            {" "}
            Owner: <span className="font-semibold">{building.registration.ownerName}</span>, a
            portfolio of <span className="num font-semibold">{building.registration.portfolioBuildings}</span>{" "}
            buildings.
          </>
        ) : null}
      </div>
      <div className="px-3 py-2 text-[0.75rem] text-ink-soft">
        <SourceNote dataset={source.dataset} query={source.query} rows={source.rows}>
          HPD violation source
        </SourceNote>
      </div>
    </Panel>
  );
}

export function CaseView() {
  const { caseState, role, actions, partnerKey, stream, error } = useCase();

  const [busy, setBusy] = useState<string | null>(null);
  const [conditionType, setConditionType] = useState(CONDITION_TYPES[0].value);
  const [reading, setReading] = useState("");
  const [conditionNote, setConditionNote] = useState("");
  const [evidenceAsk, setEvidenceAsk] = useState("");
  const [note, setNote] = useState("");
  const [record, setRecord] = useState<BuildingRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);

  const open = caseState.evidenceRequests.filter((r) => r.status === "open");
  const draftPackets = caseState.packets.filter((p) => p.status === "draft");
  const filedPackets = caseState.packets.filter((p) => p.status === "filed");

  const guard = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } catch {
      /* error surfaces through the provider's error state */
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    let live = true;
    fetch(`/api/building/${encodeURIComponent(caseState.bbl)}`)
      .then((r) => (r.ok ? r.json() : { record: null }))
      .then((body: { record?: BuildingRecord }) => {
        if (live) setRecord(body.record ?? null);
      })
      .catch(() => {
        if (live) setRecord(null);
      })
      .finally(() => {
        if (live) setRecordLoading(false);
      });
    return () => {
      live = false;
    };
  }, [caseState.bbl]);

  return (
    <div>
      {/* The two roles must be unmistakable from across a room, not from a label. */}
      {role === "partner" ? (
        <div className="border-b border-ink bg-ink text-paper" data-testid="role-banner">
          <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-4 py-4 sm:px-8">
            <div>
              <h1 className="plate text-[1.5rem] sm:text-[1.875rem]">You are the advocate</h1>
              <p className="plate mt-1 text-[1.0625rem] text-paper/80">{caseState.title}</p>
            </div>
            <p className="max-w-sm text-[0.8125rem] leading-snug text-paper/75">
              You can assemble the HP Action packet and request evidence. The file_packet and
              log_condition tools are not registered in this window; the server refuses those
              actions from this session even if a call is forged.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[1360px] px-4 pb-24 sm:px-8">
        <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-ink py-3">
          <Link href="/" className="plate text-[1.0625rem] hover:text-accent">
            Order to Correct
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <StreamDot state={stream} />
            <span className="code num text-[0.6875rem] text-ink-subtle">v{caseState.version}</span>
          </div>
        </header>

        {role === "owner" ? (
          <div className="border-b border-hair py-4" data-testid="role-banner">
            <p className="colhead">You are the tenant</p>
            <h1 className="plate mt-1.5 text-[clamp(1.5rem,3.6vw,2.25rem)] text-balance">{caseState.title}</h1>
            <p className="mt-1.5 max-w-xl text-[0.8125rem] leading-snug text-ink-soft">
              You log conditions, answer evidence requests, draft the 311 complaint and file the
              HP Action packet. Your advocate assembles the packet and requests evidence; they
              cannot file it. Nothing here is legal advice, it is for review with your advocate.
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            aria-live="polite"
            className="mt-3 border border-tier-out bg-paper-sunk px-3 py-2 text-[0.8125rem] font-medium text-tier-out"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* ------------------------------- left column ------------------------------- */}
          <section aria-label="Case detail" className="flex flex-col gap-5">
            {recordLoading ? (
              <Panel title="Building record">
                <p className="px-3 py-3 text-[0.875rem] text-ink-soft">Loading…</p>
              </Panel>
            ) : (
              <BuildingRecordPanel record={record} bbl={caseState.bbl} />
            )}

            {/* --------------------------- conditions log --------------------------- */}
            <Panel
              title="Conditions log"
              meta={<span className="num">{caseState.conditions.length} entries</span>}
            >
              {caseState.conditions.length === 0 ? (
                <p className="px-3 py-3 text-[0.875rem] text-ink-soft">
                  No conditions logged yet. Log the first one below or tell your agent.
                </p>
              ) : (
                <ol>
                  {caseState.conditions.map((c) => (
                    <li key={c.id} className="border-b border-hair px-3 py-2.5 last:border-b-0" data-testid={`condition-${c.id}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="plate text-[0.9375rem]">
                          {c.type}
                          {c.reading ? ` (${c.reading})` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          {c.codeSection ? (
                            <span className="bg-accent-soft px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-accent">
                              {c.codeSection}
                            </span>
                          ) : null}
                          <time className="code num text-[0.6875rem] text-ink-subtle" dateTime={c.at}>
                            {new Date(c.at).toLocaleDateString("en-US")}
                          </time>
                        </div>
                      </div>
                      <p className="mt-1 text-[0.875rem]">{c.note}</p>
                    </li>
                  ))}
                </ol>
              )}
              {role === "owner" ? (
                <form
                  className="flex flex-col gap-2 border-t border-hair px-3 py-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!conditionNote.trim()) return;
                    const type = conditionType;
                    const readingVal = reading.trim() || undefined;
                    const noteVal = conditionNote.trim();
                    setConditionNote("");
                    setReading("");
                    void guard("condition", () => actions.logCondition(type, noteVal, readingVal));
                  }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={conditionType}
                      onChange={(e) => setConditionType(e.target.value)}
                      aria-label="Condition type"
                      className="rounded-control border border-hair-strong bg-paper px-2.5 py-2 text-[0.8125rem] focus:border-accent"
                    >
                      {CONDITION_TYPES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={reading}
                      onChange={(e) => setReading(e.target.value)}
                      placeholder="Reading, e.g. 58F…"
                      aria-label="Reading, optional"
                      className="num flex-1 rounded-control border border-hair-strong bg-paper px-2.5 py-2 text-[0.8125rem] focus:border-accent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={conditionNote}
                      onChange={(e) => setConditionNote(e.target.value)}
                      placeholder="What happened…"
                      aria-label="Describe what happened"
                      className="flex-1 rounded-control border border-hair-strong bg-paper px-2.5 py-2 text-[0.875rem] focus:border-accent"
                      data-testid="condition-note-input"
                    />
                    <Button type="submit" variant="primary" disabled={busy !== null || !conditionNote.trim()}>
                      {busy === "condition" ? "Logging…" : "Log"}
                    </Button>
                  </div>
                </form>
              ) : null}
            </Panel>

            {/* --------------------------- evidence requests --------------------------- */}
            <Panel
              title="Evidence requests"
              meta={<span className="num">{open.length} open</span>}
            >
              {caseState.evidenceRequests.length === 0 ? (
                <p className="px-3 py-3 text-[0.875rem] text-ink-soft">
                  No evidence requested yet. The advocate asks for what they need to build the
                  packet.
                </p>
              ) : (
                <ol>
                  {caseState.evidenceRequests.map((r) => (
                    <li key={r.id} className="border-b border-hair px-3 py-2.5 last:border-b-0" data-testid={`evidence-${r.id}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[0.875rem]">{r.ask}</p>
                        <span className="colhead">{r.status}</span>
                      </div>
                      {r.answer ? (
                        <p className="mt-1 border-t border-hair pt-1 text-[0.8125rem] text-ink-soft">
                          Answer: {r.answer}
                        </p>
                      ) : role === "owner" ? (
                        <EvidenceAnswerForm
                          requestId={r.id}
                          busy={busy}
                          onSubmit={(answer) => guard(`ev-${r.id}`, () => actions.answerEvidence(r.id, answer))}
                        />
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
              {role === "partner" ? (
                <form
                  className="flex gap-2 border-t border-hair px-3 py-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!evidenceAsk.trim()) return;
                    const ask = evidenceAsk.trim();
                    setEvidenceAsk("");
                    void guard("evidence", () => actions.requestEvidence(ask));
                  }}
                >
                  <input
                    value={evidenceAsk}
                    onChange={(e) => setEvidenceAsk(e.target.value)}
                    placeholder="Ask for a photo, a reading…"
                    aria-label="Ask the tenant for evidence"
                    className="flex-1 rounded-control border border-hair-strong bg-paper px-2.5 py-2 text-[0.875rem] focus:border-accent"
                    data-testid="evidence-ask-input"
                  />
                  <Button type="submit" disabled={busy !== null || !evidenceAsk.trim()}>
                    {busy === "evidence" ? "Asking…" : "Ask"}
                  </Button>
                </form>
              ) : null}
            </Panel>

            {/* --------------------------- HP Action packet --------------------------- */}
            <Panel
              title="HP Action packet"
              meta={
                <span>
                  {filedPackets.length > 0 ? (
                    <span className="text-tier-reliable font-semibold">Filed</span>
                  ) : draftPackets.length > 0 ? (
                    <span className="text-tier-watch font-semibold">Draft</span>
                  ) : (
                    <span className="text-ink-soft">None yet</span>
                  )}
                </span>
              }
            >
              {caseState.packets.length === 0 ? (
                <div className="px-3 py-3 text-[0.875rem] text-ink-soft">
                  No packet assembled yet.{" "}
                  {role === "partner"
                    ? "Assemble one from your agent when there is enough logged."
                    : "Your advocate assembles this from their session."}
                </div>
              ) : (
                [...caseState.packets].reverse().map((p) => (
                  <div key={p.id} className="border-b border-hair last:border-b-0" data-testid={`packet-${p.id}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 bg-paper-sunk px-3 py-1.5">
                      <span className="colhead">
                        {p.status === "filed" ? "Filed" : "Draft"} · {p.sections.length} sections
                      </span>
                      <time className="code num text-[0.6875rem] text-ink-subtle" dateTime={p.filedAt ?? p.createdAt}>
                        {new Date(p.filedAt ?? p.createdAt).toLocaleString("en-US")}
                      </time>
                    </div>
                    <dl className="px-3 py-2.5">
                      {p.sections.map((s) => (
                        <div key={s.heading} className="border-b border-hair py-2 last:border-b-0">
                          <dt className="colhead">{s.heading}</dt>
                          <dd className="mt-1 whitespace-pre-line text-[0.8125rem] leading-snug">{s.body}</dd>
                        </div>
                      ))}
                    </dl>
                    {role === "owner" && p.status === "draft" ? (
                      <div className="border-t border-hair px-3 py-2">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={busy !== null}
                          onClick={() => guard(`file-${p.id}`, () => actions.filePacket())}
                          data-testid={`file-packet-${p.id}`}
                        >
                          {busy === `file-${p.id}` ? "Filing…" : "File the Packet"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </Panel>

            {role === "owner" ? <Report311Form actions={actions} /> : null}

            {role === "owner" ? <PartnerLink caseId={caseState.id} partnerKey={partnerKey} /> : null}
          </section>

          {/* -------------------------------- right column -------------------------------- */}
          <section aria-label="Timeline and tools" className="flex flex-col gap-5">
            <Panel title="Timeline" meta={<span className="num">{caseState.notes.length} entries</span>}>
              <ol className="max-h-80 overflow-y-auto" data-testid="timeline">
                {caseState.notes.length === 0 ? (
                  <li className="px-3 py-2.5 text-[0.8125rem] text-ink-soft">
                    Nothing has happened on this case yet.
                  </li>
                ) : (
                  [...caseState.notes].reverse().map((e, i) => (
                    <li
                      key={`${e.at}-${i}`}
                      className="grid grid-cols-[4.25rem_1fr] gap-x-3 border-b border-hair px-3 py-2 text-[0.8125rem] last:border-b-0"
                    >
                      <time className="code num text-[0.6875rem] text-ink-subtle" dateTime={e.at}>
                        {new Date(e.at).toLocaleTimeString("en-US", { hour12: false })}
                      </time>
                      <div className="min-w-0">
                        <span className="colhead">{e.by === "owner" ? "tenant" : e.by === "partner" ? "advocate" : e.by}</span>
                        <p className="mt-0.5 leading-snug">{e.text}</p>
                      </div>
                    </li>
                  ))
                )}
              </ol>
              <form
                className="flex gap-2 border-t border-hair px-3 py-2"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  if (!note.trim()) return;
                  const text = note.trim();
                  setNote("");
                  void guard("note", () => actions.addNote(text));
                }}
              >
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note both windows can read…"
                  aria-label="Add a note to the shared timeline"
                  className="flex-1 rounded-control border border-hair-strong bg-paper px-2.5 py-1.5 text-[0.8125rem] focus:border-accent"
                  data-testid="note-input"
                />
                <Button type="submit" disabled={busy !== null}>
                  Add
                </Button>
              </form>
            </Panel>

            <WebMCPTools role={role} caseState={caseState} actions={actions} partnerKey={partnerKey} reportForm={false} />
          </section>
        </div>
      </div>
    </div>
  );
}

function EvidenceAnswerForm({
  requestId,
  busy,
  onSubmit,
}: {
  requestId: string;
  busy: string | null;
  onSubmit: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  return (
    <form
      className="mt-2 flex gap-2 border-t border-hair pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!answer.trim()) return;
        const value = answer.trim();
        setAnswer("");
        onSubmit(value);
      }}
    >
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Your answer…"
        aria-label={`Answer evidence request ${requestId}`}
        className="flex-1 rounded-control border border-hair-strong bg-paper px-2.5 py-1.5 text-[0.8125rem] focus:border-accent"
      />
      <Button type="submit" disabled={busy !== null || !answer.trim()}>
        {busy === `ev-${requestId}` ? "Sending…" : "Answer"}
      </Button>
    </form>
  );
}

export default CaseView;
