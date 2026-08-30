// The chain of custody, as pure logic. No filesystem, no node imports: this
// module is loaded by the BROWSER as well as the server, because the client
// replays events through the same reducer and must reach the same tier.
//
//   open           nobody has said anything yet
//   claimed        THE BUILDER says it is done. The agent that wrote it.
//   verified       THE JUDGE says it is proven. Sentinel, or whatever gate ran.
//   fully-verified THE OPERATOR says he accepts it. A human, once, by hand.
//
// The rule that makes the ladder mean anything: no party can grant its own tier,
// and the ladder is climbed in order. A judge cannot verify what nobody claimed,
// and the operator cannot accept what no judge passed, so a stray file can never
// promote work that was never built.

export const TIERS = ['open', 'claimed', 'verified', 'fully-verified'];
export const tierRank = (s) => Math.max(0, TIERS.indexOf(String(s || 'open')));

// A sign-off has to say WHAT was signed, not just which id. Two holes opened
// either side of that, and they are the same hole seen from opposite ends:
//
//   Renaming a step voided its custody. An id derived from the title changes
//   when the title changes, so a step the judge had passed and the operator had
//   accepted quietly dropped to open on a wording edit — and he was promised
//   that renaming a step renames its moon, so renaming is a NORMAL act here.
//
//   Flipping a step done -> planned -> done resurrected the acceptance. The row
//   in accepted.json survives, so the BUILDER alone, editing only its own file,
//   could restore the operator's top tier to work he had never seen. That is
//   precisely what "no party grants its own tier" exists to forbid.
//
// So a sign-off carries a fingerprint of the thing it signed. If the step no
// longer matches, the sign-off is STALE: it does not apply, and it is reported
// rather than dropped, because a sign-off that silently evaporates and one that
// silently persists are both worse than one that says what happened.
export function fingerprint(step) {
  const src = `${step && step.id}\u0000${step && step.title}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

// `withdrawnAt` is an ISO stamp of the last time the builder was OBSERVED taking
// a claim back. A hash cannot see this: withdrawing a claim and re-making it
// leaves the step's id and title untouched, so the operator's acceptance simply
// re-applied and the builder alone had restored the top tier on work he had
// never seen a second time. It is a fact about history, so it has to be recorded
// when it happens rather than derived from the file afterwards.
export function tierFor(stepStatus, verdict, accepted, step = null, withdrawnAt = null) {
  const claimed = stepStatus === 'done';
  if (!claimed) return { tier: 'open', by: null };
  const fp = step ? fingerprint(step) : null;

  // A row with no fingerprint predates this and is honoured, so nothing already
  // signed is invalidated; anything written from here on carries one.
  const vStale = !!(verdict && verdict.fp && fp && verdict.fp !== fp);
  // A rejection is not a rung. The builder still claims it, so the tier is
  // still `claimed`; what changes is that a judge HAS looked, and said no.
  const failed = !!(verdict && verdict.pass === false && !vStale);
  if (!verdict || vStale || failed) {
    return {
      tier: 'claimed', by: 'the builder',
      staleVerdict: vStale || undefined,
      failedBy: failed ? verdict.by : undefined,
      failedNote: failed ? verdict.note : undefined,
    };
  }
  const aStale = !!(accepted && (
    (accepted.fp && fp && accepted.fp !== fp) ||
    (accepted.onVerdict && verdict.at && accepted.onVerdict !== verdict.at) ||
    (withdrawnAt && accepted.at && withdrawnAt > accepted.at)));
  if (!accepted || aStale) {
    return { tier: 'verified', by: verdict.by, staleAccept: aStale || undefined };
  }
  return { tier: 'fully-verified', by: accepted.by };
}
