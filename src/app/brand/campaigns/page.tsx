"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  Pause,
  Play,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface CampaignItem {
  id: string;
  title: string;
  description: string;
  budget?: number;
  currency: string;
  targetCategory?: string;
  targetPlatforms?: string;
  status: string;
  createdAt: string;
  collaborations: {
    id: string;
    creator: {
      displayName: string;
      handle: string;
      totalReach: number;
    };
  }[];
}

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [brandId, setBrandId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(15000);
  const [targetCategory, setTargetCategory] = useState("Tech & Software");
  const [targetPlatforms, setTargetPlatforms] = useState("YOUTUBE,INSTAGRAM,X_TWITTER");

  const fetchCampaigns = useCallback(async () => {
    try {
      const [authRes, campRes] = await Promise.all([
        fetch("/api/auth"),
        fetch("/api/campaigns"),
      ]);
      const authData = await authRes.json();
      const currentBrandId = authData.user?.brandProfileId;
      if (!currentBrandId) {
        setBrandId("");
        setCampaigns([]);
        setLoading(false);
        return;
      }
      setBrandId(currentBrandId);

      const data = await campRes.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          title,
          description,
          budget,
          currency: "USD",
          targetCategory,
          targetPlatforms,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setDescription("");
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (campaignId: string, status: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Error updating campaign status:", err);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign? Linked proposals will remain.")) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Error deleting campaign:", err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Campaign Manager</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Organize multi-creator influencer activations, set campaign deliverables, and track budget utilization
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Campaign</span>
        </Button>
      </div>

      {/* New Campaign Modal / Card */}
      {showModal && (
        <Card className="border-zinc-200 bg-white rounded-xl shadow-xs p-6 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base font-bold text-zinc-900">Create New Brand Campaign</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Define campaign targets to invite creators from our verified directory
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateCampaign} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Campaign Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Flagship Product Launch"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Allocated Budget ($ USD)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Target Category</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                >
                  <option value="Tech & Software">Tech & Software</option>
                  <option value="Gaming & Esports">Gaming & Esports</option>
                  <option value="Fashion & Beauty">Fashion & Beauty</option>
                  <option value="Finance & Crypto">Finance & Crypto</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Target Social Platforms</label>
              <input
                type="text"
                value={targetPlatforms}
                onChange={(e) => setTargetPlatforms(e.target.value)}
                placeholder="YOUTUBE,INSTAGRAM,X_TWITTER"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Campaign Brief</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline product focus, target demographics, and required talking points..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-medium">
                Publish Campaign
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-zinc-200 bg-white text-zinc-500 text-xs shadow-xs">
            No active campaigns found. Create one to get started.
          </div>
        ) : (
          campaigns.map((camp) => (
            <Card key={camp.id} className="border-zinc-200 bg-white rounded-xl p-6 space-y-4 shadow-xs hover:border-zinc-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900">{camp.title}</h3>
                    <Badge variant="outline" className="text-[10px] border-zinc-200 bg-zinc-50 text-zinc-700 font-medium">
                      {camp.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-600 max-w-2xl leading-relaxed">
                    {camp.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Campaign Budget</span>
                  <div className="text-lg font-bold text-zinc-900 font-sans mt-0.5">
                    ${camp.budget?.toLocaleString()} {camp.currency}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                <div>
                  <span className="text-zinc-400">Category: </span>
                  <strong className="text-zinc-800">{camp.targetCategory}</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Channels: </span>
                  <strong className="text-zinc-800">{camp.targetPlatforms}</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Collaborators: </span>
                  <strong className="text-zinc-800">{camp.collaborations?.length || 0} Assigned</strong>
                </div>
              </div>

              {camp.collaborations && camp.collaborations.length > 0 && (
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-500">Sponsored Creator:</span>
                    <strong className="text-zinc-900">
                      {camp.collaborations[0].creator.displayName} (@{camp.collaborations[0].creator.handle})
                    </strong>
                  </div>
                  <Link href="/brand/collaborations" className="text-[#E90000] hover:underline text-[11px] font-medium">
                    View Deliverables →
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-xs">
                <span className="text-zinc-400">
                  Created {new Date(camp.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {camp.status === "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(camp.id, "PAUSED")}
                      className="gap-1 text-[11px] py-1 px-2.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
                    >
                      <Pause className="h-3 w-3" />
                      <span>Pause</span>
                    </Button>
                  )}
                  {camp.status === "PAUSED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(camp.id, "ACTIVE")}
                      className="gap-1 text-[11px] py-1 px-2.5 text-zinc-700 hover:text-zinc-900 cursor-pointer"
                    >
                      <Play className="h-3 w-3" />
                      <span>Resume</span>
                    </Button>
                  )}
                  {camp.status !== "COMPLETED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(camp.id, "COMPLETED")}
                      className="gap-1 text-[11px] py-1 px-2.5 text-zinc-600 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Complete</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCampaign(camp.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 cursor-pointer"
                    title="Delete Campaign"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
