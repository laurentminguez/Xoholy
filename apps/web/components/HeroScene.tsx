import Image from "next/image";

import s from "./HeroScene.module.css";

/** Cinematic worship photography with restrained brand-grade overlays. */
export function HeroScene() {
  return (
    <div className={s.scene} aria-hidden="true">
      <Image
        src="/images/hero-worship.png"
        alt=""
        fill
        priority
        sizes="(min-width: 900px) 55vw, 100vw"
        className={s.photo}
      />
      <div className={s.beams} />
      <div className={s.haze} />
    </div>
  );
}
