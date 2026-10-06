"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Texture } from "@/components/ds/Texture";
import { padCount, padNumber } from "@/lib/format";
import { bagPath } from "@/lib/handle";
import type { PastDrop, PendingDrop } from "@/lib/my-drops";
import { UID_STORAGE_KEY, isUid } from "@/lib/uid";
import { myDrops } from "./actions";
import styles from "./my-drops.module.css";

/** Words that differ between the phone layout and the desktop one. */
const Says = ({ phone, desk }: { phone: string; desk: string }) => (
  <>
    <span className={styles.mob}>{phone}</span>
    <span className={styles.desk}>{desk}</span>
  </>
);

/**
 * Your drops: every bag this browser scanned but hasn't dropped into stays pending here until it's used,
 * then the drops it made. Server-rendered for the uid cookie; a localStorage uid the cookie doesn't
 * have (one of the two was cleared) is asked about from here, so its drops show too.
 */
export function MyDrops({ initial, cookieUid }: { initial: { pending: PendingDrop[]; past: PastDrop[] }; cookieUid: string | null }) {
  const [{ pending, past }, setData] = useState(initial);
  useEffect(() => {
    let uid: string | null = null;
    try {
      uid = localStorage.getItem(UID_STORAGE_KEY);
    } catch {}
    if (!isUid(uid) || uid === cookieUid) return;
    let live = true;
    myDrops(uid).then((d) => live && setData(d), () => {});
    return () => {
      live = false;
    };
  }, [cookieUid]);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <Texture color="var(--magenta)" />
        <div className={styles.wordmark}>
          DROP A<br />
          TRACK
        </div>
        <Link href="/" className={styles.back}>
          <Says phone="← Back" desk="← Home" />
        </Link>
        <div className={styles.heroFoot}>
          <span className={styles.tag}>
            <Says phone="Scanned, not dropped" desk="Your drops" />
          </span>
          <div style={{ alignSelf: "stretch", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <h1 className={styles.title}>
              PENDING
              <br />
              DROPS
            </h1>
            <span className={styles.count}>{padCount(pending.length)}</span>
          </div>
        </div>
      </header>

      <section className={styles.list}>
        <div className={`${styles.head} ${styles.pendingHead}`}>
          <h2>PENDING</h2>
          <span>Scanned, not dropped</span>
        </div>
        {pending.length === 0 && <p className={styles.empty}>Nothing pending. Scan a shirt to drop a track.</p>}
        {pending.map((o, i) => (
          <div key={o.handle} className={styles.pending}>
            <span className={styles.num}>{padCount(i + 1)}</span>
            <div className={styles.who}>
              <span className={styles.handle}>{o.handle}</span>
              <span className={styles.meta}>
                Scanned {o.scanned.toLowerCase()} · {o.tracks === 0 ? "empty bag" : `${o.tracks} ${o.tracks === 1 ? "track" : "tracks"}`}
              </span>
            </div>
            <Link href={bagPath(o.handle)} className={styles.drop}>
              Drop <span aria-hidden>→</span>
            </Link>
          </div>
        ))}

        {past.length > 0 && (
          <>
            <div className={`${styles.head} ${styles.pastHead}`}>
              <h2>DROPPED</h2>
              <span>That was your one</span>
            </div>
            {past.map((d) => (
              <Link key={d.id} href={bagPath(d.handle)} className={styles.past}>
                <span className={styles.who}>
                  <span className={styles.handle}>{d.handle}</span>
                  <span className={styles.meta}>{[d.title, d.artist].filter(Boolean).join(" — ")}</span>
                </span>
                <span className={styles.pos}>
                  #{padNumber(d.position)}
                  <span className={styles.desk}> in their bag</span> →
                </span>
              </Link>
            ))}
          </>
        )}
        <div style={{ flex: 1 }} />
        <p className={styles.foot}>
          <Says phone="Saved on this phone only." desk="Saved in this browser only." />
        </p>
      </section>
    </main>
  );
}
