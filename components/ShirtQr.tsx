"use client";

import { useRef } from "react";
import { ReactQRCode, type ReactQRCodeRef } from "@lglab/react-qr-code";
import { qrUrl } from "@/lib/qr";

/** A shirt's QR, styled for print, with SVG (vector, for the printer) and PNG downloads. */
export function ShirtQr({ base, token, number, size = 160 }: { base: string; token: string; number: number; size?: number }) {
  const ref = useRef<ReactQRCodeRef>(null);
  const name = `drop-a-track-${String(number).padStart(3, "0")}`;
  const button = { fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase" as const, padding: "4px 8px", border: "var(--rule)", background: "var(--paper)", cursor: "pointer" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <ReactQRCode
        ref={ref}
        value={qrUrl(base, token)}
        size={size}
        level="H"
        marginSize={4}
        finderPatternOuterSettings={{ style: "inpoint-lg" }}
        finderPatternInnerSettings={{ style: "inpoint-lg" }}
        dataModulesSettings={{ style: "circuit-board" }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" style={button} onClick={() => ref.current?.download({ name, format: "svg", size: 2048 })}>
          SVG
        </button>
        <button type="button" style={button} onClick={() => ref.current?.download({ name, format: "png", size: 2048 })}>
          PNG
        </button>
      </div>
    </div>
  );
}
