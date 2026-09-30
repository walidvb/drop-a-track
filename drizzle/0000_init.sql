CREATE TYPE "public"."provider" AS ENUM('youtube', 'soundcloud', 'bandcamp');--> statement-breakpoint
CREATE TABLE "bags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"qr_code_id" integer NOT NULL,
	"seq" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bags_qr_code_id_seq_unique" UNIQUE("qr_code_id","seq")
);
--> statement-breakpoint
CREATE TABLE "drops" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "drops_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"bag_id" integer NOT NULL,
	"dropper_uid" text NOT NULL,
	"url" text NOT NULL,
	"provider" "provider" NOT NULL,
	"provider_track_id" text,
	"stream_url" text,
	"stream_refreshed_at" timestamp with time zone,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"artwork_url" text,
	"duration_sec" double precision,
	"dropped_by" text NOT NULL,
	"dropped_from" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drops_bag_id_dropper_uid_unique" UNIQUE("bag_id","dropper_uid")
);
--> statement-breakpoint
CREATE TABLE "media_cache" (
	"url" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "qr_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" char(6) NOT NULL,
	"number" integer NOT NULL,
	"handle" text,
	"current_bag_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_codes_token_unique" UNIQUE("token"),
	CONSTRAINT "qr_codes_number_unique" UNIQUE("number"),
	CONSTRAINT "qr_codes_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "throttles" (
	"key" text PRIMARY KEY NOT NULL,
	"last_at" timestamp with time zone DEFAULT 'epoch' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bags" ADD CONSTRAINT "bags_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_bag_id_bags_id_fk" FOREIGN KEY ("bag_id") REFERENCES "public"."bags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_current_bag_id_bags_id_fk" FOREIGN KEY ("current_bag_id") REFERENCES "public"."bags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drops_bag_id_created_at_index" ON "drops" USING btree ("bag_id","created_at");