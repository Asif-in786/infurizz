"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface CollaborationItem {
  id: string;
  title: string;
  description: string;
  deliverables?: string;
  budgetAmount?: number;
  currency: string;
  status: string;
  createdAt: string;
  brand: {
    id: string;
    companyName: string;
    logoUrl?: string;
    industry: string;
  };
  conversations?: { id: string }[];
}

export default function CreatorCollaborationsPage() {
  const [collaborations, setCollaborations] = useState<CollaborationItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchCollaborations = useCallback(async () => {
    try {
      const res = await fetch("/api/collaborations");
      const data = await res.json();
      if (data.collaborations) {
        setCollaborations(data.collaborations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollaborations();
  }, [fetchCollaborations]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/collaborations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, actorRole: "CREATOR" }),
      });
      if (res.ok) {
        fetchCollaborations();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filtered = collaborations.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#E90000]" />
            <span>Partnership Requests</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-1">
            Collaboration Requests
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Review inbound sponsorship proposals, agree on deliverables, and manage active brand campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/creator/messages">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-medium cursor-pointer">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
              <span>Deal Messages</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-3 overflow-x-auto text-xs">
        {["ALL", "PENDING", "IN_PROGRESS", "ACCEPTED", "DECLINED", "COMPLETED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap text-xs font-medium ${
              filter === tab
                ? "bg-[#E90000] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            {tab === "ALL" ? "All" : tab === "IN_PROGRESS" ? "In Progress" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Collaborations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-sm">Loading collaboration requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-zinc-200 bg-white text-zinc-500 text-sm shadow-xs">
            No collaboration requests found under this filter.
          </div>
        ) : (
          filtered.map((collab) => {
            const isPending = collab.status === "PENDING";
            const conversationId = collab.conversations?.[0]?.id;
            return (
              <Card key={collab.id} className="border-zinc-200 bg-white rounded-xl p-6 space-y-4 shadow-xs hover:border-zinc-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 font-bold text-sm shrink-0">
                      {collab.brand.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900">{collab.brand.companyName}</span>
                        <span className="text-xs text-zinc-500">· {collab.brand.industry}</span>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900 mt-1">{collab.title}</h3>
                      <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                        {collab.description}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-xs text-zinc-500 block font-medium">Proposed Budget</span>
                    <div className="text-lg font-bold text-zinc-900 mt-0.5 font-sans">
                      ${collab.budgetAmount?.toLocaleString()} {collab.currency}
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-1.5 text-[11px] font-medium py-0.5 px-2.5 rounded-md ${
                        collab.status === "PENDING"
                          ? "text-amber-700 border-amber-200 bg-amber-50"
                          : collab.status === "IN_PROGRESS" || collab.status === "ACCEPTED"
                          ? "text-zinc-800 border-zinc-200 bg-zinc-100"
                          : collab.status === "DECLINED"
                          ? "text-rose-700 border-rose-200 bg-rose-50"
                          : "text-zinc-600 border-zinc-200 bg-zinc-50"
                      }`}
                    >
                      {collab.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {collab.deliverables && (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 text-xs rounded-lg text-zinc-700">
                    <span className="font-semibold text-zinc-900">Deliverables: </span>
                    <span>{collab.deliverables}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                  <span className="text-xs text-zinc-400">
                    Received: {new Date(collab.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={conversationId ? `/creator/messages?conversationId=${conversationId}` : "/creator/messages"}>
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-medium cursor-pointer">
                        <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Message Brand</span>
                      </Button>
                    </Link>

                    {isPending && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(collab.id, "DECLINED")}
                          className="gap-1.5 text-xs text-zinc-600 hover:text-rose-700 hover:border-rose-300 font-medium cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateStatus(collab.id, "ACCEPTED")}
                          className="gap-1.5 text-xs font-medium cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accept Proposal
                        </Button>
                      </>
                    )}

                    {collab.status === "ACCEPTED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateStatus(collab.id, "IN_PROGRESS")}
                        className="gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Start Production</span>
                      </Button>
                    )}

                    {collab.status === "IN_PROGRESS" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateStatus(collab.id, "COMPLETED")}
                        className="gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Submit Deliverables</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
