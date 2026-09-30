import { padNumber } from "@/lib/format";

export const metadata = { title: "Not open yet · drop-a-track" };

/** A shirt that's printed but not handed out yet: no handle, no drops. */
export default async function ClosedPage({ searchParams }: PageProps<"/closed">) {
  const n = Number((await searchParams).n);
  return (
    <main style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "var(--paper)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 0.85 }}>
        DROP A<br />
        TRACK
      </div>
      {Number.isInteger(n) && n > 0 ? (
        <div style={{ fontFamily: "var(--font-display)", fontSize: 72, lineHeight: 0.8, color: "transparent", WebkitTextStroke: "2px var(--ink)" }}>
          #{padNumber(n)}
        </div>
      ) : null}
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: "normal", fontSize: 44, lineHeight: 0.82, letterSpacing: "-0.02em" }}>
        THIS BAG ISN{"’"}T OPEN YET.
      </h1>
      <p style={{ margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>Nobody wears this shirt yet. Try the next one you see.</p>
    </main>
  );
}
