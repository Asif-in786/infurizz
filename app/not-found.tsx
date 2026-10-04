import Link from "next/link";
import { Shell } from "@/components/page-intro";

export default function NotFound() {
  return (
    <Shell>
      <h1 className="font-serif text-5xl">That page is not here.</h1>
      <Link className="mt-6 inline-block text-sm underline underline-offset-4" href="/">
        Home
      </Link>
    </Shell>
  );
}
