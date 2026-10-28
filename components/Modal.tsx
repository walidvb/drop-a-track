"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Texture } from "./ds/Texture";

/**
 * A full-screen ink overlay holding one paper card, centred while it fits and scrolling when it
 * doesn't (Radix Dialog: focus kept inside and given back on close, the page behind locked).
 * Closes on the backdrop and on Escape; the card brings its own ✕ (autoFocus it) and names
 * itself with a `ModalTitle`. `texture` lays the paper moiré over the backdrop.
 */
export function Modal({
  onClose,
  maxWidth = 460,
  texture = false,
  cardStyle,
  children,
}: {
  onClose: () => void;
  maxWidth?: number;
  texture?: boolean;
  cardStyle?: CSSProperties;
  children: ReactNode;
}) {
  // The modals are opened by plain buttons, not a Dialog.Trigger: hand focus back to whatever had
  // it. Taken on the first render, before the card's autoFocus moves it.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "var(--ink)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: 16,
            overflowY: "auto",
          }}
        >
          {texture && <Texture color="var(--paper)" opacity={0.35} style={{ position: "fixed" }} />}
          <Dialog.Content
            aria-describedby={undefined}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              opener?.focus();
            }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth,
              margin: "auto",
              background: "var(--paper)",
              color: "var(--ink)",
              border: "var(--rule)",
              boxShadow: "var(--shadow-hard-accent)",
              ...cardStyle,
            }}
          >
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The card's heading, which names the dialog: wrap it (`<ModalTitle asChild><h2>…`). */
export const ModalTitle = Dialog.Title;
