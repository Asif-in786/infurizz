"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileBottomNavProps {
  signedIn?: boolean;
  role?: string | null;
}

export function MobileBottomNav({ signedIn = false, role }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-transform duration-200 ${
            active ? "scale-110 stroke-oxblood fill-oxblood/10" : "stroke-ink/70 fill-none"
          }`}
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      active: pathname === "/",
    },
    {
      href: "/discover",
      label: "Discover",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-transform duration-200 ${
            active ? "scale-110 stroke-oxblood fill-oxblood/10" : "stroke-ink/70 fill-none"
          }`}
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
      active: pathname === "/discover" || pathname.startsWith("/creators"),
    },
    {
      href: "/posts",
      label: "Feed",
      badge: "Live",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-transform duration-200 ${
            active ? "scale-110 stroke-oxblood fill-oxblood/10" : "stroke-ink/70 fill-none"
          }`}
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
      active: pathname === "/posts",
    },
    {
      href: "/live-example",
      label: "Demo",
      pulse: true,
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-transform duration-200 ${
            active ? "scale-110 stroke-oxblood fill-oxblood/10" : "stroke-ink/70 fill-none"
          }`}
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
          <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
        </svg>
      ),
      active: pathname === "/live-example",
    },
    {
      href: signedIn ? "/account" : "/join",
      label: signedIn ? "Account" : "Join",
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-transform duration-200 ${
            active ? "scale-110 stroke-oxblood fill-oxblood/10" : "stroke-ink/70 fill-none"
          }`}
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      active: pathname === "/account" || pathname === "/join" || pathname === "/login",
    },
  ];

  return (
    <aside
      aria-label="Mobile Navigation Bar"
      className="fixed inset-x-2 sm:inset-x-3 bottom-2.5 sm:bottom-3 z-40 mx-auto max-w-md lg:hidden"
    >
      <nav className="grid grid-cols-5 w-full items-center rounded-2xl border border-line/90 bg-card/95 px-1 py-1.5 shadow-[0_12px_32px_rgba(22,20,17,0.16)] backdrop-blur-md">
        {navItems.map((item) => {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex min-h-[42px] w-full flex-col items-center justify-center rounded-xl px-0.5 py-1 transition-all duration-150 active:scale-90 ${
                item.active ? "bg-paper text-oxblood shadow-xs" : "text-muted hover:text-ink"
              }`}
            >
              {/* Optional Pulse or Badge */}
              {item.pulse && (
                <span className="absolute top-1 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oxblood opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-oxblood" />
                </span>
              )}

              {item.badge && (
                <span className="absolute -top-1 right-0.5 rounded-full bg-oxblood px-1 py-0.2 text-[7.5px] font-bold text-paper">
                  {item.badge}
                </span>
              )}

              <div className="flex h-4.5 w-4.5 items-center justify-center">
                {item.icon(item.active)}
              </div>

              <span
                className={`mt-0.5 font-mono text-[9px] tracking-tight truncate max-w-full ${
                  item.active ? "font-semibold text-oxblood" : "text-muted"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
