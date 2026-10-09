"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Media } from "@/components/Media";
import { tx } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { VideoSection } from "@/types/site";
import { H2, ink2 } from "./shared";

/** แปลงลิงก์ YouTube หรือ Vimeo เป็นลิงก์สำหรับฝังวิดีโอที่เก็บข้อมูลผู้ชมน้อยที่สุด */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&dnt=1`;
  return null;
}

export function Video({ s, dark }: { s: VideoSection; dark: boolean }) {
  const { lang, t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const src = embedUrl(s.videoUrl);
  const heading = tx(s.heading, lang);

  return (
    <div className="sec flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col gap-2">
        <H2>{heading}</H2>
        <p className={`m-0 ${ink2(dark)}`}>{tx(s.body, lang)}</p>
      </div>
      <div className="relative aspect-video w-full max-w-[900px] overflow-hidden rounded-img">
        {playing && src ? (
          <iframe
            src={src}
            title={heading}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <>
            <Media img={s.cover} alt={heading} label={false} sizes="(min-width: 1024px) 900px, 100vw" />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              disabled={!src}
              aria-label={t.play}
              className="group absolute inset-0 grid cursor-pointer place-items-center border-0 bg-transparent disabled:cursor-not-allowed"
            >
              <span className="grid size-[84px] place-items-center rounded-full bg-accent-solid pl-[5px] text-white shadow-[0_14px_34px_rgba(200,49,42,.4)] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-[1.08] group-disabled:opacity-60">
                <Icon name="play" size={30} />
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
