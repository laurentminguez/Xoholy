import {
  AmenMark,
  ArrowMark,
  CrossCircleMark,
  InstagramMark,
  PlayMark,
  PrayMark,
  ShareMark,
  TiktokMark,
  VerifiedMark,
  Wordmark,
  XMark,
  XoMark,
  YoutubeMark,
} from "@/components/Marks";
import { HeroScene } from "@/components/HeroScene";
import { FeedScreen, ForYouScreen, LiveScreen } from "@/components/PhoneMock";

import styles from "./page.module.css";

/**
 * The homepage.
 *
 * Product before explanation: the hero carries the statement and a photograph, and the
 * next screen is three real app surfaces — For You, the topic feed, and Live. The goal
 * is "what is this?" then "I want to be part of this", not a features list.
 */

const NAV = [
  { label: "Home", href: "#top" },
  { label: "Experience", href: "#product" },
  { label: "Vocabulary", href: "#interactions" },
  { label: "Mission", href: "#mission" },
] as const;

const PRINCIPLES = [
  { value: "Real faith", detail: "No performance required" },
  { value: "Real people", detail: "Creators keep the credit" },
  { value: "Real care", detail: "Prayer stays personal" },
  { value: "Built with purpose", detail: "Not for empty attention" },
] as const;

const FEATURES = [
  {
    key: "xo",
    name: "XO",
    blurb: "Show love. Support. Encourage.",
    icon: <XoMark className={styles.featureXo} />,
  },
  {
    key: "amen",
    name: "Amen",
    blurb: "Agree. Affirm. Give God the glory.",
    icon: <AmenMark className={styles.featureIcon} />,
  },
  {
    key: "pray",
    name: "Pray",
    blurb: "Lift others up. We'll pray with you.",
    icon: <PrayMark className={styles.featureIcon} />,
  },
  {
    key: "share",
    name: "Share",
    blurb: "Share truth. Inspire the world.",
    icon: <ShareMark className={styles.featureIcon} />,
  },
] as const;

