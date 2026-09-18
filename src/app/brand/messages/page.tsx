"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name?: string;
    role: string;
  };
}

interface ConversationItem {
  id: string;
  creator: {
    id: string;
    displayName: string;
    handle: string;
    category?: string;
    totalReach: number;
    user: { id: string };
  };
  collaboration?: {
    id: string;
    title: string;
    budgetAmount?: number;
  };
  lastMessageAt: string;
}

function BrandMessagesWorkspace() {
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get("conversationId");

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const [authRes, msgRes] = await Promise.all([
        fetch("/api/auth"),
        fetch("/api/messages"),
      ]);
      const authData = await authRes.json();
      const userId = authData.user?.id;
      if (!userId) {
        setConversations([]);
        setLoading(false);
        return;
      }
      setCurrentUserId(userId);

      const data = await msgRes.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0) {
          setSelectedConvId((prev) => {
            if (targetConvId && data.conversations.some((c: ConversationItem) => c.id === targetConvId)) {
              return targetConvId;
            }
            if (prev && data.conversations.some((c: ConversationItem) => c.id === prev)) {
              return prev;
            }
            return data.conversations[0].id;
          });
        } else {
          setSelectedConvId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [targetConvId]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId, fetchMessages]);

  const activeConv = conversations.find((c) => c.id === selectedConvId);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || sending) return;

    const creatorUserId = activeConv.creator.user.id;
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv.id,
          senderId: currentUserId,
          receiverId: creatorUserId,
          content: inputText.trim(),
        }),
      });

      if (res.ok) {
        setInputText("");
        await fetchMessages(activeConv.id);
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. HEADER */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#E90000]" />
            <span>Direct Messaging</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-1">
            Creator Messages
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Coordinate deliverables, contract terms, and review schedules directly with creators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700 text-xs px-2.5 py-1 font-medium">
            {conversations.length} {conversations.length === 1 ? "Active Thread" : "Active Threads"}
          </Badge>
        </div>
      </div>

      {/* 2. PRIVACY & COMPLIANCE NOTE */}
      <div className="border border-zinc-200 bg-zinc-50/80 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 text-zinc-600">
          <Lock className="h-4 w-4 text-[#E90000] shrink-0" />
          <span>
            Infurizz connects supported platform data to create one unified creator profile. External social-media DMs are never accessed. All brand partnerships occur securely within Infurizz.
          </span>
        </div>
      </div>

      {/* 3. SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-zinc-200 bg-white rounded-xl shadow-xs overflow-hidden min-h-[580px]">
        {/* Left: Threads Directory */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Creators
            </span>
            <span className="text-xs text-zinc-400 font-medium">{conversations.length} Active</span>
          </div>

          <div className="divide-y divide-zinc-100 overflow-y-auto flex-1 max-h-[520px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Loading creator conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No active conversations yet. Proposals sent to creators will initialize threads here.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-zinc-50 border-l-2 border-l-[#E90000]"
                        : "hover:bg-zinc-50/60 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-800 shadow-xs">
                          {conv.creator.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900">
                            {conv.creator.displayName}
                          </h4>
                          <span className="text-xs text-zinc-500">
                            @{conv.creator.handle} · {conv.creator.totalReach >= 1000000 ? `${(conv.creator.totalReach / 1000000).toFixed(1)}M` : `${(conv.creator.totalReach / 1000).toFixed(0)}K`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </span>
                    </div>

                    {conv.collaboration && (
                      <div className="mt-3 p-2.5 bg-white border border-zinc-200 rounded-lg text-xs flex items-center justify-between shadow-xs">
                        <span className="text-zinc-700 font-medium truncate max-w-[180px]">
                          {conv.collaboration.title}
                        </span>
                        {conv.collaboration.budgetAmount && (
                          <span className="text-zinc-900 font-bold shrink-0">
                            ${conv.collaboration.budgetAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Stream & Desk */}
        <div className="lg:col-span-8 flex flex-col bg-zinc-50/30">
          {activeConv ? (
            <>
              {/* Thread Context Banner */}
              <div className="p-4 border-b border-zinc-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900">
                      {activeConv.creator.displayName}
                    </h3>
                    <Badge variant="outline" className="text-xs text-zinc-700 border-zinc-200 bg-zinc-50 font-medium">
                      {activeConv.creator.totalReach >= 1000000 ? `${(activeConv.creator.totalReach / 1000000).toFixed(2)}M` : `${(activeConv.creator.totalReach / 1000).toFixed(0)}K`} Audience
                    </Badge>
                  </div>
                  {activeConv.collaboration && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Collaboration: <span className="text-zinc-800 font-medium">{activeConv.collaboration.title}</span>
                    </p>
                  )}
                </div>

                {activeConv.collaboration?.budgetAmount && (
                  <div className="sm:text-right">
                    <span className="text-xs text-zinc-400 block">Agreed Budget</span>
                    <div className="text-base font-bold text-zinc-900 font-sans">
                      ${activeConv.collaboration.budgetAmount.toLocaleString()} USD
                    </div>
                  </div>
                )}
              </div>

              {/* Message Transcript */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
                {messages.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 text-sm">
                    No messages in this thread yet. Send a message to coordinate terms.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-xs text-zinc-400">
                          <span>{isMe ? "You" : msg.sender.name || "Creator"}</span>
                          <span>·</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div
                          className={`max-w-lg px-4 py-2.5 text-sm leading-relaxed ${
                            isMe
                              ? "bg-[#E90000] text-white font-normal rounded-2xl rounded-tr-xs shadow-xs"
                              : "bg-white text-zinc-900 font-normal rounded-2xl rounded-tl-xs border border-zinc-200/80 shadow-xs"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer */}
              <div className="p-4 border-t border-zinc-100 bg-white">
                <form onSubmit={sendMessage} className="flex gap-2.5">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message or discuss deliverables..."
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!inputText.trim() || sending}
                    className="gap-1.5 px-5 text-xs font-medium py-2.5 cursor-pointer"
                  >
                    <span>{sending ? "Sending..." : "Send"}</span>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
              Select a creator conversation from the left to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-zinc-500">Loading brand messaging desk...</div>}>
      <BrandMessagesWorkspace />
    </Suspense>
  );
}
