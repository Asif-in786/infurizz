import { LogoRailWave } from "@/components/logo-rail-wave";

export default function Loading() {
  return (
    <div className="flex min-h-[65vh] w-full flex-col items-center justify-center p-8">
      <LogoRailWave size="md" subtitle="Opening INFURIZZ…" />
    </div>
  );
}
