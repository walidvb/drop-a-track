import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  char,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type { Provider } from "@cucu/media/core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Listed here rather than imported so drizzle-kit can load this file without the workspace package.
const PROVIDER_VALUES = ["youtube", "soundcloud", "bandcamp"] as const satisfies readonly Provider[];
export const provider = pgEnum("provider", PROVIDER_VALUES);

/** One printed QR code = one shirt. The token is only ever in the QR; the handle is public. */
export const qrCodes = pgTable("qr_codes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** 6 chars, uppercase, unguessable. See lib/token.ts. */
  token: char("token", { length: 6 }).notNull().unique(),
  /** Shirt number, shown as #014 and printable next to the QR. */
  number: integer("number").notNull().unique(),
  /** The wearer's handle, set at handover. Null = shirt not open yet. Never changes once set. */
  handle: text("handle").unique(),
  currentBagId: integer("current_bag_id").references((): AnyPgColumn => bags.id),
  createdAt: createdAt(),
});

/** A shirt's playlist. Many per QR code (one per trip/festival); v1 only ever has one. */
export const bags = pgTable(
  "bags",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    qrCodeId: integer("qr_code_id")
      .notNull()
      .references(() => qrCodes.id, { onDelete: "cascade" }),
    /** 1.. per QR code; older bags would live at /@handle/<seq>. */
    seq: integer("seq").notNull(),
    /** The wearer's prompt for droppers ("Something for the walk home…"). Set in the admin for now. */
    theme: text("theme"),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.qrCodeId, t.seq)],
);

export const drops = pgTable(
  "drops",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    bagId: integer("bag_id")
      .notNull()
      .references(() => bags.id, { onDelete: "cascade" }),
    dropperUid: text("dropper_uid").notNull(),
    /** Canonical URL of the pasted link (a Bandcamp album stays the album URL). */
    url: text("url").notNull(),
    provider: provider("provider").notNull(),
    /** Bandcamp: which track of the release. */
    providerTrackId: text("provider_track_id"),
    /** Bandcamp: signed mp3-128 stream, refreshed when playback fails. */
    streamUrl: text("stream_url"),
    streamRefreshedAt: timestamp("stream_refreshed_at", { withTimezone: true }),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    artworkUrl: text("artwork_url"),
    durationSec: doublePrecision("duration_sec"),
    droppedBy: text("dropped_by").notNull(),
    droppedFrom: text("dropped_from").notNull(),
    /** Only when the dropper tapped Share location. Never exposed publicly. */
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.bagId, t.dropperUid), index().on(t.bagId, t.createdAt)],
);

/** Shared rate limiters, claimed atomically across serverless instances (lib/throttle.ts). */
export const throttles = pgTable("throttles", {
  key: text("key").primaryKey(),
  lastAt: timestamp("last_at", { withTimezone: true }).notNull().default(sql`'epoch'`),
});

/** Link reads, so a re-paste never refetches Bandcamp (lib/read-link.ts). */
export const mediaCache = pgTable("media_cache", {
  url: text("url").primaryKey(),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});
