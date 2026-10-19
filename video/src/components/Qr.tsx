import { ReactQRCode } from "@lglab/react-qr-code";
import { QR_VALUE } from "../data";

/** A shirt's QR, styled as components/ShirtQr.tsx prints it. This one opens the home page, so it scans for real. */
export function Qr({ size, color = "#000000" }: { size: number; color?: string }) {
  return (
    <ReactQRCode
      value={QR_VALUE}
      size={size}
      level="H"
      marginSize={0}
      background="transparent"
      finderPatternOuterSettings={{ style: "inpoint-lg", color }}
      finderPatternInnerSettings={{ style: "inpoint-lg", color }}
      dataModulesSettings={{ style: "circuit-board", color }}
    />
  );
}
