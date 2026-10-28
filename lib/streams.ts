/** A fresh Bandcamp stream for a drop whose stored one stopped playing (see /api/media/refresh), or null. */
export async function refreshDropStream(dropId: string): Promise<string | null> {
  const res = await fetch("/api/media/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dropId: Number(dropId) }),
  });
  return res.ok ? ((await res.json()) as { streamUrl: string }).streamUrl : null;
}
