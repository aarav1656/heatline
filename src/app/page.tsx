import type { Metadata } from "next";
import { CreateCase } from "@/components/case/CreateCase";

export const metadata: Metadata = {
  title: "Order to Correct",
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 pb-24 sm:px-8">
      <header className="border-b border-ink pb-6 pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <h1 className="plate text-[clamp(2rem,5vw,3rem)] text-balance">Order to Correct</h1>
          <p className="colhead">tenant · advocate · one case</p>
        </div>
        <p className="mt-3 max-w-xl text-[1.0625rem] leading-snug text-pretty">
          A tenant at 68°F for eleven mornings, a landlord silent since January, nine open class C
          violations already on the building. Start a case, then open it as the tenant and as the
          advocate in two tabs. Each session registers a different WebMCP tool set on the same
          page: the tenant&rsquo;s agent logs conditions, drafts the 311 complaint, and files the
          HP Action packet; the advocate&rsquo;s agent assembles the packet and requests evidence.
          Every write is confirmed by a person before it happens.
        </p>
      </header>

      <section className="mt-8" aria-label="Start a case">
        <CreateCase />
      </section>

      <section className="mt-8 border border-hair-strong bg-paper-sunk" aria-label="How this works">
        <div className="grid gap-6 px-4 py-4 lg:grid-cols-2">
          <div>
            <h2 className="plate text-[1.0625rem]">Capability keys, not roles</h2>
            <p className="mt-2 max-w-lg text-[0.875rem] leading-snug text-ink-soft">
              Creating a case mints two unguessable tokens, a tenant key and an advocate key. The
              URL you open with (<code className="code text-ink">?k=</code>) decides your role;
              the server derives it from which key matches, never from a self-declared label. A
              guessed or edited key gets no role at all.
            </p>
          </div>
          <div>
            <h2 className="plate text-[1.0625rem]">Confirm before every mutation</h2>
            <p className="mt-2 max-w-lg text-[0.875rem] leading-snug text-ink-soft">
              Every write tool suspends behind an in-page card until a human presses Confirm. The
              declarative 311 complaint form (
              <code className="code text-ink">draft_311_complaint</code>) carries no{" "}
              <code className="code text-ink">toolautosubmit</code>: an agent fills it, the tenant
              sends it.
            </p>
          </div>
        </div>
        <div className="border-t border-hair px-4 py-3 text-[0.8125rem] text-ink-soft">
          See <code className="code text-ink">README.md</code> for the data sources, the tool
          list per role, and how to run this locally. Nothing here is legal advice; every case is
          for review with your advocate.
        </div>
      </section>
    </main>
  );
}
