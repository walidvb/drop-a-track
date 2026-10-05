"use client";

import { Button } from "@/components/ds/Button";
import { monoCaps } from "@/components/ds/styles";
import { Modal } from "@/components/Modal";
import styles from "./browse.module.css";

const SHIRT_MAIL = "mailto:hello@walidvb.com?subject=I%20want%20a%20shirt";

/** "Get your own": there's no shop, just an email. */
export function ShirtModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} labelledBy="shirt-title" texture>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingLeft: 16, borderBottom: "var(--rule)" }}>
        <span style={monoCaps}>DIY · no shop</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          autoFocus
          className={styles.close}
          style={{
            width: 48,
            height: 48,
            border: 0,
            borderLeft: "var(--rule)",
            fontWeight: 800,
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px 16px 16px" }}>
        <h2
          id="shirt-title"
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: "normal",
            fontSize: "clamp(36px,8vw,52px)",
            lineHeight: 0.82,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Get a shirt
        </h2>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, lineHeight: 1.25, textWrap: "pretty" }}>
          This is a DIY project. No shop, no stock, no checkout.
        </p>
        <p style={{ margin: 0, fontWeight: 500, fontSize: 15, lineHeight: 1.35, textWrap: "pretty" }}>
          Drop us an email and we{"’"}ll get a shirt, and a bag, sorted for you.
        </p>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          iconRight="→"
          onClick={() => {
            location.href = SHIRT_MAIL;
          }}
        >
          Write to us
        </Button>
      </div>
    </Modal>
  );
}
