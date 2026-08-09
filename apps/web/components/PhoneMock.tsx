import { formatCount } from "@xoholy/shared";

import {
  AmenMark,
  BellMark,
  PlayMark,
  PrayMark,
  SendMark,
  ShareMark,
  VerifiedMark,
  Wordmark,
  XoMark,
} from "./Marks";
import s from "./PhoneMock.module.css";

/**
 * Three real app screens, not pictures of them.
 *
 * Counts run through `formatCount` from @xoholy/shared — the same function the app
 * uses — so the numbers here cannot drift from the numbers on device.
 *
 * Photography is the one input this cannot fabricate. Every image well below is a
 * gradient treatment that reads as a frame of video without pretending to be a
 * photograph; generic worship stock is explicitly off-brand, and a placeholder that
 * admits what it is beats one that doesn't. Swap them for real stills as they arrive —
 * each is a single class in PhoneMock.module.css.
 */

export function PhoneFrame({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={`${s.phone} ${className ?? ""}`} role="img" aria-label={label}>
      <div className={s.screen}>
        <div className={s.statusBar} aria-hidden="true">
          <span className={s.clock}>9:41</span>
          <span className={s.island} />
          <span className={s.indicators}>
            <SignalGlyph />
            <WifiGlyph />
            <BatteryGlyph />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Screen one -- */

/** For You — full-bleed vertical video with the reaction rail. */
export function ForYouScreen() {
  return (
    <PhoneFrame label="XOholy For You feed" className={s.phoneTall}>
      <div className={s.appBar}>
        <Wordmark className={s.appMark} />
        <BellMark className={s.appIcon} />
      </div>

      <nav className={s.tabs}>
        <span className={s.tabActive}>For You</span>
        <span className={s.tab}>Following</span>
        <span className={s.tab}>Live</span>
      </nav>

      <div className={`${s.stage} ${s.shotSurfer}`}>
        <div className={s.stageScrim} />

        <blockquote className={s.verse}>
          <p className={s.verseText}>&ldquo;Be still, and know that I am God.&rdquo;</p>
          <cite className={s.verseRef}>Psalm 46:10</cite>
        </blockquote>

        <div className={s.rail}>
          <RailButton icon={<XoMark className={s.railXo} />} count={12_400} tone="xo" />
          <RailButton icon={<AmenMark className={s.railIcon} />} count={8_200} tone="amen" />
          <RailButton icon={<PrayMark className={s.railIcon} />} count={3_600} tone="pray" />
          <RailButton icon={<ShareMark className={s.railIcon} />} count={2_100} tone="share" />
        </div>

        <div className={s.creatorBar}>
          <span className={`${s.avatar} ${s.avatarA}`} />
          <span className={s.creatorHandle}>joshua.openshaw</span>
          <span className={s.followBtn}>Follow</span>
        </div>
        <p className={s.stageCaption}>
          When you start your day with Him, everything changes.{" "}
          <span className={s.hashtag}>#faith #peace</span>
        </p>
      </div>
    </PhoneFrame>
  );
}

function RailButton({
  icon,
  count,
  tone,
}: {
  icon: React.ReactNode;
  count: number;
  tone: "xo" | "amen" | "pray" | "share";
}) {
  return (
    <div className={`${s.railItem} ${s[tone]}`}>
      <span className={s.railWell}>{icon}</span>
      <span className={s.railCount}>{formatCount(count)}</span>
    </div>
  );
}

/* ------------------------------------------------------------ Screen two -- */

/** The browsing feed — category tabs and stacked posts. */
export function FeedScreen() {
  return (
    <PhoneFrame label="XOholy topic feed" className={s.phoneMid}>
      <nav className={s.chipRow}>
        {["All", "Faith", "Life", "Music", "Sports", "Family"].map((c, i) => (
          <span key={c} className={i === 0 ? s.chipActive : s.chip}>
            {c}
          </span>
        ))}
      </nav>

      <article className={s.post}>
        <header className={s.postHead}>
          <span className={`${s.avatar} ${s.avatarB}`} />
          <span className={s.postWho}>
            <span className={s.postName}>mrs.blessed</span>
            <span className={s.postPlace}>Atlanta, GA</span>
          </span>
          <span className={s.postTime}>2h</span>
          <span className={s.postMenu}>&#183;&#183;&#183;</span>
        </header>

        <p className={s.postBody}>
          God&rsquo;s faithfulness never fails. He turned our mourning into dancing 🤍
        </p>

        <div className={`${s.postMedia} ${s.shotFamily}`}>
          <span className={s.playWell}>
            <PlayMark className={s.playIcon} />
          </span>
        </div>

        <div className={s.reactionRow}>
          <InlineReaction icon={<XoMark className={s.inlineXo} />} count={14_200} tone="xo" />
          <InlineReaction icon={<AmenMark className={s.inlineIcon} />} label="Amen" count={9_800} tone="amen" />
          <InlineReaction icon={<PrayMark className={s.inlineIcon} />} label="Pray" count={4_300} tone="pray" />
          <InlineReaction icon={<ShareMark className={s.inlineIcon} />} count={1_200} tone="share" />
        </div>
      </article>

      <article className={s.post}>
        <header className={s.postHead}>
          <span className={`${s.avatar} ${s.avatarC}`} />
          <span className={s.postWho}>
            <span className={s.postName}>disciples.in.the.city</span>
            <span className={s.postPlace}>Los Angeles, CA</span>
          </span>
          <span className={s.postTime}>4h</span>
          <span className={s.postMenu}>&#183;&#183;&#183;</span>
        </header>
        <div className={`${s.postMedia} ${s.shotCity}`} />
      </article>
    </PhoneFrame>
  );
}

function InlineReaction({
  icon,
  label,
  count,
  tone,
}: {
  icon: React.ReactNode;
  label?: string;
  count: number;
  tone: "xo" | "amen" | "pray" | "share";
}) {
  return (
    <span className={`${s.inline} ${s[tone]}`}>
      {icon}
      {label ? <span className={s.inlineLabel}>{label}</span> : null}
      <span className={s.inlineCount}>{formatCount(count)}</span>
    </span>
  );
}

/* ---------------------------------------------------------- Screen three -- */

/** Live — stream, title, and the running comment rail. */
export function LiveScreen() {
  const comments = [
    { handle: "grace.upoonus", body: "This hit deep. Thank you brother 🙏", avatar: s.avatarD },
    { handle: "kingdom.movement", body: "Needed this today.", avatar: s.avatarE },
    { handle: "light.in.the.city", body: "So good! 🔥", avatar: s.avatarF },
  ];

  return (
    <PhoneFrame label="XOholy live stream" className={s.phoneMid}>
      <div className={s.liveBar}>
        <span className={s.liveTitle}>
          Live<span className={s.liveDot} />
        </span>
        <span className={s.viewers}>
          <span className={s.recDot} />
          {formatCount(2_300)}
        </span>
      </div>

      <div className={`${s.liveStage} ${s.shotSpeaker}`}>
        <div className={s.liveScrim} />
      </div>

      <div className={s.liveMeta}>
        <p className={s.liveHeading}>Q&amp;A: Faith, purpose and the real life</p>
        <p className={s.liveHost}>
          with @jakelawson <VerifiedMark className={s.verified} />
        </p>
      </div>

      <ul className={s.comments}>
        {comments.map((c) => (
          <li key={c.handle} className={s.comment}>
            <span className={`${s.avatarSm} ${c.avatar}`} />
            <span className={s.commentBody}>
              <span className={s.commentHandle}>{c.handle}</span>
              <span className={s.commentText}>{c.body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className={s.commentInput}>
        <span className={s.commentPlaceholder}>Add a comment...</span>
        <SendMark className={s.sendIcon} />
      </div>
    </PhoneFrame>
  );
}

/* --------------------------------------------------------- Status glyphs -- */

function SignalGlyph() {
  return (
    <svg viewBox="0 0 18 12" className={s.statusGlyph} fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0.5" width="3" height="11.5" rx="1" />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg viewBox="0 0 16 12" className={s.statusGlyph} fill="none">
      <path d="M1 4.2a10.5 10.5 0 0 1 14 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.6 6.9a6.7 6.7 0 0 1 8.8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="10.2" r="1.3" fill="currentColor" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <svg viewBox="0 0 26 12" className={s.statusGlyph} fill="none">
      <rect x="0.8" y="0.8" width="21" height="10.4" rx="3" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <rect x="2.6" y="2.6" width="15" height="6.8" rx="1.8" fill="currentColor" />
      <path d="M23.6 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
