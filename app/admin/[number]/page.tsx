import Link from "next/link";
import { notFound } from "next/navigation";
import { listDrops, listQrCodes } from "@/lib/admin";
import { padNumber } from "@/lib/format";
import { deleteDropAction } from "../actions";
import { adminStyles as s } from "../styles";

/** One shirt's current bag, with everything we store — coordinates included. */
export default async function AdminBagPage({ params }: PageProps<"/admin/[number]">) {
  const number = Number((await params).number);
  const code = (await listQrCodes()).find((c) => c.number === number);
  if (!code) notFound();
  const drops = code.bagId ? await listDrops(code.bagId) : [];
  return (
    <main style={s.page}>
      <Link href="/admin" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
        ← All shirts
      </Link>
      <h1 style={s.h1}>
        #{padNumber(number)} {code.handle ? code.handle : ""}
      </h1>
      <table style={s.table}>
        <thead>
          <tr>
            {["When", "Track", "Dropped by", "From", "GPS", ""].map((h) => (
              <th key={h} style={s.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drops.map((d) => (
            <tr key={d.id}>
              <td style={s.td}>{d.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
              <td style={s.td}>
                <a href={d.url} target="_blank" rel="noreferrer">
                  {d.artist} – {d.title}
                </a>{" "}
                ({d.provider})
              </td>
              <td style={s.td}>{d.droppedBy}</td>
              <td style={s.td}>{d.droppedFrom}</td>
              <td style={s.td}>{d.lat != null && d.lng != null ? `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}` : "—"}</td>
              <td style={s.td}>
                <form action={deleteDropAction}>
                  <input type="hidden" name="dropId" value={d.id} />
                  <input type="hidden" name="number" value={number} />
                  <button style={{ ...s.button, background: "var(--signal-error)" }}>Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {drops.length === 0 && <p style={{ margin: 0, fontFamily: "var(--font-mono)" }}>No drops yet.</p>}
    </main>
  );
}
