import s from "./HeroScene.module.css";

/**
 * Stand-in for the hero photograph.
 *
 * The brief wants a cinematic still of Christian life being lived — a worship night,
 * hands raised, warm stage light. That photograph is the one asset this cannot
 * fabricate, and a soft gradient in its place just looks like a broken image.
 *
 * So this is a deliberate silhouette composition instead: stage light, haze, a crowd,
 * hands raised. It reads as art direction rather than as a placeholder, which keeps the
 * page presentable while the real photography is commissioned.
 *
 * TO REPLACE: set a `background-image` on the `.photo` layer in HeroScene.module.css and
 * delete the <svg>. The scrim, fade and type are already sized for a real image.
 *
 * A note on the viewBox: it is near-square because `preserveAspectRatio="slice"` scales
 * to *cover*, so a wide viewBox in a tall container magnifies everything inside it. An
 * earlier 800x420 box rendered the crowd at 1.7x and turned it into blobs.
 */
export function HeroScene() {
  return (
    <div className={s.scene} aria-hidden="true">
      <div className={s.photo} />
      <div className={s.beams} />

      <svg className={s.crowd} viewBox="0 0 760 760" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="crowdBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#160f0a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#11110F" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="crowdFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#11110F" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0b0b09" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Distant rows — small, soft, no detail. Depth comes from scale and opacity. */}
        <g fill="url(#crowdBack)">
          {[
            [30, 556, 0.68], [92, 562, 0.64], [154, 554, 0.7], [214, 564, 0.63],
            [276, 558, 0.66], [338, 560, 0.68], [400, 556, 0.65], [462, 562, 0.69],
            [524, 554, 0.64], [586, 560, 0.68], [648, 556, 0.66], [712, 562, 0.64],
            [752, 556, 0.68],
          ].map(([x, y, k]) => (
            <Figure key={`b${x}`} x={x!} y={y!} scale={k!} />
          ))}
        </g>

        {/* Mid row. */}
        <g fill="url(#crowdBack)" opacity="0.92">
          {[
            [10, 614, 0.92], [104, 620, 0.88], [196, 610, 0.94], [292, 618, 0.9],
            [486, 616, 0.92], [578, 608, 0.96], [668, 618, 0.89], [750, 610, 0.93],
          ].map(([x, y, k]) => (
            <Figure key={`m${x}`} x={x!} y={y!} scale={k!} />
          ))}
        </g>

        {/* Front row, plus the two figures the composition is actually about. */}
        <g fill="url(#crowdFront)">
          {[[44, 676, 1.24], [156, 684, 1.18], [618, 682, 1.2], [734, 674, 1.26]].map(
            ([x, y, k]) => (
              <Figure key={`f${x}`} x={x!} y={y!} scale={k!} />
            ),
          )}

          {/* Hand raised, palm open. */}
          <g transform="translate(276 668) scale(1.2)">
            <circle cx="0" cy="-56" r="25" />
            <path d="M-40 0c0-30 18-48 40-48s40 18 40 48v64h-80z" />
            {/* forearm */}
            <path d="M20 -44c3-26 8-52 12-76 2-9 15-8 14 2-2 26-6 54-9 78z" />
            {/* hand: palm plus four fingers and a thumb */}
            <path d="M31 -122c-1-6 8-8 10-2l4 16 2-20c1-7 11-6 11 1l-1 21 4-18c2-6 11-5 10 2l-3 20 5-13c2-6 11-4 9 3l-6 22c-2 9-6 15-12 18l-16 5-8-30z" />
          </g>

          {/* Both hands raised — the gesture the real photograph will centre on. */}
          <g transform="translate(412 676) scale(1.34)">
            <circle cx="0" cy="-58" r="26" />
            <path d="M-42 0c0-31 19-50 42-50s42 19 42 50v66h-84z" />
            <path d="M-22 -48c-5-25-11-50-16-72-2-9 12-12 14-3 6 24 12 50 16 74z" />
            <path d="M22 -48c5-25 11-50 16-72 2-9 15-6 13 3-5 24-10 50-14 74z" />
            <path d="M-36 -128c-2-6 7-9 10-3l6 14-4-19c-1-7 9-9 11-2l4 20-1-19c0-7 10-7 11 0l1 21c0 10-3 17-9 21l-14 8-15-41z" />
            <path d="M40 -128c2-6-7-9-10-3l-6 14 4-19c1-7-9-9-11-2l-4 20 1-19c0-7-10-7-11 0l-1 21c0 10 3 17 9 21l14 8 15-41z" />
          </g>
        </g>
      </svg>

      <div className={s.haze} />
    </div>
  );
}

/** A head-and-shoulders silhouette. */
function Figure({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="0" cy="-50" r="23" />
      <path d="M-37 0c0-27 17-44 37-44s37 17 37 44v58h-74z" />
    </g>
  );
}
