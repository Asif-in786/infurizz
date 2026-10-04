"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { clearSkips, expressInterest, skipTarget, type InterestState } from "@/lib/actions";
import { compatibility } from "@/lib/compatibility";
import { CompatibilityList, MatchMoment, Monogram, SampleMark } from "@/components/profile-bits";
import { FormError, primaryButton, quietButton } from "@/components/form-styles";

export type CreatorCard = {
  id: string;
  isDemo: boolean;
  name: string;
  bio: string;
  category: string;
  location: string;
  niche: string;
  audienceRange: string;
  collabPrefs: string;
  platforms: string[];
};

export type CampaignCard = {
  id: string;
  isDemo: boolean;
  brandName: string;
  name: string;
  category: string;
  creatorNiche: string;
  platforms: string[];
  audienceRange: string;
  location: string;
  budgetLabel: string;
  deliverables: string;
  status: string;
};

type Props =
  | {
      mode: "creator";
      me: CreatorCard;
      campaigns: CampaignCard[];
      skipped: number;
    }
  | {
      mode: "brand";
      campaigns: CampaignCard[];
      creators: CreatorCard[];
      hiddenPairs: string[];
      skipped: number;
    };

import { RevolvingBorder } from "@/components/revolving-border";

export function DiscoverDeck(props: Props) {
  const [result, interestAction, pending] = useActionState(expressInterest, null as InterestState | null);
  const [campaignId, setCampaignId] = useState(props.mode === "brand" ? props.campaigns[0]?.id ?? "" : "");
  const [leaving, setLeaving] = useState<"skip" | "interest" | null>(null);

  if (result?.matched && result.matchId) {
    return (
      <MatchMoment
        matchId={result.matchId}
        creatorName={result.creatorName}
        brandName={result.brandName}
        campaignName={result.campaignName}
        creatorId={result.creatorId}
        campaignId={result.campaignId}
      />
    );
  }

  if (props.mode === "brand" && props.campaigns.length === 0) {
    return (
      <Empty
        title="Create a campaign first."
        copy="Discovery compares creators with a campaign you have actually created."
        href="/campaigns/new"
        action="Create campaign"
      />
    );
  }

  const selected =
    props.mode === "brand" ? props.campaigns.find((item) => item.id === campaignId) ?? props.campaigns[0] : null;
  const queue =
    props.mode === "creator"
      ? [...props.campaigns].sort((a, b) => compareCampaigns(props.me, a, b))
      : [...props.creators]
          .filter((creator) => selected && !props.hiddenPairs.includes(`${creator.id}:${selected.id}`))
          .sort((a, b) => compareCreators(selected!, a, b));
  const current = queue[0];

  if (!current || (props.mode === "brand" && !selected)) {
    return (
      <Empty
        title="All caught up!"
        copy="You have reviewed all available profiles in this queue. You can clear your skips to review them again or browse the main directory."
        href="/matches"
        action="View matches"
        extra={props.skipped > 0 ? <ClearSkips /> : null}
      />
    );
  }

  const creator = props.mode === "creator" ? props.me : (current as CreatorCard);
  const campaign = props.mode === "creator" ? (current as CampaignCard) : selected!;
  const currentCategory = props.mode === "creator" ? campaign.category : creator.category;
  const fit = compatibility({
    creatorCategory: creator.category,
    creatorNiche: creator.niche,
    creatorLocation: creator.location,
    creatorAudience: creator.audienceRange,
    creatorPlatforms: creator.platforms,
    campaignCategory: campaign.category,
    campaignNiche: campaign.creatorNiche,
    campaignLocation: campaign.location,
    campaignAudience: campaign.audienceRange,
    campaignPlatforms: campaign.platforms,
  });

  const targetType = props.mode === "creator" ? "campaign" : "creator";
  const targetId = props.mode === "creator" ? campaign.id : creator.id;

  return (
    <div className="grid items-start gap-10 pb-28 lg:grid-cols-[minmax(0,1fr)_300px] lg:pb-0">
      <div
        className={`deck-motion ${
          leaving === "skip" ? "-translate-x-6 opacity-0" : leaving === "interest" ? "-translate-y-4 opacity-0" : "rise"
        }`}
      >
        <RevolvingBorder
          category={currentCategory}
          tilt={false}
          interactive={true}
          contentClassName="p-6 sm:p-8"
        >
          <article>
            <div className="flex items-start justify-between gap-4">
              <SampleMark show={props.mode === "creator" ? campaign.isDemo : creator.isDemo} />
              <span className="border border-line bg-paper px-2.5 py-0.5 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                {queue.length} in this queue
              </span>
            </div>
            <div className="mt-6 flex items-end gap-4 sm:gap-6">
              <div className="avatar-interactive">
                <Monogram name={props.mode === "creator" ? campaign.brandName : creator.name} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted">{props.mode === "creator" ? campaign.brandName : creator.category}</p>
                <h2 className="mt-1 font-serif text-[clamp(2.2rem,6vw,4.2rem)] leading-[0.9] tracking-[-0.04em] break-words">
                  {props.mode === "creator" ? campaign.name : creator.name}
                </h2>
              </div>
            </div>
            {props.mode === "brand" ? <p className="mt-6 max-w-xl text-base leading-7">{creator.bio}</p> : null}
            <dl className="mt-8 divide-y divide-line border-y border-line">
              <Fact label="Category" value={props.mode === "creator" ? campaign.category : creator.category} />
              <Fact label="Creator niche" value={props.mode === "creator" ? campaign.creatorNiche : creator.niche} />
              <Fact
                label="Platforms"
                value={(props.mode === "creator" ? campaign.platforms : creator.platforms).join(", ")}
              />
              <Fact
                label={props.mode === "creator" ? "Audience requirement" : "Audience range entered"}
                value={props.mode === "creator" ? campaign.audienceRange : creator.audienceRange}
              />
              <Fact label="Location" value={props.mode === "creator" ? campaign.location : creator.location} />
              {props.mode === "creator" ? (
                <Fact label="Budget" value={campaign.budgetLabel} />
              ) : (
                <Fact label="Collaboration" value={creator.collabPrefs} />
              )}
              {props.mode === "creator" ? <Fact label="Deliverables" value={campaign.deliverables} /> : null}
              {props.mode === "creator" ? <Fact label="Campaign status" value={campaign.status} /> : null}
            </dl>

            {/* Desktop Action Buttons inside card */}
            <div className="hidden lg:mt-8 lg:flex lg:gap-3">
              <form action={skipTarget} onSubmit={() => setLeaving("skip")}>
                <input type="hidden" name="targetType" value={targetType} />
                <input type="hidden" name="targetId" value={targetId} />
                <button className={`${quietButton} px-6`}>Skip</button>
              </form>
              <form action={interestAction}>
                <input type="hidden" name="creatorId" value={creator.id} />
                <input type="hidden" name="campaignId" value={campaign.id} />
                <button className={`${primaryButton} px-6`} disabled={pending}>
                  {props.mode === "creator" ? "Interested" : "Invite / Express interest"}
                </button>
              </form>
            </div>

            <FormError error={result?.error} />
            {result?.pending ? (
              <p className="mt-4 text-sm text-muted">
                Interest recorded. A match is created only when the other side expresses interest too.
              </p>
            ) : null}
            <p className="mt-6 text-sm">
              <Link
                className="group inline-flex items-center gap-1.5 underline decoration-line underline-offset-4 hover:text-oxblood hover:decoration-oxblood transition-colors"
                href={props.mode === "creator" ? `/campaigns/${campaign.id}` : `/creators/${creator.id}`}
              >
                <span>Open full {props.mode === "creator" ? "campaign" : "profile"}</span>
                <span className="icon-arrow-motion">→</span>
              </Link>
            </p>
          </article>
        </RevolvingBorder>

        {/* Mobile Fixed Bottom Action Bar (safely outside revolving container to prevent clipping) */}
        <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-line bg-paper/95 backdrop-blur-xs px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden shadow-lg">
          <form action={skipTarget} onSubmit={() => setLeaving("skip")}>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <button className={`${quietButton} w-full`}>Skip</button>
          </form>
          <form action={interestAction}>
            <input type="hidden" name="creatorId" value={creator.id} />
            <input type="hidden" name="campaignId" value={campaign.id} />
            <button className={`${primaryButton} w-full px-2 text-center leading-tight`} disabled={pending}>
              {props.mode === "creator" ? "Interested" : "Invite / Express interest"}
            </button>
          </form>
        </div>
      </div>
      <div className="space-y-4">
        {props.mode === "brand" ? (
          <label className="block text-sm text-muted">
            Interest is for this campaign
            <select
              className="mt-2 min-h-12 w-full border-b border-line bg-transparent text-base text-ink"
              value={selected?.id}
              onChange={(event) => setCampaignId(event.target.value)}
            >
              {props.campaigns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.isDemo ? " · Sample" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm leading-6 text-muted">
            Reviewing as {props.me.name}. Compatibility uses the fields saved on your profile.
          </p>
        )}
        <CompatibilityList score={fit.score} parts={fit.parts} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="text-sm leading-6 break-words">{value}</dd>
    </div>
  );
}

function Empty({
  title,
  copy,
  href,
  action,
  extra,
}: {
  title: string;
  copy: string;
  href: string;
  action: string;
  extra?: ReactNode;
}) {
  return (
    <div className="max-w-xl py-6">
      <h2 className="font-serif text-4xl">{title}</h2>
      <p className="mt-3 text-muted">{copy}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className={primaryButton} href={href}>
          {action}
        </Link>
        {extra}
      </div>
    </div>
  );
}

function fitScore(creator: CreatorCard, campaign: CampaignCard) {
  return compatibility({
    creatorCategory: creator.category,
    creatorNiche: creator.niche,
    creatorLocation: creator.location,
    creatorAudience: creator.audienceRange,
    creatorPlatforms: creator.platforms,
    campaignCategory: campaign.category,
    campaignNiche: campaign.creatorNiche,
    campaignLocation: campaign.location,
    campaignAudience: campaign.audienceRange,
    campaignPlatforms: campaign.platforms,
  }).score;
}

function compareCampaigns(creator: CreatorCard, a: CampaignCard, b: CampaignCard) {
  const delta = fitScore(creator, b) - fitScore(creator, a);
  return delta !== 0 ? delta : a.name.localeCompare(b.name);
}

function compareCreators(campaign: CampaignCard, a: CreatorCard, b: CreatorCard) {
  const delta = fitScore(b, campaign) - fitScore(a, campaign);
  return delta !== 0 ? delta : a.name.localeCompare(b.name);
}

function ClearSkips() {
  return (
    <form action={clearSkips}>
      <button className={quietButton}>Show skipped</button>
    </form>
  );
}
