/** Lower case, accents off: "Prząśniczka" → "przasniczka". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/g, "l").toLowerCase();

/** `a` and `b` are at most one typo apart: a letter changed, missing or extra. */
function oneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/**
 * Every word of `query` is found in one of `fields`: inside it as typed, or, from four letters on,
 * as the start of a word with one typo ("fishman", "fsihmans", "przasn" all find Fishmans and
 * Prząśniczka). Case and accents don't count. An empty query matches everything.
 */
export function fuzzyMatch(query: string, fields: (string | null | undefined)[]): boolean {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const texts = fields.filter((f): f is string => !!f).map(fold);
  const words = texts.flatMap((t) => t.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  return tokens.every(
    (tok) =>
      texts.some((t) => t.includes(tok)) ||
      (tok.length >= 4 && words.some((w) => [-1, 0, 1].some((d) => oneEdit(tok, w.slice(0, tok.length + d))))),
  );
}
