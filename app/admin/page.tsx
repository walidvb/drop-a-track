import Link from "next/link";
import { ShirtQr } from "@/components/ShirtQr";
import { qrUrl } from "@/lib/qr";
import { listQrCodes } from "@/lib/admin";
import { padNumber } from "@/lib/format";
import { bagPath } from "@/lib/handle";
import { assignHandleAction, createQrCodesAction } from "./actions";
import { adminStyles as s } from "./styles";

export const metadata = { title: "Admin · drop-a-track" };

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { error } = await searchParams;
  const codes = await listQrCodes();
  const base = process.env.NEXT_PUBLIC_QR_BASE_URL;
  return (
    <main style={s.page}>
      <h1 style={s.h1}>SHIRTS</h1>
      {!base && (
        <p style={s.warn}>NEXT_PUBLIC_QR_BASE_URL is not set: these QRs use a placeholder domain. Don{"’"}t print them.</p>
      )}
      {typeof error === "string" && (
        <p role="alert" style={s.warn}>
          {error}
        </p>
      )}
      <form action={createQrCodesAction} style={s.row}>
        <input name="count" type="number" min={1} max={100} defaultValue={1} style={{ ...s.input, width: 80 }} />
        <button style={s.button}>Create QR codes</button>
      </form>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>#</th>
            <th style={s.th}>QR</th>
            <th style={s.th}>Handle</th>
            <th style={s.th}>Theme</th>
            <th style={s.th}>Drops</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id}>
              <td style={s.td}>
                <Link href={`/admin/${c.number}`}>#{padNumber(c.number)}</Link>
              </td>
              <td style={s.td}>
                <ShirtQr base={base ?? "https://example.invalid"} token={c.token} number={c.number} />
                <code style={s.code}>{qrUrl(base ?? "https://example.invalid", c.token)}</code>
              </td>
              <td style={s.td}>
                {c.handle ? (
                  <Link href={bagPath(c.handle)}>{c.handle}</Link>
                ) : (
                  <form action={assignHandleAction} style={s.row}>
                    <input type="hidden" name="id" value={c.id} />
                    <input name="handle" placeholder="mira.k" required style={s.input} />
                    <button style={s.button}>Open bag</button>
                  </form>
                )}
              </td>
              <td style={{ ...s.td, fontFamily: "var(--font-body)" }}>
                <Link href={`/admin/${c.number}`}>{c.theme ?? "Set a theme"}</Link>
              </td>
              <td style={s.td}>
                <Link href={`/admin/${c.number}`}>{c.drops}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
