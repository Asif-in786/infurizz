"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/actions";

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

const publicLinks: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Creators" },
  { href: "/brands", label: "Brands" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/live-example", label: "Live Example" },
  { href: "/for-brands", label: "For Brands" },
  { href: "/for-creators", label: "For Creators" },
];

const creatorLinks: NavItem[] = [
  { href: "/posts", label: "Posts" },
  { href: "/discover", label: "Discover" },
  { href: "/live-example", label: "Live Example" },
  { href: "/conversations", label: "Messages" },
  { href: "/proposals", label: "Proposals" },
  { href: "/analytics", label: "Analytics" },
  { href: "/account", label: "Profile" },
];

const brandLinks: NavItem[] = [
  { href: "/posts", label: "Posts" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/discover", label: "Discover" },
  { href: "/live-example", label: "Live Example" },
  { href: "/conversations", label: "Messages" },
  { href: "/account", label: "Account" },
];

export function SiteHeader({
  signedIn,
  name,
  role,
}: {
  signedIn: boolean;
  name: string | null;
  role: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Dynamic role-based navigation links
  const links = !signedIn
    ? publicLinks
    : role === "CREATOR"
    ? creatorLinks
    : role === "BRAND"
    ? brandLinks
    : publicLinks;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={signedIn ? (role === "CREATOR" ? "/posts" : "/posts") : "/"}
          className="group relative flex items-center gap-2.5 py-1 select-none"
          aria-label="INFURIZZ Home"
        >
          {/* Brand Mark Emblem with interactive spring rotation */}
          <div className="relative flex items-center justify-center">
            <Image
              src="/brand/infurizz-mark.png"
              alt=""
              width={34}
              height={34}
              className="h-8 w-auto object-contain transition-transform duration-300 ease-out group-hover:rotate-6 group-hover:scale-110"
              priority
            />
          </div>
          {/* Brand Wordmark with locomotive rail beam micro-reveal */}
          <div className="relative flex flex-col items-start justify-center">
            <Image
              src="/brand/infurizz-wordmark.png"
              alt="INFURIZZ"
              width={96}
              height={22}
              className="h-[18px] w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
              priority
            />
            {/* Subtle micro-rail track under brand logo that activates on hover */}
            <span
              className="relative mt-0.5 h-[2px] w-full overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            >
              <span className="absolute inset-0 bg-ink/20" />
              <span className="absolute inset-0 animate-rail-track-flow bg-[repeating-linear-gradient(90deg,rgba(22,20,17,0.5)_0px,rgba(22,20,17,0.5)_1px,transparent_1px,transparent_6px)]" />
              <span className="absolute top-0 h-full w-6 -translate-x-full animate-rail-beam bg-gradient-to-r from-transparent via-[#6f2e2a] to-[#f59e0b]" />
            </span>
          </div>
        </Link>

        {/* Role-Based Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} pathname={pathname}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!signedIn ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/login" className="btn-tactile px-3 py-1.5 text-sm text-ink hover:text-oxblood">
                Log in
              </Link>
              <Link href="/join" className="btn-tactile bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-oxblood">
                Join INFURIZZ
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="border border-line bg-card px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-oxblood">
                {role === "CREATOR" ? "Creator" : role === "BRAND" ? "Brand" : "Member"}
              </span>
              <form action={logout}>
                <button type="submit" className="text-xs text-muted hover:text-ink">
                  Log out
                </button>
              </form>
            </div>
          )}

          <button
            type="button"
            className="flex min-h-11 items-center gap-2 px-2 text-xs font-mono uppercase tracking-wider text-ink transition-colors hover:text-oxblood lg:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation menu"
          >
            <div className="flex h-3.5 w-4 flex-col justify-between">
              <span
                className={`h-0.5 w-full bg-current transition-transform duration-300 ${
                  open ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full bg-current transition-opacity duration-300 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full bg-current transition-transform duration-300 ${
                  open ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </div>
            <span>{open ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation with smooth staggered reveal */}
      {open ? (
        <nav className="animate-fade-up border-t border-line bg-paper px-4 py-5 shadow-sm lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col divide-y divide-line/70">
            {links.map((link, idx) => (
              <li
                key={link.href}
                className="animate-fade-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Link
                  href={link.href}
                  className="flex min-h-12 items-center font-serif text-2xl text-ink transition-colors active:text-oxblood"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {!signedIn ? (
              <div className="mt-5 flex flex-col gap-2.5 pt-4">
                <Link
                  href="/login"
                  className="btn-tactile flex min-h-11 items-center justify-center border border-line bg-card text-xs font-medium uppercase tracking-wider text-ink"
                >
                  Log in
                </Link>
                <Link
                  href="/join"
                  className="btn-tactile flex min-h-11 items-center justify-center bg-ink text-xs font-medium uppercase tracking-widest text-paper hover:bg-oxblood"
                >
                  Join INFURIZZ
                </Link>
              </div>
            ) : (
              <div className="mt-5 pt-3">
                <form action={logout}>
                  <button
                    type="submit"
                    className="btn-tactile flex min-h-11 w-full items-center justify-center border border-line bg-card text-xs font-mono uppercase tracking-wider text-muted hover:text-ink"
                  >
                    Log out ({name})
                  </button>
                </form>
              </div>
            )}
          </ul>
        </nav>
      ) : null}

      {/* Secondary Sub-Bar for Signed-in state */}
      {signedIn ? (
        <div className="border-t border-line bg-card/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-xs text-muted sm:px-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Signed in as <strong className="text-ink">{name}</strong></span>
              <span className="text-line">|</span>
              <span className="text-oxblood font-medium">{role === "CREATOR" ? "Creator Network" : role === "BRAND" ? "Brand Desk" : "Account"}</span>
            </div>
            <div className="flex items-center gap-4">
              {role === "CREATOR" ? (
                <>
                  <Link href="/proposals" className="text-ink underline decoration-line underline-offset-4 hover:text-oxblood">
                    My Proposals
                  </Link>
                  <Link href="/analytics" className="text-ink underline decoration-line underline-offset-4 hover:text-oxblood">
                    Social Analytics
                  </Link>
                </>
              ) : role === "BRAND" ? (
                <>
                  <Link href="/campaigns/new" className="text-oxblood font-medium hover:underline">
                    + Start a Campaign
                  </Link>
                  <Link href="/campaigns" className="text-ink underline decoration-line underline-offset-4 hover:text-oxblood">
                    Manage Briefs
                  </Link>
                </>
              ) : null}
              <Link href="/account" className="text-ink underline decoration-line underline-offset-4 hover:text-oxblood">
                Settings
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`group relative py-1 text-sm transition-colors ${
        active ? "font-semibold text-ink" : "text-muted hover:text-ink"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span>{children}</span>
      <span
        className={`absolute bottom-0 left-0 h-[1.5px] bg-ink transition-all duration-300 ease-out ${
          active ? "w-full" : "w-0 group-hover:w-full group-hover:bg-oxblood"
        }`}
      />
    </Link>
  );
}

export function SiteFooter({ role }: { role?: string | null }) {
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Link href="/" className="group flex items-center gap-2.5 select-none" aria-label="INFURIZZ Home">
            <Image
              src="/brand/infurizz-mark.png"
              alt=""
              width={30}
              height={30}
              className="h-7 w-auto object-contain transition-transform duration-300 ease-out group-hover:rotate-6 group-hover:scale-105"
            />
            <Image
              src="/brand/infurizz-wordmark.png"
              alt="INFURIZZ"
              width={88}
              height={20}
              className="h-4 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
            />
          </Link>
          <p className="text-xs text-muted">Professional Creator Network, Marketplace &amp; Analytics Layer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs text-muted">
          {role === "CREATOR" ? (
            <>
              <Link href="/posts" className="hover:text-ink">Posts</Link>
              <Link href="/discover" className="hover:text-ink">Discover</Link>
              <Link href="/live-example" className="hover:text-ink">Live Example</Link>
              <Link href="/proposals" className="hover:text-ink">Proposals</Link>
              <Link href="/analytics" className="hover:text-ink">Analytics</Link>
              <Link href="/conversations" className="hover:text-ink">Messages</Link>
            </>
          ) : role === "BRAND" ? (
            <>
              <Link href="/posts" className="hover:text-ink">Posts</Link>
              <Link href="/campaigns" className="hover:text-ink">Campaigns</Link>
              <Link href="/discover" className="hover:text-ink">Discover</Link>
              <Link href="/live-example" className="hover:text-ink">Live Example</Link>
              <Link href="/conversations" className="hover:text-ink">Messages</Link>
            </>
          ) : (
            <>
              <Link href="/discover" className="hover:text-ink">Creators</Link>
              <Link href="/brands" className="hover:text-ink">Brands</Link>
              <Link href="/campaigns" className="hover:text-ink">Campaigns</Link>
              <Link href="/live-example" className="hover:text-ink">Live Example</Link>
              <Link href="/for-creators" className="hover:text-ink">For Creators</Link>
              <Link href="/for-brands" className="hover:text-ink">For Brands</Link>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
