export function Monogram({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="shrink-0">
      <div className="grid h-20 w-20 place-items-center bg-ink font-serif text-3xl text-paper sm:h-24 sm:w-24 sm:text-4xl">
        <span aria-hidden>{initials || "–"}</span>
      </div>
      <p className="mt-2 max-w-24 text-[11px] leading-4 text-muted">No photo uploaded</p>
    </div>
  );
}

export function SampleMark({ show }: { show: boolean }) {
  return null;
}

export function CompatibilityList({
  score,
  parts,
}: {
  score: number;
  parts: { label: string; weight: number; awarded: number; detail: string }[];
}) {
  const isHighFit = score >= 75;
  const isMedFit = score >= 50 && score < 75;

  return (
    <section className="card-interactive border border-line bg-card p-5 sm:p-6 transition-all">
      <div className="flex items-end justify-between gap-4 border-b border-ink pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] tracking-[0.18em] uppercase font-semibold text-ink">Compatibility</h3>
            <span
              className={`border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                isHighFit
                  ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800"
                  : isMedFit
                  ? "border-amber-600/30 bg-amber-500/10 text-amber-800"
                  : "border-line bg-paper text-muted"
              }`}
            >
              {isHighFit ? "Strong Match" : isMedFit ? "Moderate Match" : "Standard Fit"}
            </span>
          </div>
          <p className="mt-2 max-w-xs text-xs leading-5 text-muted">Each line is a visible field. Zero synthetic inference.</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-5xl leading-none tracking-[-0.04em] text-ink">{score}</p>
          <span className="font-mono text-[10px] text-muted uppercase">out of 100</span>
        </div>
      </div>
      <ul className="mt-4 space-y-4">
        {parts.map((part) => {
          const pct = part.weight ? Math.round((part.awarded / part.weight) * 100) : 0;
          return (
            <li key={part.label} className="group">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-ink transition-colors group-hover:text-oxblood">{part.label}</span>
                <span className="tabular-nums font-mono text-xs text-muted">
                  {part.awarded}/{part.weight}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full rounded-full bg-ink transition-all duration-700 ease-out group-hover:bg-oxblood"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed">{part.detail}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MatchMoment({
  creatorName = "Creator",
  brandName = "Brand",
  campaignName = "Campaign",
  matchId,
  creatorId,
  campaignId,
}: {
  creatorName?: string;
  brandName?: string;
  campaignName?: string;
  matchId: string;
  creatorId?: string;
  campaignId?: string;
}) {
  return (
    <section className="animate-fade-up my-8 flex flex-col justify-center">
      <div className="relative overflow-hidden rounded-[2px] bg-line/80 p-[2px] shadow-lg">
        {/* Revolving perimeter traveling beam */}
        <div
          className="pointer-events-none absolute -inset-[120%] animate-revolve-spin opacity-95"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 240deg, rgba(217, 119, 6, 0.3) 275deg, #f59e0b 320deg, #6f2e2a 355deg, transparent 360deg)",
            animationDuration: "5.5s",
          }}
          aria-hidden="true"
        />

        {/* Stationary inner match card */}
        <div className="relative z-10 bg-card p-6 sm:p-12">
          {/* Top Editorial Eyebrow */}
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-oxblood">
              Verified Pairing · Mutual Interest
            </span>
            <span className="border border-oxblood/30 bg-oxblood/10 px-2 py-0.5 font-mono text-[10px] font-medium text-oxblood uppercase">
              Match # {matchId.slice(0, 8)}
            </span>
          </div>

          {/* Visual Convergence Stage */}
          <div className="my-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
            {/* Creator Identity */}
            <div className="animate-converge-left flex flex-col items-center text-center">
              <div className="avatar-interactive grid h-16 w-16 place-items-center bg-ink font-serif text-2xl text-paper shadow-sm sm:h-20 sm:w-20 sm:text-3xl">
                {creatorName[0]?.toUpperCase() || "C"}
              </div>
              <p className="mt-2 font-serif text-base font-medium text-ink">{creatorName}</p>
              <span className="font-mono text-[10px] uppercase text-muted">Creator Storefront</span>
            </div>

            {/* Central Convergence Insignia */}
            <div className="flex flex-col items-center">
              <div className="relative grid h-10 w-10 place-items-center rounded-full border border-oxblood/40 bg-paper shadow-sm">
                <span className="pointer-events-none absolute -inset-1 rounded-full bg-oxblood/20 animate-ping opacity-75" aria-hidden="true" />
                <span className="font-serif text-sm font-bold text-oxblood">×</span>
              </div>
              <div className="mt-1 h-px w-16 bg-line sm:w-24" />
            </div>

            {/* Brand Identity */}
            <div className="animate-converge-right flex flex-col items-center text-center">
              <div className="avatar-interactive grid h-16 w-16 place-items-center border border-ink bg-paper font-serif text-2xl text-ink shadow-sm sm:h-20 sm:w-20 sm:text-3xl">
                {brandName[0]?.toUpperCase() || "B"}
              </div>
              <p className="mt-2 font-serif text-base font-medium text-ink">{brandName}</p>
              <span className="font-mono text-[10px] uppercase text-muted">Campaign Sponsor</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center">
            <h2 className="animate-editorial-reveal font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.92] tracking-[-0.035em] text-ink">
              It&apos;s a Mutual Match.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
              Both parties have expressed explicit interest in collaborating on{" "}
              <strong className="text-ink font-medium">{campaignName}</strong>. A dedicated collaboration desk is now unlocked.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
            <a
              className="btn-tactile group inline-flex min-h-12 items-center justify-center bg-ink px-6 text-xs font-medium uppercase tracking-widest text-paper hover:bg-oxblood gap-2"
              href={`/matches/${matchId}`}
            >
              <span>Open Match Desk</span>
              <span className="icon-arrow-motion">→</span>
            </a>
            {campaignId && (
              <a
                className="btn-tactile inline-flex min-h-12 items-center justify-center border border-line bg-paper px-5 text-xs font-medium uppercase tracking-wider text-ink hover:border-ink"
                href={`/campaigns/${campaignId}`}
              >
                View Campaign Brief
              </a>
            )}
            {creatorId && (
              <a
                className="btn-tactile inline-flex min-h-12 items-center justify-center border border-line bg-paper px-5 text-xs font-medium uppercase tracking-wider text-ink hover:border-ink"
                href={`/creators/${creatorId}`}
              >
                Review Profile
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
