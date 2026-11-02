/**
 * Grades one Piper reply against its label in piper.json. Fixed checks only (no model), so a
 * score means the same thing from run to run. Returns the reasons it failed; empty = pass.
 */

type Text = string | string[];

export type Expectation = {
  /** Exactly these proposals, in any order; only the listed fields are compared. */
  actions: Record<string, unknown>[];
  /** Each entry must appear in the reply; a list means any one of them. */
  mention?: Text[];
  avoid?: string[];
  avoidPattern?: string;
};

export type PiperResult = {
  reply: string;
  actions: Record<string, unknown>[];
};

// The chat shows plain text, and a proposal is only a button until the user taps it.
const MARKDOWN = /\*\*|^#{1,6}\s|^\|/m;
const CLAIMS_SAVED =
  /\b(i'?ve|i have|i) (just )?(added|marked|updated|recorded|saved|set(?! up))\b|^done\b/im;

const norm = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;
const has = (reply: string, text: string) =>
  reply.toLowerCase().includes(text.toLowerCase());

function matches(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
) {
  return Object.entries(expected).every(
    ([key, value]) => norm(actual[key] ?? null) === norm(value),
  );
}

export function gradePiper(result: PiperResult, expect: Expectation): string[] {
  const failures: string[] = [];
  const { reply, actions } = result;

  const unmatched = [...actions];
  for (const wanted of expect.actions) {
    const i = unmatched.findIndex((a) => matches(a, wanted));
    if (i === -1) failures.push(`missing action ${JSON.stringify(wanted)}`);
    else unmatched.splice(i, 1);
  }
  for (const extra of unmatched)
    failures.push(`unexpected action ${JSON.stringify(extra)}`);

  for (const entry of expect.mention ?? []) {
    const options = Array.isArray(entry) ? entry : [entry];
    if (!options.some((text) => has(reply, text)))
      failures.push(`doesn't mention ${options.join(" / ")}`);
  }
  for (const text of expect.avoid ?? [])
    if (has(reply, text)) failures.push(`mentions "${text}"`);
  if (expect.avoidPattern && new RegExp(expect.avoidPattern).test(reply))
    failures.push(`matches /${expect.avoidPattern}/`);

  if (MARKDOWN.test(reply)) failures.push("uses markdown");
  if (CLAIMS_SAVED.test(reply)) failures.push("claims a change was saved");
  return failures;
}