export default function Home() {
  return (
    <>
      <header id="top" className={styles.nav}>
        <div className={styles.navInner}>
          <a href="/" aria-label="XOholy home">
            <Wordmark className={styles.navMark} />
          </a>

          <nav className={styles.navLinks} aria-label="Primary">
            {NAV.map((item, i) => (
              <a key={item.label} href={item.href} className={i === 0 ? styles.navLinkActive : undefined}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.navActions}>
            <a className="btn btn-primary" href="#join">
              Get early access
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------------- Hero */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={`hero-type ${styles.heroHeadline}`}>
              Social media
              <br />
              can be <span className="accent">holy.</span>
            </h1>

            <p className={styles.heroSub}>
              Real people. Real faith. Real life.
              <br />
              Welcome to <span className="accent">XOholy</span>.
            </p>

            <div className={styles.heroCtas}>
              <a className="btn btn-primary" href="#join">
                Join XOholy
              </a>
              <a className={styles.watch} href="#mission">
                <span className={styles.watchWell}>
                  <PlayMark className={styles.watchIcon} />
                </span>
                Watch the vision
              </a>
            </div>

            <dl className={styles.principles} aria-label="What XOholy stands for">
              {PRINCIPLES.map((principle) => (
                <div key={principle.value} className={styles.principle}>
                  <dt className={styles.principleValue}>{principle.value}</dt>
                  <dd className={styles.principleDetail}>{principle.detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/*
           * The hero image. HeroScene is a deliberate silhouette composition standing in
           * for the photograph the brief calls for — see its file header for how to swap
           * in the real still once it exists.
           */}
          <div className={styles.heroMedia} aria-hidden="true">
            <HeroScene />
            <div className={styles.heroFade} />
            <ol className={styles.slides}>
              {["01", "02", "03", "04"].map((n, i) => (
                <li key={n} className={i === 0 ? styles.slideActive : styles.slide}>
                  {n}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------ Built different */}
        <section id="product" className={`surface-light ${styles.built}`}>
          <div className={styles.builtGrid}>
            <div className={styles.builtLeft}>
              <h2 className={styles.builtTitle}>Built different.</h2>

              <ul className={styles.features}>
                {FEATURES.map((f) => (
                  <li key={f.key} className={styles.feature}>
                    <span className={`${styles.featureWell} ${styles[`well_${f.key}`]}`}>
                      {f.icon}
                    </span>
                    <span>
                      <span className={styles.featureName}>{f.name}</span>
                      <span className={styles.featureBlurb}>{f.blurb}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <a className={styles.textLink} href="#interactions">
                See all features <ArrowMark className={styles.textLinkIcon} />
              </a>
            </div>

            <div className={styles.phones}>
              <ForYouScreen />
              <FeedScreen />
              <LiveScreen />
            </div>

            <div className={styles.builtRight} id="mission">
              <p className={styles.missionEyebrow}>Our mission</p>
              <h2 className={styles.missionTitle}>
                To see a generation connected through truth, love and the gospel.
              </h2>
              <p className={styles.missionBody}>
                We&rsquo;re not just building an app.
                <br />
                We&rsquo;re building a movement.
              </p>
              <a className={styles.textLink} href="#join">
                Join the movement <ArrowMark className={styles.textLinkIcon} />
              </a>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Interactions */}
        <section id="interactions" className={`section ${styles.vocab}`}>
          <div className="shell">
            <div className={`reveal ${styles.vocabHead}`}>
              <p className="eyebrow">The vocabulary</p>
              <h2 className="display-type">
                We didn&rsquo;t ship
                <br />a like button.
              </h2>
              <p className="lede">
                A like is a shrug that fits everything and means nothing. Three things
                happen when something reaches you, and they are not the same thing.
              </p>
            </div>

            <div className={styles.cards}>
              <article className={`reveal ${styles.card}`}>
                <span className={`${styles.cardIcon} ${styles.cardXo}`}>
                  <XoMark className={styles.cardXoMark} />
                </span>
                <h3 className="display-sm">XO</h3>
                <p className={styles.cardCount}>Love in action</p>
                <p className={styles.cardBody}>
                  Love. Support. Encourage. The one you&rsquo;ll reach for most, and the
                  signal that carries the most weight in what you get shown next.
                </p>
              </article>

              <article className={`reveal ${styles.card}`}>
                <span className={`${styles.cardIcon} ${styles.cardAmen}`}>
                  <AmenMark className={styles.cardMark} />
                </span>
                <h3 className="display-sm">Amen</h3>
                <p className={styles.cardCount}>Agreement, not influence</p>
                <p className={styles.cardBody}>
                  Agreement. So be it. <strong>Amen has no effect on reach</strong> — by
                  design, and enforced in code. The moment affirmation buys distribution,
                  people farm it and doctrine becomes a scoreboard.
                </p>
              </article>

              <article className={`reveal ${styles.card}`}>
                <span className={`${styles.cardIcon} ${styles.cardPray}`}>
                  <PrayMark className={styles.cardMark} />
                </span>
                <h3 className="display-sm">Pray</h3>
                <p className={styles.cardCount}>A private commitment</p>
                <p className={styles.cardBody}>
                  More than a reaction: a commitment to actually pray. Save any request
                  to a private list that stays between you and God.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- Join */}
        <section id="join" className={`section surface-light ${styles.join}`}>
          <div className="shell">
            <h2 className="display-type">Faith lives here.</h2>
            <p className="lede">
              XOholy is in build. Leave your email and we&rsquo;ll bring you in with the
              first creators.
            </p>
            <form className={styles.form} action="#" method="post">
              <label className={styles.srOnly} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className={styles.input}
              />
              <button type="submit" className="btn btn-primary">
                Join XOholy
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Wordmark className={styles.footerMark} />
            <span className={styles.footerTag}>Social media can be holy.</span>
          </div>

          <nav className={styles.footerLinks} aria-label="Footer">
            <a href="#">About</a>
            <a href="#">Creators</a>
            <a href="#">Careers</a>
            <a href="#">Press</a>
            <a href="#">Safety</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </nav>

          <div className={styles.social}>
            <a href="#" aria-label="XOholy on Instagram"><InstagramMark className={styles.socialIcon} /></a>
            <a href="#" aria-label="XOholy on TikTok"><TiktokMark className={styles.socialIcon} /></a>
            <a href="#" aria-label="XOholy on YouTube"><YoutubeMark className={styles.socialIcon} /></a>
            <a href="#" aria-label="XOholy on X"><XMark className={styles.socialIcon} /></a>
            <a href="#" aria-label="XOholy community"><CrossCircleMark className={styles.socialIcon} /></a>
          </div>

          <p className={styles.copyright}>© 2026 XOholy</p>
        </div>

        <p className={styles.footerNote}>
          Shared posts play in their original platform&rsquo;s player. Creators keep the
          view, the watermark, and the credit.{" "}
          <a href="/content-standards" className={styles.footerNoteLink}>
            Content Standards <VerifiedMark className={styles.footerNoteIcon} />
          </a>
        </p>
      </footer>
    </>
  );
}
