"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PlatformIcon } from "@/components/common/PlatformIcon";

interface CreatorItem {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  category?: string;
  location?: string;
  totalReach: number;
  avgEngagementRate: number;
  ratesSummary?: string;
  socialAccounts: {
    id: string;
    platform: string;
    username: string;
    followersCount: number;
    engagementRate: number;
  }[];
}

export default function CreatorDiscoveryPage() {
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [minReach, setMinReach] = useState<number>(0);

  const fetchCreators = useCallback(async () => {
    try {
      const res = await fetch("/api/creators");
      const data = await res.json();
      if (data.creators) {
        setCreators(data.creators);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const categories = [
    "ALL",
    "Tech & Software",
    "Gaming & Esports",
    "Fashion & Beauty",
    "Finance & Crypto",
    "Health & Fitness",
    "Lifestyle & Travel",
  ];

  const filteredCreators = creators.filter((c) => {
    const matchesSearch =
      searchQuery === "" ||
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.bio && c.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || c.category === selectedCategory;

    const matchesPlatform =
      selectedPlatform === "ALL" ||
      c.socialAccounts.some(
        (a) => a.platform.toUpperCase() === selectedPlatform.toUpperCase()
      );

    const matchesReach = c.totalReach >= minReach;

    return matchesSearch && matchesCategory && matchesPlatform && matchesReach;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 1. DIRECTORY HEADER */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#E90000]" />
            <span>Creator Marketplace</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-1">
            Find the Right Creators
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Explore verified creators across multiple platforms and send direct collaboration proposals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700 text-xs px-2.5 py-1 font-medium">
            {filteredCreators.length} {filteredCreators.length === 1 ? "Creator" : "Creators"} Found
          </Badge>
        </div>
      </div>

      {/* 2. SEARCH & FILTER STRIP */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-xs">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators, niches, or keywords..."
            className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-100">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap text-xs font-medium ${
                  selectedCategory === cat
                    ? "bg-[#E90000] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Platform and Reach Filter Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium">Platform:</span>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="ALL">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="X_TWITTER">X / Twitter</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="WHATSAPP_CHANNEL">WhatsApp</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium">Min Audience:</span>
              <select
                value={minReach}
                onChange={(e) => setMinReach(Number(e.target.value))}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                <option value={0}>Any Audience</option>
                <option value={500000}>500K+ Total</option>
                <option value={1000000}>1M+ Total</option>
                <option value={2000000}>2M+ Total</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CREATOR DIRECTORY GRID */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-sm">
          Loading creator directory...
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="py-20 text-center rounded-xl border border-zinc-200 bg-white text-zinc-500 text-sm shadow-xs">
          No creators match your current search filters. Try broadening your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCreators.map((creator) => (
            <div
              key={creator.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors space-y-4 shadow-xs"
            >
              {/* Creator Masthead */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={creator.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                        alt={creator.displayName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-zinc-900 leading-tight">
                          {creator.displayName}
                        </h3>
                        <Check className="h-3.5 w-3.5 text-[#E90000]" />
                      </div>
                      <span className="text-xs text-zinc-500">@{creator.handle}</span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs border-zinc-200 bg-zinc-50 text-zinc-700 font-medium">
                    {creator.category?.split(" ")[0] || "Creator"}
                  </Badge>
                </div>

                {creator.bio && (
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {creator.bio}
                  </p>
                )}

                {/* Key Aggregated Numbers Cell */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70">
                  <div>
                    <span className="text-xs text-zinc-500 font-medium block">
                      Total Audience
                    </span>
                    <div className="text-xl font-bold text-zinc-900 mt-0.5 font-sans">
                      {creator.totalReach >= 1000000
                        ? `${(creator.totalReach / 1000000).toFixed(2)}M`
                        : `${(creator.totalReach / 1000).toFixed(0)}K`}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 font-medium block">
                      Avg. Engagement
                    </span>
                    <div className="text-xl font-bold text-zinc-900 mt-0.5 font-sans">
                      {creator.avgEngagementRate}%
                    </div>
                  </div>
                </div>

                {/* Verified Platforms Breakdown Strip */}
                <div className="space-y-2">
                  <span className="text-xs text-zinc-500 font-medium block">
                    Connected Platforms ({creator.socialAccounts.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {creator.socialAccounts.map((acc) => (
                      <span
                        key={acc.id}
                        className="inline-flex items-center gap-1.5 text-xs bg-white border border-zinc-200 px-2 py-1 text-zinc-700 rounded-md shadow-xs"
                      >
                        <PlatformIcon platform={acc.platform} className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-semibold text-zinc-900">
                          {acc.followersCount >= 1000000
                            ? `${(acc.followersCount / 1000000).toFixed(1)}M`
                            : `${(acc.followersCount / 1000).toFixed(0)}K`}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-zinc-100">
                <Link href={`/brand/creators/${creator.handle}`} className="w-full block">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-medium gap-1.5 py-2 cursor-pointer"
                  >
                    <span>View Profile & Propose</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
