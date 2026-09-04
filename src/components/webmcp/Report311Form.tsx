"use client";

import { useEffect, useState } from "react";
import type { CaseActions } from "@/lib/webmcp/contracts";
import styles from "./tool-form.module.css";

const TOOL_NAME = "draft_311_complaint";
const TOOL_DESCRIPTION =
  "Draft a 311 HEAT/HOT WATER complaint: a condition type and a description. The tenant reads the filled form and presses Send; it is never submitted automatically.";

const CONDITION_TYPES: { value: string; label: string }[] = [
  { value: "heat", label: "Heat" },
  { value: "hot_water", label: "Hot Water" },
  { value: "mold", label: "Mold" },
  { value: "pests", label: "Pests" },
  { value: "lead", label: "Lead" },
  { value: "gas", label: "Gas" },
];

/**
 * The declarative half of the demo: a real <form> carrying `toolname` / `tooldescription` /
 * `toolparamdescription`. The browser synthesises the input schema from the controls and
 * registers the tool itself, so there is no registerTool call here.
 *
 * There is deliberately NO `toolautosubmit`. Without it the agent fills the fields, the browser
 * focuses the submit button, and a human has to press it. That is WebMCP's built-in
 * human-in-the-loop for declarative tools: any write an agent should never be able to send on
 * its own goes through a form shaped like this one, not through registerTool.
 *
 * Render only in the tenant (owner) session. SIMULATED: this drafts a complaint on the shared
 * case timeline, it does not file anything with NYC 311.
 */
export function Report311Form({ actions }: { actions: CaseActions }) {
  const [agentFilled, setAgentFilled] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const onActivated = (event: Event) => {
      if ((event as Event & { toolName?: string }).toolName === TOOL_NAME) setAgentFilled(true);
    };
    const onCancel = (event: Event) => {
      if ((event as Event & { toolName?: string }).toolName === TOOL_NAME) setAgentFilled(false);
    };
    window.addEventListener("toolactivated", onActivated);
    window.addEventListener("toolcancel", onCancel);
    return () => {
      window.removeEventListener("toolactivated", onActivated);
      window.removeEventListener("toolcancel", onCancel);
    };
  }, []);

  async function send(form: HTMLFormElement) {
    const data = new FormData(form);
    const conditionType = String(data.get("conditionType") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    if (!conditionType || !description) {
      throw new Error("Both the condition type and the description are required.");
    }
    const caseState = await actions.draft311(conditionType, description);
    return {
      filed: true,
      conditionType,
      complaintCount: caseState.complaints.length,
      note: "This is a draft on the shared case, not a real 311 filing. For review with your advocate.",
    };
  }

  return (
    <form
      toolname={TOOL_NAME}
      tooldescription={TOOL_DESCRIPTION}
      className={`${styles.toolForm} ${agentFilled ? styles.agentFilled : ""} p-4`}
      onSubmit={(event) => {
        const native = event.nativeEvent as SubmitEvent;
        event.preventDefault();
        const form = event.currentTarget;
        const done = send(form).then(
          (result) => {
            setAgentFilled(false);
            setStatus(`Drafted a ${result.conditionType} complaint.`);
            form.reset();
            return result;
          },
          (error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            setStatus(message);
            throw new Error(`The complaint was not drafted: ${message}`);
          }
        );
        // Hand the structured result straight back to the agent that filled the form,
        // instead of navigating. respondWith is the mechanism Chrome documents today.
        if (native.agentInvoked && native.respondWith) native.respondWith(done);
        else void done.catch(() => undefined);
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="colhead">311 complaint</h2>
        <span className="border border-sim px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-sim">
          Simulated
        </span>
      </div>

      <label className="mt-3 block text-[0.8125rem] font-semibold">
        Condition
        <select
          name="conditionType"
          required
          defaultValue={CONDITION_TYPES[0].value}
          toolparamdescription="The kind of condition this complaint is about."
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
        Description
        <textarea
          name="description"
          required
          rows={3}
          toolparamdescription="What happened, in the tenant's own words."
          placeholder="No heat since Monday morning, apartment reads 58F…"
          className="mt-1 block w-full border border-hair-strong bg-paper px-2.5 py-2 text-[0.9375rem] font-normal focus:border-accent"
        />
      </label>

      <button
        type="submit"
        className={`${styles.submit} mt-4 w-full bg-accent px-4 py-2.5 text-[0.9375rem] font-semibold text-paper transition-transform duration-150 active:scale-[0.97]`}
      >
        Send to 311 (simulated)
      </button>

      {status && <p className="code mt-2 text-[0.6875rem]" aria-live="polite">{status}</p>}
    </form>
  );
}

export default Report311Form;
