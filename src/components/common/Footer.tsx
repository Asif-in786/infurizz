import Link from "next/link";
import { Logo } from "@/components/common/Logo";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white py-12 text-zinc-500 text-xs">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" aria-label="INFURIZZ Home" className="flex items-center">
            <Logo size="xs" />
          </Link>
          <span className="text-zinc-300">·</span>
          <span className="text-zinc-600 font-medium">One Creator. Multiple Platforms. One Identity.</span>
          <span className="text-zinc-300">·</span>
          <span>© {new Date().getFullYear()} INFURIZZ. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500">
          <span>Supported Data Sources</span>
          <span className="text-zinc-300">·</span>
          <span>Zero DM Scraping</span>
          <span className="text-zinc-300">·</span>
          <span>Creator & Brand Workspace</span>
        </div>
      </div>
    </footer>
  );
}
