import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { DEMO_PASSWORD } from "../lib/options";

const prisma = new PrismaClient();

const creators = [
  {
    email: "mira@demo.infurizz.local",
    name: "Mira Sen",
    username: "mira.sen",
    bio: "Sample creator profile. Mira films weeknight cooking and small supper clubs.",
    category: "Food",
    location: "Mumbai",
    niche: "Recipes and supper clubs",
    audienceRange: "10k–50k",
    collabPrefs: "Hosted dinners and short recipe films",
    languages: ["English", "Hindi"],
    contentTypes: ["Recipe Video", "Supper Club Film", "Kitchen Stills"],
    socials: [
      { platform: "Instagram", handle: "@mira.sen.sample", audienceNote: "Sample handle", isSample: true },
      { platform: "YouTube", handle: "@MiraCooksSample", audienceNote: "Sample handle", isSample: true },
    ],
    services: [
      {
        title: "Weeknight Recipe Reel",
        description: "High-energy 60-second recipe reel featuring step-by-step cooking, ingredient callouts, and 30-day story highlight.",
        platform: "Instagram",
        price: 450,
        turnaroundDays: 4,
        deliverables: "1x Instagram Reel (9:16), ingredient list in caption, 2x Story posts",
        revisions: 1,
        isActive: true,
      },
      {
        title: "Hosted Supper Club Film",
        description: "Cinematic long-form cooking and dining episode covering meal preparation, dining table styling, and organic brand integration.",
        platform: "YouTube",
        price: 1200,
        turnaroundDays: 10,
        deliverables: "1x 8–12 minute dedicated YouTube video, pinned comment, description link",
        revisions: 2,
        isActive: true,
      },
    ],
    portfolio: [
      {
        title: "Monsoon Chai Cake Series",
        platform: "Instagram",
        description: "Three-part seasonal baking series focusing on cast-iron cookware and artisanal spices.",
        mediaUrl: null,
        externalUrl: "https://instagram.com",
        sortOrder: 1,
      },
      {
        title: "Sunday Table in Bandra",
        platform: "YouTube",
        description: "Documentary-style supper club dinner film with natural kitchen lighting and minimal narration.",
        mediaUrl: null,
        externalUrl: "https://youtube.com",
        sortOrder: 2,
      },
    ],
  },
  {
    email: "jonah@demo.infurizz.local",
    name: "Jonah Hale",
    username: "jonahhale",
    bio: "Sample creator profile. Jonah reviews quiet software and talks to independent founders.",
    category: "Technology",
    location: "Austin",
    niche: "Workspace tools",
    audienceRange: "50k–250k",
    collabPrefs: "One considered review film, not a blast of integrations",
    languages: ["English"],
    contentTypes: ["Workspace Review", "Ergonomics Study", "Desk Photography"],
    socials: [
      { platform: "YouTube", handle: "@JonahHaleSample", audienceNote: "Sample handle", isSample: true },
      { platform: "LinkedIn", handle: "jonah-hale-sample", audienceNote: "Sample handle", isSample: true },
    ],
    services: [
      {
        title: "Deep-Dive Workspace Review",
        description: "Rigorous 12-15 minute video analyzing build quality, daily workflow utility, and software integration.",
        platform: "YouTube",
        price: 2500,
        turnaroundDays: 14,
        deliverables: "1x 12-15 minute YouTube video, custom thumbnail, permanent affiliate link",
        revisions: 1,
        isActive: true,
      },
      {
        title: "Quiet Desk Breakdown",
        description: "Editorial photo-essay covering hardware ergonomics, cable layout, and clean desk principles.",
        platform: "LinkedIn",
        price: 800,
        turnaroundDays: 5,
        deliverables: "1x Long-form LinkedIn article + 3 high-res setup stills",
        revisions: 1,
        isActive: true,
      },
    ],
    portfolio: [
      {
        title: "Mechanical Keyboard Architecture",
        platform: "YouTube",
        description: "Comprehensive sound profile analysis and switch breakdown for custom mechanical keyboards.",
        mediaUrl: null,
        externalUrl: "https://youtube.com",
        sortOrder: 1,
      },
      {
        title: "The Distraction-Free Desk",
        platform: "LinkedIn",
        description: "Viral case study on developer productivity and minimalist workstation design.",
        mediaUrl: null,
        externalUrl: "https://linkedin.com",
        sortOrder: 2,
      },
    ],
  },
  {
    email: "asha@demo.infurizz.local",
    name: "Asha Idris",
    username: "ashamoves",
    bio: "Sample creator profile. Asha teaches strength sessions that fit in a small room.",
    category: "Fitness",
    location: "London",
    niche: "Training routines",
    audienceRange: "10k–50k",
    collabPrefs: "Short training videos with clear form",
    languages: ["English"],
    contentTypes: ["Movement Cues", "Strength Routine", "Form Breakdown"],
    socials: [
      { platform: "Instagram", handle: "@asha.moves.sample", audienceNote: "Sample handle", isSample: true },
      { platform: "TikTok", handle: "@ashamoves.sample", audienceNote: "Sample handle", isSample: true },
    ],
    services: [
      {
        title: "Form Breakdown Reel",
        description: "Focused movement tutorial dissecting lift technique, joint angles, and common postural mistakes.",
        platform: "Instagram",
        price: 550,
        turnaroundDays: 5,
        deliverables: "1x 9:16 Instagram Reel, voiceover breakdown, pinned comment",
        revisions: 1,
        isActive: true,
      },
      {
        title: "Bodyweight Conditioning Flow",
        description: "Dynamic workout flow tailored for small apartments and zero-equipment training.",
        platform: "TikTok",
        price: 400,
        turnaroundDays: 3,
        deliverables: "1x 45-second TikTok video with synced rhythm and on-screen exercise cues",
        revisions: 1,
        isActive: true,
      },
    ],
    portfolio: [
      {
        title: "Kettlebell Hinge Masterclass",
        platform: "Instagram",
        description: "Step-by-step movement progression for posterior chain engagement.",
        mediaUrl: null,
        externalUrl: "https://instagram.com",
        sortOrder: 1,
      },
    ],
  },
  {
    email: "leo@demo.infurizz.local",
    name: "Leo Park",
    username: "leopark",
    bio: "Sample creator profile. Leo walks cities after dark and keeps the narration spare.",
    category: "Travel",
    location: "Seoul",
    niche: "Night walks",
    audienceRange: "50k–250k",
    collabPrefs: "One longer city film rather than a pack of clips",
    languages: ["English", "Korean"],
    contentTypes: ["Ambient Walk", "4K City Film", "Binaural Audio"],
    socials: [
      { platform: "YouTube", handle: "@LeoParkWalksSample", audienceNote: "Sample handle", isSample: true },
      { platform: "Instagram", handle: "@leo.park.sample", audienceNote: "Sample handle", isSample: true },
    ],
    services: [
      {
        title: "4K Rainy Night Walk Feature",
        description: "Atmospheric 20-minute immersive walking video through neon-lit streets with binaural ambient sound.",
        platform: "YouTube",
        price: 1800,
        turnaroundDays: 12,
        deliverables: "1x 20-minute 4K YouTube walk film, opening title card credit, description link",
        revisions: 1,
        isActive: true,
      },
    ],
    portfolio: [
      {
        title: "Midnight in Euljiro",
        platform: "YouTube",
        description: "Binaural rain walk through the narrow alleyways and metal workshops of central Seoul.",
        mediaUrl: null,
        externalUrl: "https://youtube.com",
        sortOrder: 1,
      },
    ],
  },
  {
    email: "noor@demo.infurizz.local",
    name: "Noor Elamin",
    username: "noorskin",
    bio: "Sample creator profile. Noor documents unfussy skin routines and texture, not trends.",
    category: "Beauty",
    location: "Dubai",
    niche: "Skin routines",
    audienceRange: "Under 10k",
    collabPrefs: "Product stories only when the routine is honest",
    languages: ["English", "Arabic"],
    contentTypes: ["Texture Analysis", "Barrier Diary", "Routine Breakdown"],
    socials: [
      { platform: "Instagram", handle: "@noor.skin.sample", audienceNote: "Sample handle", isSample: true },
      { platform: "TikTok", handle: "@noorskin.sample", audienceNote: "Sample handle", isSample: true },
    ],
    services: [
      {
        title: "Texture & Routine Breakdown",
        description: "Unfiltered morning routine demonstrating skin barrier absorption, formula feel, and non-sponsored honest verdict.",
        platform: "Instagram",
        price: 600,
        turnaroundDays: 5,
        deliverables: "1x 60-second Instagram Reel, 3x story posts showing texture swatches",
        revisions: 1,
        isActive: true,
      },
    ],
    portfolio: [
      {
        title: "14-Day Barrier Recovery Log",
        platform: "Instagram",
        description: "Macro-photography series tracking barrier restoration with unretouched closeups.",
        mediaUrl: null,
        externalUrl: "https://instagram.com",
        sortOrder: 1,
      },
    ],
  },
];

