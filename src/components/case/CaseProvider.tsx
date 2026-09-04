"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CaseState, Role } from "@/lib/types";
import type { CaseActions } from "@/lib/webmcp/contracts";
import { unspotlight } from "@/lib/spotlight";

/**
 * The case SSE stream spotlights free text the same way the read tools do, so any other reader
 * of that endpoint gets the untrusted-content boundary. This page is a trusted first-party human
 * reader, not a model, so it undoes the wrapping before the text ever reaches a component: a
 * person should see their note, not `<untrusted-user-text>` markup around it. `initialCase`
 * (server-rendered, via plain `stripKeys`) never carried the wrapper in the first place;
 * `unspotlight` is a no-op on text that isn't wrapped, so re-applying it here is safe either way.
 */
function unspotlightCase(caseState: CaseState): CaseState {
  return {
    ...caseState,
    notes: caseState.notes.map((n) => ({ ...n, text: unspotlight(n.text) })),
    conditions: caseState.conditions.map((c) => ({ ...c, note: unspotlight(c.note) })),
    evidenceRequests: caseState.evidenceRequests.map((r) => ({
      ...r,
      ask: unspotlight(r.ask),
      answer: r.answer !== undefined ? unspotlight(r.answer) : undefined,
    })),
  };
}

export type CaseContextValue = {
  caseState: CaseState;
  role: Role;
  actions: CaseActions;
  /** The tenant's one-time view of the advocate's key, known to the owner session only. */
  partnerKey?: string;
  stream: "connecting" | "open" | "closed";
  error: string | null;
};

const CaseContext = createContext<CaseContextValue | null>(null);

export function useCase(): CaseContextValue {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase() must be called inside <CaseProvider>.");
  return ctx;
}

async function postAction(
  caseId: string,
  type: string,
  key: string,
  payload: Record<string, unknown>,
): Promise<CaseState> {
  const res = await fetch(`/api/case/${caseId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, key, payload }),
  });
  const body = (await res.json()) as { case?: CaseState; error?: string };
  if (!res.ok || !body.case) {
    throw new Error(body.error ?? `The server rejected ${type} with HTTP ${res.status}.`);
  }
  return body.case;
}

export function CaseProvider({
  caseId,
  role,
  sessionKey,
  partnerKey,
  initialCase,
  children,
}: {
  caseId: string;
  role: Role;
  /** This session's own capability key (the `?k=` it opened with). Sent with every action. */
  sessionKey: string;
  /** The tenant session's one-time view of the advocate's key, for PartnerLink and share_case. */
  partnerKey?: string;
  initialCase: CaseState;
  children: ReactNode;
}) {
  const [caseState, setCaseState] = useState<CaseState>(initialCase);
  const [stream, setStream] = useState<CaseContextValue["stream"]>("connecting");
  const [error, setError] = useState<string | null>(null);

  const versionRef = useRef(initialCase.version);
  const apply = useCallback((next: CaseState) => {
    if (next.version < versionRef.current) return;
    versionRef.current = next.version;
    setCaseState(unspotlightCase(next));
  }, []);

  /*
   * Case SSE: the tenant sees the advocate's evidence request without reloading, in a background
   * tab as much as a foreground one, so this stream is never dropped while the page is open.
   */
  useEffect(() => {
    let stopped = false;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const disconnect = () => {
      source?.close();
      source = null;
      setStream("closed");
    };

    const connect = () => {
      if (stopped || source) return;
      setStream("connecting");
      const es = new EventSource(`/api/case/${caseId}/stream`);
      source = es;
      es.addEventListener("open", () => setStream("open"));
      es.addEventListener("case", (e) => {
        apply(JSON.parse((e as MessageEvent).data) as CaseState);
        setStream("open");
      });
      es.addEventListener("end", () => {
        disconnect();
        retry = setTimeout(connect, 500);
      });
      es.addEventListener("error", () => setStream("closed"));
    };

    connect();

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      disconnect();
    };
  }, [caseId, apply]);

  const run = useCallback(
    async (type: string, payload: Record<string, unknown>) => {
      setError(null);
      try {
        const next = await postAction(caseId, type, sessionKey, payload);
        apply(next);
        return next;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [caseId, sessionKey, apply],
  );

  const actions = useMemo<CaseActions>(
    () => ({
      async createCase(input) {
        const res = await fetch("/api/case", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const body = (await res.json()) as {
          case?: CaseState;
          ownerUrl?: string;
          partnerUrl?: string;
          error?: string;
        };
        if (!res.ok || !body.case || !body.ownerUrl || !body.partnerUrl) {
          throw new Error(body.error ?? `Creating the case failed with HTTP ${res.status}.`);
        }
        return { ...body.case, ownerUrl: body.ownerUrl, partnerUrl: body.partnerUrl };
      },
      logCondition: (type, note, reading, codeSection) =>
        run("log_condition", { type, note, reading, codeSection }),
      requestEvidence: (ask) => run("request_evidence", { ask }),
      answerEvidence: (requestId, answer) => run("answer_evidence", { requestId, answer }),
      assemblePacket: (sections) => run("assemble_packet", { sections }),
      filePacket: () => run("file_packet", {}),
      addNote: (text) => run("add_note", { text }),
      draft311: (conditionType, description) => run("draft_311", { conditionType, description }),
    }),
    [run],
  );

  const value = useMemo<CaseContextValue>(
    () => ({ caseState, role, actions, partnerKey, stream, error }),
    [caseState, role, actions, partnerKey, stream, error],
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}
