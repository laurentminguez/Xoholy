import { AmenMark, PrayMark, Wordmark, XoMark } from "@/components/Marks";
import { PhoneMock, type FeedCell } from "@/components/PhoneMock";

import styles from "./page.module.css";

/**
 * The homepage.
 *
 * Structure follows the brief: hero, then the product immediately — large overlapping
 * phones showing the real feed — then the interaction vocabulary, then the mission.
 * The product is shown before it is explained, because the goal is "what is this?"
 * followed by "I want to be part of this", not a features list.
 */

const CELLS: FeedCell[] = [
  {
    handle: "danielortiz",
    displayName: "Daniel Ortiz",
    caption:
      "5:40am. Water like glass. Read Psalm 19 out loud to nobody and meant every word of it.",
    topic: "Life",
    xo: 12_400,
    amen: 8_200,
    pray: 940,
    treatment: 1,
  },
  {
    handle: "gracechapel",
    displayName: "Grace Chapel",
    caption:
      "My daughter's surgery is Thursday morning. I don't have words left, so I'm just asking.",
    topic: "Prayer",
    xo: 2_100,
    amen: 5_600,
    pray: 3_842,
    treatment: 3,
    leadWith: "pray",
  },
  {
    handle: "keziahwrites",
    displayName: "Keziah Bell",
    caption: "Part 3 on Romans 8 — what Paul actually means by 'no condemnation'.",
    topic: "Teaching",
    xo: 34_800,
    amen: 41_200,
    pray: 1_600,
    treatment: 2,
  },
];

export default function Home() {
  return (
    <>
      <header className={styles.nav}>
        <div className={`shell ${styles.navInner}`}>
          <Wordmark className={styles.navMark} />
          <nav className={styles.navLinks}>
            <a href="#product">The app</a>
            <a href="#interactions">XO, Amen, Pray</a>
            <a href="#mission">Mission</a>
          </nav>
          <a className="btn btn-primary" href="#join">
            Join XOholy
          </a>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------------- Hero */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={`shell ${styles.heroInner}`}>
            <h1 className={`hero-type ${styles.heroHeadline}`}>
              Social media
              <br />
              can be <span className="accent">holy.</span>
            </h1>

            <div className={styles.heroFoot}>
              <p className={styles.heroSub}>
                Real people. Real faith. Real life.
                <br />
                <span className={styles.heroWelcome}>Welcome to XOholy.</span>
              </p>
              <div className={styles.heroCtas}>
                <a className="btn btn-primary" href="#join">
                  Join XOholy
                </a>
                <a className="btn btn-ghost" href="#mission">
                  Watch the vision
                </a>
              </div>
            </div>
          </div>

          <div className={styles.heroPhones} aria-hidden="true">
            <PhoneMock cell={CELLS[1]!} tab="Following" className={styles.phoneBack} />
            <PhoneMock cell={CELLS[0]!} className={styles.phoneFront} />
            <PhoneMock cell={CELLS[2]!} tab="Live" className={styles.phoneBack} />
          </div>
        </section>

        {/* ------------------------------------------------------------- Product */}
        <section id="product" className={`section ${styles.product}`}>
          <div className="shell">
            <div className={`reveal ${styles.productHead}`}>
              <p className="eyebrow">The feed</p>
              <h2 className="display-type">
                Everything you scroll.
                <br />
                None of what you don&rsquo;t.
              </h2>
              <p className="lede">
                Faith, life, music, family, culture, business, sport, testimonies, worship,
                teaching, comedy. Not a Christian corner of a bigger app — the whole app.
                Share a video in from anywhere the way you already cross-post, and it lands
                somewhere it belongs.
              </p>
            </div>

            <ul className={styles.topics}>
              {[
                "Faith",
                "Life",
                "Music",
                "Family",
                "Culture",
                "Business",
                "Sports",
                "Testimonies",
                "Worship",
                "Teaching",
                "Comedy",
              ].map((topic) => (
                <li key={topic} className={styles.topicChip}>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* -------------------------------------------------------- Interactions */}
        <section id="interactions" className={`section surface-light ${styles.interactions}`}>
          <div className="shell">
            <div className={`reveal ${styles.interactionsHead}`}>
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
                <p className={styles.cardCount}>12.4K XO</p>
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
                <p className={styles.cardCount}>8.2K AMENS</p>
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
                <p className={styles.cardCount}>3,842 PRAYING</p>
                <p className={styles.cardBody}>
                  Not 3,842 likes. Three thousand eight hundred and forty-two people
                  actually praying. Save any request to a private list that is between you
                  and God.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- Mission */}
        <section id="mission" className={`section ${styles.mission}`}>
          <div className="shell">
            <h2 className={`display-type reveal ${styles.missionHeadline}`}>
              A generation
              <br />
              connected through
              <br />
              <span className="accent">truth, love &amp;</span>
              <br />
              the gospel.
            </h2>

            <div className={`reveal ${styles.missionBody}`}>
              <p className={styles.missionLede}>
                We&rsquo;re not just building an app. We&rsquo;re building a movement.
              </p>
              <p className={styles.missionNote}>
                Every other feed is tuned to hold your attention for as long as it can.
                Ours is tuned for something else — what you save, what you send someone,
                who you follow, what you come back for. Watch time still counts. It just
                doesn&rsquo;t get to be the only thing that does.
              </p>
              <p className={styles.missionNote}>
                You should leave XOholy encouraged, challenged, or closer to Christ. Not
                emptied out.
              </p>
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
        <div className={`shell ${styles.footerInner}`}>
          <Wordmark className={styles.footerMark} />
          <nav className={styles.footerLinks}>
            <a href="/content-standards">Content Standards</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/copyright">Copyright &amp; DMCA</a>
          </nav>
          <p className={styles.footerNote}>
            Shared posts play in their original platform&rsquo;s player. Creators keep the
            view, the watermark, and the credit.
          </p>
        </div>
      </footer>
    </>
  );
}