const brands = [
  {
    email: "northstar@demo.infurizz.local",
    name: "Northstar",
    about: "Sample company. A fictional outdoor-clothing label used only inside this prototype.",
    location: "Portland",
    campaign: {
      name: "Trail Notes Spring",
      category: "Lifestyle",
      creatorNiche: "Outdoor diaries",
      platforms: ["Instagram", "YouTube"],
      audienceRange: "10k–50k",
      location: "Anywhere",
      budgetMin: 4000,
      budgetMax: 8000,
      deliverables: "Two short films and four stills from one trail day",
    },
  },
  {
    email: "luma@demo.infurizz.local",
    name: "Luma",
    about: "Sample company. A fictional home-lighting studio, not a customer.",
    location: "London",
    campaign: {
      name: "Evening Rooms",
      category: "Lifestyle",
      creatorNiche: "Home atmosphere",
      platforms: ["Instagram"],
      audienceRange: "10k–50k",
      location: "London",
      budgetMin: 2500,
      budgetMax: 6000,
      deliverables: "Six photographs and one short room film",
    },
  },
  {
    email: "arc@demo.infurizz.local",
    name: "Arc",
    about: "Sample company. A fictional training-apparel label for this prototype.",
    location: "Lisbon",
    campaign: {
      name: "Weekday Movement",
      category: "Fitness",
      creatorNiche: "Training routines",
      platforms: ["TikTok", "Instagram"],
      audienceRange: "10k–50k",
      location: "Anywhere",
      budgetMin: 1500,
      budgetMax: 4000,
      deliverables: "Four short training videos",
    },
  },
  {
    email: "nova@demo.infurizz.local",
    name: "Nova",
    about: "Sample company. A fictional city-guide publisher, not a live client.",
    location: "Seoul",
    campaign: {
      name: "City After Dark",
      category: "Travel",
      creatorNiche: "Night walks",
      platforms: ["YouTube"],
      audienceRange: "50k–250k",
      location: "Seoul",
      budgetMin: 5000,
      budgetMax: 12000,
      deliverables: "One long night-walk film",
    },
  },
  {
    email: "vanta@demo.infurizz.local",
    name: "Vanta",
    about: "Sample company. A fictional desk-tools studio created for this demo. Not a customer or endorsement.",
    location: "Austin",
    campaign: {
      name: "Desk Reset",
      category: "Technology",
      creatorNiche: "Workspace tools",
      platforms: ["YouTube", "LinkedIn"],
      audienceRange: "50k–250k",
      location: "Austin",
      budgetMin: 6000,
      budgetMax: 15000,
      deliverables: "One review film of a single desk setup",
    },
  },
];

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "mira@demo.infurizz.local" } });

  if (existing) {
    console.log("Demo records already present. Safely backfilling services & portfolio where needed...");
    for (const c of creators) {
      const u = await prisma.user.findUnique({
        where: { email: c.email },
        include: { creator: { include: { services: true, portfolio: true } } },
      });
      if (u && u.creator) {
        // Backfill handle and taxonomies if missing
        await prisma.creator.update({
          where: { id: u.creator.id },
          data: {
            username: u.creator.username || c.username,
            languages: u.creator.languages === "[\"English\"]" ? JSON.stringify(c.languages) : u.creator.languages,
            contentTypes: u.creator.contentTypes === "[]" ? JSON.stringify(c.contentTypes) : u.creator.contentTypes,
          },
        });

        // Add sample services if creator has none
        if (u.creator.services.length === 0) {
          for (const s of c.services) {
            await prisma.creatorService.create({
              data: {
                creatorId: u.creator.id,
                ...s,
              },
            });
          }
          console.log(`  Added ${c.services.length} services for ${c.name}`);
        }

        // Add sample portfolio if creator has none
        if (u.creator.portfolio.length === 0) {
          for (const p of c.portfolio) {
            await prisma.creatorPortfolioItem.create({
              data: {
                creatorId: u.creator.id,
                ...p,
              },
            });
          }
          console.log(`  Added ${c.portfolio.length} portfolio items for ${c.name}`);
        }
      }
    }
    console.log("Backfill complete. All existing users, matches, and campaigns preserved.");
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  for (const creator of creators) {
    const existingCreatorUser = await prisma.user.findUnique({ where: { email: creator.email } });
    if (!existingCreatorUser) {
      await prisma.user.create({
        data: {
          email: creator.email,
          passwordHash,
          role: "CREATOR",
          creator: {
            create: {
              name: creator.name,
              username: creator.username,
              bio: creator.bio,
              category: creator.category,
              location: creator.location,
              niche: creator.niche,
              audienceRange: creator.audienceRange,
              collabPrefs: creator.collabPrefs,
              languages: JSON.stringify(creator.languages),
              contentTypes: JSON.stringify(creator.contentTypes),
              isDemo: true,
              socials: { create: creator.socials },
              services: { create: creator.services },
              portfolio: { create: creator.portfolio },
            },
          },
        },
      });
    }
  }

  for (const brand of brands) {
    const existingBrandUser = await prisma.user.findUnique({ where: { email: brand.email } });
    if (!existingBrandUser) {
      await prisma.user.create({
        data: {
          email: brand.email,
          passwordHash,
          role: "BRAND",
          brand: {
            create: {
              name: brand.name,
              about: brand.about,
              location: brand.location,
              isDemo: true,
              campaigns: {
                create: {
                  ...brand.campaign,
                  platforms: JSON.stringify(brand.campaign.platforms),
                  status: "Open",
                  isDemo: true,
                },
              },
            },
          },
        },
      });
    }
  }

  console.log("Seeded sample creators with storefront packages & portfolio items, plus sample campaigns.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
