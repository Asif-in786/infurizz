"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Globe,
  Send,
  ArrowLeft,
  Check,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AudienceGrowthChart } from "@/components/ui/AudienceGrowthChart";
import { PlatformIcon } from "@/components/common/PlatformIcon";

interface CreatorDetail {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  category?: string;
  location?: string;
  website?: string;
  contactEmail?: string;
  ratesSummary?: string;
  totalReach: number;
  avgEngagementRate: number;
  socialAccounts: {
    id: string;
    platform: string;
    username: string;
    followersCount: number;
    engagementRate: number;
  }[];
  audienceSnapshots: {
    recordedAt: string;
    followersCount: number;
  }[];
}

export default function BrandCreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;

  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [brandId, setBrandId] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");
  const [campaigns, setCampaigns] = useState<{ id: string; title: string }[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Proposal Form State
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [budget, setBudget] = useState(5000);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdConvId, setCreatedConvId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch brand session
        const authRes = await fetch("/api/auth");
        const authData = await authRes.json();
        const activeBrandId = authData.user?.brandProfileId || "";
        const activeBrandName = authData.user?.companyName || authData.user?.name || "Brand";
        setBrandId(activeBrandId);
        setBrandName(activeBrandName);

        // Fetch brand campaigns if brand session active
        if (activeBrandId) {
          const campRes = await fetch(`/api/campaigns?brandId=${activeBrandId}`);
          const campData = await campRes.json();
          if (campData.campaigns && campData.campaigns.length > 0) {
            setCampaigns(campData.campaigns);
            setSelectedCampaignId(campData.campaigns[0].id);
          }
        }

        // Fetch creator
        const res = await fetch(`/api/creators/${creatorId}`);
        const data = await res.json();
        if (data.creator) {
          setCreator(data.creator);
          setProposalTitle(`Collaboration: ${activeBrandName} Sponsor Package`);
          setDeliverables(`1x Dedicated Video Segment, 1x Cross-Platform Social Announcement`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [creatorId]);

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;

    if (!brandId) {
      setSubmitError("You must be signed in as a registered brand with an active profile to dispatch proposals.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          creatorId: creator.id,
          campaignId: selectedCampaignId || undefined,
          title: proposalTitle,
          description: proposalDescription || `Partnership with ${creator.displayName} for upcoming campaign.`,
          deliverables,
          budgetAmount: budget,
          currency: "USD",
        }),
      });

      if (res.ok) {
        setSubmitError(null);
        const data = await res.json();
        setSubmitSuccess(true);
        if (data.conversationId) {
          setCreatedConvId(data.conversationId);
        }
        setTimeout(() => {
          if (data.conversationId) {
            router.push(`/brand/messages?conversationId=${data.conversationId}`);
          } else {
            router.push("/brand/collaborations");
          }
        }, 1200);
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Failed to submit collaboration proposal.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Network connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-zinc-500 font-mono text-xs">Loading creator audit...</div>;
  }

  if (!creator) {
    return (
      <div className="py-20 text-center space-y-4 font-mono text-xs">
        <p className="text-zinc-400">Creator not found.</p>
        <Link href="/brand/discover">
          <Button variant="outline" size="sm">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const chartData = (creator.audienceSnapshots || []).map((snap) => ({
    label: new Date(snap.recordedAt).toLocaleDateString("en-US", { month: "short" }),
    value: snap.followersCount,
  }));

  const initialCount = chartData.length > 0 ? chartData[0].value : 0;
  const latestCount = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const growthRate = initialCount > 0 ? Math.round(((latestCount - initialCount) / initialCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back button */}
      <Link href="/brand/discover" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-medium">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Creators</span>
      </Link>

      {/* 1. CREATOR OVERVIEW */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-xl bg-zinc-100 border border-zinc-200 p-0.5 shrink-0 overflow-hidden shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creator.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                alt={creator.displayName}
                className="h-full w-full object-cover rounded-[10px]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">{creator.displayName}</h1>
                <Badge variant="outline" className="gap-1 text-zinc-700 border-zinc-200 bg-zinc-50 text-xs py-0.5 font-medium">
                  <Check className="h-3 w-3 text-[#E90000]" />
                  Verified Audience
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">@{creator.handle} · {creator.category}</p>
              <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                {creator.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {creator.location}
                  </span>
                )}
                {creator.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-zinc-400" />
                    <a href={creator.website} target="_blank" rel="noreferrer" className="hover:text-zinc-900 underline">
                      {creator.website}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowProposalForm(!showProposalForm)}
            className="text-xs font-medium gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>{showProposalForm ? "Close Form" : "Send Proposal"}</span>
          </Button>
        </div>

        {creator.bio && (
          <p className="text-sm text-zinc-600 leading-relaxed max-w-3xl">
            {creator.bio}
          </p>
        )}

        {/* Top KPI Cells */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-100 pt-6">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">Total Audience</span>
            <div className="text-2xl font-bold text-zinc-900 mt-1 font-sans">
              {creator.totalReach >= 1000000
                ? `${(creator.totalReach / 1000000).toFixed(2)}M`
                : `${(creator.totalReach / 1000).toFixed(0)}K`}
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">{creator.socialAccounts.length} Connected Platforms</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">Avg. Engagement</span>
            <div className="text-2xl font-bold text-zinc-900 mt-1 font-sans">
              {creator.avgEngagementRate}%
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">Across all accounts</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">Platforms</span>
            <div className="text-2xl font-bold text-zinc-900 mt-1 font-sans">
              {creator.socialAccounts.length}
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">Verified Channels</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70">
            <span className="text-xs text-zinc-500 font-medium block">Estimated Rates</span>
            <div className="text-base font-bold text-zinc-900 mt-1 font-sans">
              {creator.ratesSummary || "$2,500 - $8,000"}
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">Per sponsored package</span>
          </div>
        </div>
      </div>

      {/* 2. PROPOSAL DISPATCH DRAWER */}
      {showProposalForm && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/90 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="border-b border-zinc-200 pb-3">
            <div className="text-xs text-zinc-500 font-medium">
              New Partnership
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mt-0.5">
              Send Collaboration Proposal to {creator.displayName}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Direct proposal dispatcher. Negotiations, deliverables, and terms will be managed inside Infurizz.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#E90000] shrink-0" />
                <span>Proposal sent successfully by {brandName}! Initializing deal conversation...</span>
              </div>
              {createdConvId && (
                <Link href={`/brand/messages?conversationId=${createdConvId}`} className="text-[#E90000] underline font-semibold shrink-0">
                  Open Conversation →
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSendProposal} className="space-y-4 pt-2">
              {submitError && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">
                  {submitError}
                </div>
              )}
              {campaigns.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Link to Campaign</label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  >
                    <option value="">None (Independent Direct Proposal)</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Campaign / Proposal Title</label>
                <input
                  type="text"
                  required
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Required Deliverables</label>
                <input
                  type="text"
                  required
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="e.g. 1x Dedicated YouTube Review, 2x Instagram Story sequences"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Budget ($ USD)</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">Sending Brand</label>
                  <input
                    type="text"
                    disabled
                    value={`${brandName} (Verified)`}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3.5 py-2.5 text-xs text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Brief & Notes</label>
                <textarea
                  rows={3}
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="Outline key campaign goals, audience targets, and preferred timelines..."
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowProposalForm(false)} className="text-xs cursor-pointer">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  className="gap-2 text-xs font-medium cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? "Sending..." : "Send Proposal"}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. PLATFORM BREAKDOWN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
              Connected Platforms ({creator.socialAccounts.length})
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            Connected Data Sources
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creator.socialAccounts.map((acc) => (
            <div key={acc.id} className="p-5 bg-white border border-zinc-200 rounded-xl space-y-3 shadow-xs hover:border-zinc-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={acc.platform} className="h-4 w-4 text-zinc-700" />
                  <span className="font-semibold text-zinc-900 text-xs">
                    {acc.platform.replace("_", " ")}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] text-zinc-700 border-zinc-200 bg-zinc-50 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E90000] mr-1 inline-block" />
                  Verified
                </Badge>
              </div>

              <div className="text-2xl font-bold text-zinc-900 font-sans">
                {acc.followersCount >= 1000000
                  ? `${(acc.followersCount / 1000000).toFixed(2)}M`
                  : `${(acc.followersCount / 1000).toFixed(0)}K`}
              </div>
              <p className="text-xs text-zinc-500 font-mono">@{acc.username}</p>

              <div className="flex justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                <span>Engagement:</span>
                <span className="font-bold text-zinc-900">{acc.engagementRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. AUDIENCE GROWTH */}
      {chartData.length > 1 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Audience Growth
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Total aggregate followers across all connected networks over time.
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-800 border border-zinc-200 bg-zinc-50 px-2.5 py-1 rounded-md">
              {growthRate >= 0 ? `+${growthRate}%` : `${growthRate}%`} Overall Growth
            </span>
          </div>
          <AudienceGrowthChart data={chartData} height={200} />
        </div>
      )}
    </div>
  );
}
