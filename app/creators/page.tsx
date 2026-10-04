import { redirect } from "next/navigation";

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();

  redirect(`/discover${queryString ? `?${queryString}` : ""}`);
}
