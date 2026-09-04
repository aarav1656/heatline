/**
 * Rendered when a case page's `?k=` does not match either of the case's capability
 * keys (missing, mistyped, or guessed). No case data reaches this response: the
 * server resolves role from the key before any case content is composed.
 */
export function InvalidLink() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[560px] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 border-2 border-ink px-6 py-8 text-center">
        <p className="colhead text-tier-out">invalid link</p>
        <h1 className="plate text-[1.75rem]">This link is not valid</h1>
        <p className="max-w-sm text-[0.875rem] leading-snug text-body">
          The key in this URL does not match either the tenant or the advocate link for this
          case. Use the exact URL you were given, not a guessed or edited one.
        </p>
      </div>
    </div>
  );
}

export default InvalidLink;
