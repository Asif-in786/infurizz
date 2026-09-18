"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PlatformIcon } from "@/components/common/PlatformIcon";

interface SocialAccountItem {
  id: string;
  platform: string;
  username: string;
  followersCount: number;
  engagementRate: number;
  lastSyncedAt: string;
  isConnected: boolean;
}

const ALL_PLATFORMS = [
  { platform: "INSTAGRAM", label: "Instagram", defaultHandle: "creator_studio" },
  { platform: "YOUTUBE", label: "YouTube", defaultHandle: "creator_vlogs" },
  { platform: "X_TWITTER", label: "X (Twitter)", defaultHandle: "creator_feed" },
  { platform: "FACEBOOK", label: "Facebook Page", defaultHandle: "CreatorOfficial" },
  { platform: "LINKEDIN", label: "LinkedIn", defaultHandle: "in/creator-lead" },
  { platform: "WHATSAPP_CHANNEL", label: "WhatsApp Channel", defaultHandle: "CreatorBroadcast" },
];

export default function SocialAccountsPage() {
  const [creatorId, setCreatorId] = useState<string>("");
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMockDataEnabled, setIsMockDataEnabled] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Connect modal state
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("INSTAGRAM");
  const [handleInput, setHandleInput] = useState("creator_pro");
  const [connecting, setConnecting] = useState(false);

  const fetchCreatorAccounts = useCallback(async () => {
    try {
      const [authRes, accRes] = await Promise.all([
        fetch("/api/auth"),
        fetch("/api/social-accounts"),
      ]);
      const authData = await authRes.json();
      const currentCreatorId = authData.user?.creatorProfileId;
      if (!currentCreatorId) {
        setCreatorId("");
        setAccounts([]);
        setLoading(false);
        return;
      }
      setCreatorId(currentCreatorId);

      const data = await accRes.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
      if (typeof data.isMockDataEnabled === "boolean") {
        setIsMockDataEnabled(data.isMockDataEnabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreatorAccounts();
  }, [fetchCreatorAccounts]);

  const handleSync = async (platform: string, username: string) => {
    setSyncingPlatform(platform);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          platform,
          accountIdentifier: username,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Successfully synced ${platform.replace("_", " ")} telemetry!`);
        await fetchCreatorAccounts();
      } else {
        setStatusMessage(`Sync error: ${data.error || "Failed to sync"}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to connect to integration service.");
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleConnectPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          platform: selectedPlatform,
          username: handleInput,
        }),
      });
      if (res.ok) {
        setStatusMessage(`Connected ${selectedPlatform.replace("_", " ")} successfully!`);
        setIsConnectOpen(false);
        await fetchCreatorAccounts();
      } else {
        const errData = await res.json();
        setStatusMessage(`Connection failed: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to connect account.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string, platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform.replace("_", " ")}?`)) return;

    try {
      const res = await fetch(`/api/social-accounts?creatorId=${creatorId}&accountId=${accountId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusMessage(`Disconnected ${platform.replace("_", " ")}.`);
        await fetchCreatorAccounts();
      }
    } catch (err) {
      console.error("Failed to disconnect account:", err);
    }
  };

  const connectedPlatformKeys = new Set(accounts.map((a) => a.platform));
  const unlinkedPlatforms = ALL_PLATFORMS.filter((p) => !connectedPlatformKeys.has(p.platform));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#E90000]" />
            <span>Connected Data Sources</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-1">
            Connected Accounts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {accounts.length === 0 ? (
            <Badge variant="outline" className="text-zinc-600 border-zinc-200 bg-zinc-50 text-[11px] px-2.5 py-1 font-medium">
              ● Not Connected
            </Badge>
          ) : isMockDataEnabled ? (
            <Badge variant="outline" className="text-amber-800 border-amber-200 bg-amber-50 text-[11px] px-2.5 py-1 font-medium">
              ● Sandbox Simulation (Dev Only)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-emerald-800 border-emerald-200 bg-emerald-50 text-[11px] px-2.5 py-1 font-medium">
              ● Connected / Real Telemetry
            </Badge>
          )}
          <Badge variant="outline" className="text-zinc-700 border-zinc-200 bg-zinc-50 text-xs px-2.5 py-1 font-medium">
            {accounts.length} Connected
          </Badge>
          {unlinkedPlatforms.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedPlatform(unlinkedPlatforms[0].platform);
                setHandleInput(unlinkedPlatforms[0].defaultHandle);
                setIsConnectOpen(true);
              }}
              className="text-xs font-medium gap-1.5 cursor-pointer py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Connect Account</span>
            </Button>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4.5 border border-zinc-200 bg-zinc-50/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white border border-zinc-200 text-zinc-800 shrink-0 mt-0.5 rounded-lg shadow-xs">
            <Lock className="h-4 w-4 text-[#E90000]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900">
              Zero DM Access Guarantee · Read-Only Audience Metrics
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">
              Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
            </p>
          </div>
        </div>
        <div className="text-xs text-zinc-600 bg-white px-3 py-1.5 border border-zinc-200 shrink-0 rounded-md font-medium shadow-xs">
          Status: Synchronized
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-xs font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-[#E90000] shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-zinc-400 font-sans text-xs">
            Loading connected social telemetry...
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-xl border border-zinc-200 bg-white text-zinc-500 text-xs space-y-3 shadow-xs">
            <p className="text-zinc-900 font-bold text-sm font-sans">One Creator. Multiple Platforms. One Identity.</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto font-sans">
              Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConnectOpen(true)}
              className="text-xs font-medium gap-1.5 mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Connect First Platform</span>
            </Button>
          </div>
        ) : (
          accounts.map((acc) => {
            const isSyncing = syncingPlatform === acc.platform;
            return (
              <Card key={acc.id} className="border-zinc-200 bg-white p-5 space-y-4 shadow-xs hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                      <PlatformIcon platform={acc.platform} className="h-4 w-4 text-zinc-700" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900">
                        {acc.platform.replace("_", " ")}
                      </h4>
                      <p className="text-[11px] text-zinc-500 font-mono">@{acc.username}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-medium ${isMockDataEnabled ? "text-amber-700 border-amber-200 bg-amber-50" : "text-emerald-700 border-emerald-200 bg-emerald-50"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full mr-1 inline-block ${isMockDataEnabled ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {isMockDataEnabled ? "Sandbox Sim" : "Real Telemetry"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 border-y border-zinc-100 py-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      Audience / Reach
                    </span>
                    <div className="text-base font-bold text-zinc-900 mt-0.5 font-sans">
                      {acc.followersCount >= 1000000
                        ? `${(acc.followersCount / 1000000).toFixed(1)}M`
                        : `${(acc.followersCount / 1000).toFixed(0)}K`}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      Engagement
                    </span>
                    <div className="text-base font-bold text-zinc-900 mt-0.5 font-sans">
                      {acc.engagementRate}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-zinc-400">
                    Synced: {new Date(acc.lastSyncedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDisconnect(acc.id, acc.platform)}
                      title="Disconnect Account"
                      className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(acc.platform, acc.username)}
                      disabled={isSyncing}
                      className="text-[11px] gap-1 py-1 px-2.5 font-medium"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#E90000]" : "text-zinc-500"}`} />
                      <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Connect Channel Modal */}
      {isConnectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md border border-zinc-200 bg-white rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E90000]">
                  Channel Connector
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-0.5">
                  Connect Social Account
                </h3>
              </div>
              <button
                onClick={() => setIsConnectOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnectPlatform} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => {
                    setSelectedPlatform(e.target.value);
                    const found = ALL_PLATFORMS.find((p) => p.platform === e.target.value);
                    if (found) setHandleInput(found.defaultHandle);
                  }}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                >
                  {unlinkedPlatforms.map((p) => (
                    <option key={p.platform} value={p.platform}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">Handle / Account Identifier</label>
                <input
                  type="text"
                  required
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="e.g. username"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500 space-y-1">
                <div className="font-semibold text-zinc-800 text-[11px]">
                  Audience & Performance Data Only
                </div>
                <p>
                  Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsConnectOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={connecting}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{connecting ? "Connecting..." : "Authorize Channel"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
