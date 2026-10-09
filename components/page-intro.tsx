import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? <p className="text-[11px] tracking-[0.2em] text-oxblood uppercase">{eyebrow}</p> : null}
      <h1 className="mt-3 font-serif text-[clamp(2.5rem,7vw,4.6rem)] leading-[0.92] tracking-[-0.03em]">{title}</h1>
      {lede ? <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{lede}</p> : null}
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl xl:max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">{children}</div>;
}
