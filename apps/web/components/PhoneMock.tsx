import { formatReactionCount } from "@xoholy/shared";

import { AmenMark, PrayMark, ShareMark, XoMark } from "./Marks";
import styles from "./PhoneMock.module.css";

/**
 * A real feed cell, not a picture of one.
 *
 * The counts come from `formatReactionCount` in @xoholy/shared — the same function the
 * app uses — so `12.4K XO` and `3,842 PRAYING` render here exactly as they will on
 * device. If the formatting rules change, this changes with them.
 *
 * The frames use gradient treatments as placeholders for the cinematic photography the
 * brand calls for. They are deliberately abstract rather than stock imagery: generic
 * worship photography is on the brief's banned list, and a placeholder that admits what
 * it is beats one that pretends.
 */

export type FeedCell = {
  handle: string;
  displayName: string;
  caption: string;
  topic: string;
  xo: number;
  amen: number;
  pray: number;
  /** Index into the gradient treatments in PhoneMock.module.css. */
  treatment: 1 | 2 | 3;
  /** Prayer requests lead with PRAYING rather than XO — the interaction fits the post. */
  leadWith?: "xo" | "pray";
};

export function PhoneMock({
  cell,
  tab = "For You",
  className,
}: {
  cell: FeedCell;
  tab?: "For You" | "Following" | "Live";
  className?: string;
}) {
  const tabs = ["For You", "Following", "Live"] as const;

  return (
    <div className={`${styles.phone} ${className ?? ""}`}>
      <div className={`${styles.screen} ${styles[`treatment${cell.treatment}`]}`}>
        <div className={styles.scrim} />

        <nav className={styles.tabs} aria-hidden="true">
          {tabs.map((t) => (
            <span key={t} className={t === tab ? styles.tabActive : styles.tab}>
              {t}
            </span>
          ))}
        </nav>

        <div className={styles.rail} aria-hidden="true">
          <Reaction
            icon={<XoMark className={styles.xoIcon} />}
            label={formatReactionCount("xo", cell.xo)}
            tone="xo"
            active={cell.leadWith !== "pray"}
          />
          <Reaction
            icon={<AmenMark className={styles.icon} />}
            label={formatReactionCount("amen", cell.amen)}
            tone="amen"
          />
          <Reaction
            icon={<PrayMark className={styles.icon} />}
            label={formatReactionCount("pray", cell.pray)}
            tone="pray"
            active={cell.leadWith === "pray"}
          />
          <Reaction icon={<ShareMark className={styles.icon} />} label="Share" tone="muted" />
        </div>

        <div className={styles.meta}>
          <span className={styles.topic}>{cell.topic}</span>
          <p className={styles.handle}>
            @{cell.handle} <span className={styles.name}>{cell.displayName}</span>
          </p>
          <p className={styles.caption}>{cell.caption}</p>
        </div>
      </div>
    </div>
  );
}

function Reaction({
  icon,
  label,
  tone,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "xo" | "amen" | "pray" | "muted";
  active?: boolean;
}) {
  return (
    <div className={`${styles.reaction} ${styles[tone]} ${active ? styles.active : ""}`}>
      <span className={styles.iconWell}>{icon}</span>
      <span className={styles.count}>{label}</span>
    </div>
  );
}
