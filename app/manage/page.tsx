import Link from "next/link";
import { Button } from "@/components/ds/Button";
import { padNumber } from "@/lib/format";
import { bagPath } from "@/lib/handle";
import { getOwner } from "@/lib/owner";
import { logInAction, logOutAction, renameAction } from "./actions";
import { ErrorLine, Field, Shell, formClass, heading, lead, linkClass, mono, outlined } from "./ui";

export const metadata = { title: "Manage your bag · drop-a-track" };

/** The owner's corner: shirt number + password in, then their name (the handle) to change. */
export default async function ManagePage({ searchParams }: PageProps<"/manage">) {
  const { n, error, saved } = await searchParams;
  const owner = await getOwner();

  if (!owner) {
    return (
      <Shell>
        <h1 style={heading}>
          MANAGE
          <br />
          YOUR BAG
        </h1>
        <p style={lead}>Your shirt number, and the password you set on its first scan.</p>
        <form action={logInAction} className={formClass}>
          <Field
            label="Shirt number"
            name="number"
            inputMode="numeric"
            autoComplete="username"
            placeholder="014"
            defaultValue={typeof n === "string" ? n : ""}
            required
          />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <ErrorLine code={error} />
          <Button type="submit" variant="accent" size="lg" fullWidth iconRight="→">
            Log in
          </Button>
        </form>
        <span style={mono}>Forgot it? Ask whoever handed you the shirt to reset it.</span>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={outlined}>#{padNumber(owner.number)}</div>
      <h1 style={heading}>YOUR BAG</h1>
      <form action={renameAction} className={formClass}>
        <Field label="Your name" name="handle" defaultValue={owner.handle} autoComplete="off" autoCapitalize="none" spellCheck={false} required />
        <span style={mono}>
          It{"’"}s your bag{"’"}s address too: {bagPath(owner.handle)}. Change it and old links to the bag stop working {"—"} your QR
          keeps working.
        </span>
        <ErrorLine code={error} />
        {saved && !error && (
          <span role="status" style={mono}>
            Saved.
          </span>
        )}
        <Button type="submit" variant="accent" size="lg" fullWidth iconRight="→">
          Save
        </Button>
      </form>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "var(--rule)", paddingTop: 16 }}>
        <Link href={bagPath(owner.handle)} className={linkClass}>
          Open your bag →
        </Link>
        <form action={logOutAction}>
          <Button type="submit" variant="ghost">
            Log out
          </Button>
        </form>
      </div>
    </Shell>
  );
}
