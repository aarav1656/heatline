"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Tenant only: the URL that opens this case in the advocate's session. */
export function PartnerLink({ caseId, partnerKey }: { caseId: string; partnerKey?: string }) {
  const [copied, setCopied] = useState(false);

  if (!partnerKey) {
    return (
      <section className="border-t border-ink">
        <h2 className="colhead py-2">Advocate link</h2>
        <p className="py-2.5 text-[0.75rem] leading-snug text-body">
          The advocate key for this case is not available in this session.
        </p>
      </section>
    );
  }

  const path = `/c/${caseId}?k=${partnerKey}`;
  const href = typeof window === "undefined" ? path : `${window.location.origin}${path}`;

  return (
    <section className="border-t border-ink">
      <h2 className="colhead py-2">Advocate link</h2>
      <div className="flex flex-wrap items-center gap-2 py-2.5">
        <code className="code min-w-0 flex-1 break-all text-[0.6875rem] text-body">{href}</code>
        <Button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(href);
            } catch {
              /* clipboard blocked: the URL is on screen to copy by hand */
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <a
          href={path}
          className="inline-flex items-center border border-hair-strong bg-paper px-3.5 py-2 text-[0.8125rem] font-semibold transition-colors duration-150 hover:border-ink"
        >
          Open
        </a>
      </div>
      <p className="border-t border-hair py-2 text-[0.75rem] leading-snug text-body">
        Whoever opens this gets the advocate session. Their agent can assemble the HP Action
        packet and request evidence; the file_packet and log_condition tools are never registered
        in that window, and the server rejects those actions from an advocate even if forged.
      </p>
    </section>
  );
}

export default PartnerLink;
