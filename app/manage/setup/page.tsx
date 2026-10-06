import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ds/Button";
import { padNumber } from "@/lib/format";
import { bagPath } from "@/lib/handle";
import { getShirtByNumber, parseShirtNumber } from "@/lib/owner";
import { PASSWORD_MIN } from "@/lib/owner-auth";
import { ticketCookieName, verifyFreshTicket } from "@/lib/ticket";
import { setPasswordAction } from "../actions";
import { ErrorLine, Field, Shell, formClass, heading, lead, linkClass, mono, outlined } from "../ui";

export const metadata = { title: "Your shirt? · drop-a-track" };

/**
 * Where a scan lands while nobody has set the shirt's password: the owner sets
 * one here (the scan ticket proves they're holding the shirt), anyone else
 * carries on to the drop.
 */
export default async function SetupPage({ searchParams }: PageProps<"/manage/setup">) {
  const { n, error } = await searchParams;
  const number = typeof n === "string" ? parseShirtNumber(n) : null;
  const shirt = number ? await getShirtByNumber(number) : null;
  if (!shirt?.handle || !shirt.bagId) redirect("/");
  if (shirt.passwordHash) redirect(bagPath(shirt.handle));
  const scanned = await verifyFreshTicket((await cookies()).get(ticketCookieName(shirt.bagId))?.value, shirt.bagId);

  return (
    <Shell>
      <div style={outlined}>#{padNumber(shirt.number)}</div>
      <h1 style={heading}>
        IS THIS
        <br />
        YOUR SHIRT?
      </h1>
      <p style={lead}>
        First scan of {shirt.handle}
        {"’"}s bag. If it{"’"}s yours, set a password: with it and your shirt number you can manage your bag at /manage.
      </p>
      {scanned ? (
        <form action={setPasswordAction} className={formClass}>
          {/* The username for password managers, and the shirt for the action. */}
          <input name="number" autoComplete="username" value={shirt.number} readOnly hidden />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN} required />
          <Field label="Again" name="again" type="password" autoComplete="new-password" minLength={PASSWORD_MIN} required />
          <ErrorLine code={error} />
          <Button type="submit" variant="accent" size="lg" fullWidth iconRight="→">
            Set password
          </Button>
        </form>
      ) : (
        <span style={mono}>Scan your shirt again to set a password.</span>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "var(--rule)", paddingTop: 16 }}>
        <span style={mono}>Not your shirt?</span>
        <Link href={bagPath(shirt.handle)} className={linkClass}>
          Drop a track →
        </Link>
      </div>
    </Shell>
  );
}
