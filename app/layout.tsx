import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { PlayerProvider } from "./PlayerProvider";
import "./globals.css";

export const metadata: Metadata = {
  // Share images need absolute URLs: the printed domain, else Next's own guess (Vercel's production URL).
  metadataBase: process.env.NEXT_PUBLIC_QR_BASE_URL ? new URL(process.env.NEXT_PUBLIC_QR_BASE_URL) : undefined,
  title: "drop-a-track",
  description: "A participatory project for music lovers, ever changing, ever evolving.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
