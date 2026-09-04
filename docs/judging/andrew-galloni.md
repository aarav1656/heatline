# Judge: Andrew Galloni (VP Research & Innovation, Cloudflare)

Lens: trust boundaries: what an untrusted agent can and cannot do, rate limits, the denied
path being real.

## 1. What I did

Treated this exactly like an agent traffic problem: could a hostile or merely buggy agent, on
either side of this shared case, do something the product claims it can't. Every test below
was a real HTTP request against the live deployment, not a read of the code.

**Role boundary, forged, not just role-hidden:**

```
advocate key -> file_packet: 403 "Only the tenant can file packet. You are the advocate:
  this stays with the tenant's session."
tenant key -> assemble_packet: 403 "Only the advocate can assemble packet. You are the
  tenant: ask your advocate to do this from their session."
```

**Credential boundary, a guessed key:**

```
bogus key -> add_note: 403 "This link's key does not match this case. Use the tenant or
  advocate URL exactly as it was shared; a guessed or edited key is not a valid credential."
```

Note what this message does *not* say: it doesn't say "invalid role" or "forbidden," which
would leak that the key format was at least structurally plausible. It treats an unrecognized
key as simply unauthenticated, which is the right posture (no oracle for key-guessing).

**Input-size boundary:**

```
600-char note -> 400 "note text is 600 characters, over the 500-character limit. Shorten it
  and try again."
```

**Nonexistent resource:**

```
unknown case id -> 404 "No case with id \"bogus-id-xyz\"."
```

**Rate limit, burst-tested live, not just read from the source:** fired 65 consecutive
`add_note` calls with a valid owner key against the same case in one shell loop. Requests 1-60
returned `200`. Request 61 returned:

```
HTTP 429
{"error":"Too many case actions from this address. Wait a moment and try again."}
```

Matches the code comment in `src/app/api/case/[id]/action/route.ts` exactly (60 requests per
60-second window, checked once per IP and once per case id). This is a real, live-triggered
ceiling, not a documented-but-unverified one, and its message tells the caller what to do
(wait) rather than just refusing.

Read `src/lib/store/ratelimit.ts` for the failure mode of the limiter itself: it's a fixed-
window Redis `INCR`/`EXPIRE` with an explicitly acknowledged race ("two concurrent requests
can both read count N and both proceed"), documented as an accepted trade rather than hidden,
and it falls back to an in-memory counter (not silently disabled) when no KV is configured, so
the rate limit is never a single point that just stops working.

## 2. Scores (1-5)

- **WebMCP Leverage: 4.** The trust boundary is enforced identically whether a call comes
  through a registered `document.modelContext` tool or a forged, bare HTTP request with no
  browser at all, which is exactly the property that matters for an agent that might not be
  the well-behaved one the WebMCP tool list assumes.
- **Execution: 5.** Every boundary I tried to cross live (role, credential, size, existence,
  rate) held, with the rate limit specifically verified by actually hitting it, not inferred.
- **Potential Impact: 4.** A legal-aid advocate and a tenant sharing one link-based capability
  system, where a forged or guessed key gets nothing and an over-eager agent gets throttled
  rather than allowed to hammer the case, is the trust model this exact kind of app needs in
  production, not just for a demo.
- **Creativity & Ambition: 3.** The trust engineering is strong; the underlying concept
  (shared case link with capability keys) is a known, sound pattern rather than a novel one.

**Total: 16/20.**

## 3. One thing that would move my score up a point

The rate limiter's own comment admits a check-then-act race under concurrency ("two concurrent
requests can both read count N and both proceed"). For a case-scoped limit specifically, that
race is exploitable by a caller firing genuinely parallel requests rather than a sequential
burst (which is all I tested here). Either accept a small over-limit burst explicitly in the
docs, or move the case-scoped check to a Lua/atomic increment-and-compare instead of
`INCR` then read. File: `src/lib/store/ratelimit.ts`.

## 4. One thing that would make me distrust the submission

None found. Every trust-boundary claim in the docs was independently reproducible against the
live deployment with no browser and no cooperation from the app beyond a plain HTTP client.
