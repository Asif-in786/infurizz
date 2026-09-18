"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Share2,
  BarChart3,
  Briefcase,
  MessageSquare,
  ArrowRightLeft,
  Bell,
  LogOut,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/common/Logo";
import { clsx } from "clsx";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function CreatorNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [creatorReach, setCreatorReach] = useState<string | null>(null);
  const [initials, setInitials] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth?role=CREATOR");
        const data = await res.json();
        if (data.user) {
          setCreatorName(data.user.name || "Creator");
          const total = data.user.totalReach || 0;
          if (total >= 1000000) {
            setCreatorReach(`${(total / 1000000).toFixed(2)}M REACH`);
          } else if (total >= 1000) {
            setCreatorReach(`${Math.round(total / 1000)}K REACH`);
          } else {
            setCreatorReach(`${total} REACH`);
          }
          const words = (data.user.name || "CR").split(" ");
          const inits = words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0].slice(0, 2);
          setInitials(inits.toUpperCase());
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadAuth();
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    }
    setShowNotifs(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchToBrand = () => {
    router.push("/brand/dashboard");
  };

  const links = [
    { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/creator/profile", label: "Profile", icon: User },
    { href: "/creator/social-accounts", label: "Social Accounts", icon: Share2 },
    { href: "/creator/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/creator/collaborations", label: "Collaborations", icon: Briefcase },
    { href: "/creator/messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center group py-1" aria-label="INFURIZZ Home">
              <Logo size="sm" priority />
            </Link>
            <Badge variant="outline" className="gap-1.5 py-0.5 text-xs border-zinc-200 bg-zinc-50 text-zinc-700 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E90000]" />
              Creator Portal
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#E90000] text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-zinc-200 bg-white shadow-xl z-50 p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="font-semibold text-zinc-900 text-xs">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-[#E90000] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Check className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-zinc-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={clsx(
                            "py-2 px-2 rounded-lg space-y-1 transition-colors cursor-pointer",
                            notif.isRead ? "hover:bg-zinc-50" : "bg-zinc-50/80 hover:bg-zinc-100"
                          )}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className={clsx("truncate", notif.isRead ? "font-medium text-zinc-700" : "font-semibold text-zinc-900")}>
                              {notif.title}
                            </span>
                            {!notif.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#E90000] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-600 leading-tight">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-zinc-400 block">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSwitchToBrand}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 transition-colors font-medium cursor-pointer"
            >
              <ArrowRightLeft className="h-3 w-3" />
              Switch to Brand
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200 text-xs">
              <div className="h-8 w-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-800 text-xs">
                {initials || "CR"}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-semibold text-zinc-900 text-xs leading-none">
                  {creatorName ?? "Creator"}
                </div>
                <div className="text-xs text-zinc-500 font-medium mt-0.5">
                  {creatorReach ?? "—"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Subnav for Creator App */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 -mb-px border-t border-zinc-100 text-xs">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs",
                  isActive
                    ? "bg-[#E90000] text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
