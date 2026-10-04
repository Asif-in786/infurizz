export type FitPart = {
  label: string;
  weight: number;
  awarded: number;
  detail: string;
};

export type FitInput = {
  creatorCategory: string;
  creatorNiche: string;
  creatorLocation: string;
  creatorAudience: string;
  creatorPlatforms: string[];
  campaignCategory: string;
  campaignNiche: string;
  campaignLocation: string;
  campaignAudience: string;
  campaignPlatforms: string[];
};

function norm(value: string) {
  return value.trim().toLowerCase();
}

export function compatibility(input: FitInput): { score: number; parts: FitPart[] } {
  const shared = input.creatorPlatforms.filter((platform) =>
    input.campaignPlatforms.some((item) => norm(item) === norm(platform)),
  );
  const platform: FitPart = shared.length
    ? {
        label: "Platform match",
        weight: 30,
        awarded: 30,
        detail: `Shared: ${shared.join(", ")}`,
      }
    : {
        label: "Platform match",
        weight: 30,
        awarded: 0,
        detail: "No shared platform",
      };

  const categoryMet = norm(input.creatorCategory) === norm(input.campaignCategory);
  const category: FitPart = {
    label: "Category match",
    weight: 25,
    awarded: categoryMet ? 25 : 0,
    detail: categoryMet
      ? input.creatorCategory
      : `${input.creatorCategory} and ${input.campaignCategory}`,
  };

  const audienceMet = norm(input.creatorAudience) === norm(input.campaignAudience);
  const audience: FitPart = {
    label: "Audience fit",
    weight: 25,
    awarded: audienceMet ? 25 : 0,
    detail: audienceMet
      ? input.creatorAudience
      : `${input.creatorAudience} vs ${input.campaignAudience}`,
  };

  const creatorLoc = norm(input.creatorLocation);
  const campaignLoc = norm(input.campaignLocation);
  const locationMet =
    creatorLoc === campaignLoc || creatorLoc === "anywhere" || campaignLoc === "anywhere";
  const location: FitPart = {
    label: "Location fit",
    weight: 10,
    awarded: locationMet ? 10 : 0,
    detail: locationMet
      ? campaignLoc === "anywhere" || creatorLoc === "anywhere"
        ? "Anywhere covers this pair"
        : input.creatorLocation
      : `${input.creatorLocation} and ${input.campaignLocation}`,
  };

  const creatorNiche = norm(input.creatorNiche);
  const campaignNiche = norm(input.campaignNiche);
  const nicheMet =
    creatorNiche === campaignNiche ||
    creatorNiche.includes(campaignNiche) ||
    campaignNiche.includes(creatorNiche);
  const niche: FitPart = {
    label: "Content niche fit",
    weight: 10,
    awarded: nicheMet ? 10 : 0,
    detail: nicheMet
      ? input.campaignNiche
      : `${input.creatorNiche} and ${input.campaignNiche}`,
  };

  const parts = [platform, category, audience, location, niche];
  return { score: parts.reduce((sum, part) => sum + part.awarded, 0), parts };
}
