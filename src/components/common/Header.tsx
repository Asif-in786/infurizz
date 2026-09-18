"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export function Header() {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith("/creator") || pathname?.startsWith("/brand");

  if (isPortal) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center group py-1" aria-label="INFURIZZ Home">
            <Logo size="sm" priority />
          </Link>

          <Badge variant="outline" className="hidden lg:inline-flex text-xs text-zinc-600 border-zinc-200 bg-zinc-50 font-normal">
            One Creator. Multiple Platforms. One Identity.
          </Badge>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <Link href="/#how-it-works" className="hover:text-zinc-900 transition-colors">
            How It Works
          </Link>
          <Link href="/#creators" className="hover:text-zinc-900 transition-colors">
            For Creators
          </Link>
          <Link href="/#brands" className="hover:text-zinc-900 transition-colors">
            For Brands
          </Link>
          <Link href="/#collaboration" className="hover:text-zinc-900 transition-colors">
            Collaboration
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-2 transition-colors">
            Sign In
          </Link>
          <Link href="/creator/dashboard">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs cursor-pointer">
              Creator Portal
            </Button>
          </Link>
          <Link href="/brand/discover">
            <Button variant="primary" size="sm" className="text-xs gap-1.5 cursor-pointer">
              <span>Brand Discovery</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
