/** A copy of `list` in a random order (Fisher–Yates). */
export function shuffle<T>(list: T[]): T[] {
  const s = [...list];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}
