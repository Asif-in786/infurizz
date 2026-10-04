import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { DEMO_PASSWORD } from "../lib/options";
import { encryptToken } from "../lib/security/encryption";

const prisma = new PrismaClient();

// Helper to format YYYY-MM-DD
function getDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Generate an array of dates backwards from today
function generatePastDates(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(getDateString(d));
  }
  return dates;
}

export async function main() {
  console.log("=== STARTING SHOWCASE DATA POPULATION ===");

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // 1. CREATORS DEFINITION (30 distinct creators)
  const creatorData = [
    {
      name: "Aarav Mehta",
      username: "aarav.mehta",
      email: "aarav.mehta@showcase.infurizz.local",
      bio: "Visual documentarian tracking contemporary streetwear silhouettes, vintage denim distressing, and understated everyday tailoring in Bombay.",
      category: "Fashion",
      location: "Mumbai",
      niche: "Minimalist Streetwear & Vintage Denim",
      audienceRange: "50k–250k",
      collabPrefs: "Capsule lookbook films, bespoke styling series, zero sponsored blast spam",
      languages: ["English", "Hindi"],
      contentTypes: ["9:16 Editorial Reel", "Capsule Lookbook", "Stills Gallery"],
      archetype: "instagram_heavy",
      followers: 78400,
      views: 310000,
      engagementRate: 4.8,
      platform: "Instagram",
      handle: "@aarav.mehta",
      services: [
        {
          title: "Curated Streetwear Lookbook Reel",
          description: "High-production 9:16 vertical lookbook film showing 3 distinct styling angles, movement notes, and material macro shots.",
          platform: "Instagram",
          price: 550,
          turnaroundDays: 5,
          deliverables: "1x 60s Reel, 3x High-Res Stills, Story Highlight for 30 days",
          revisions: 1,
        },
        {
          title: "Complete Capsule Styling Campaign",
          description: "Comprehensive multi-look editorial shoot featuring full brand wardrobe integration and product tag placement.",
          platform: "Instagram",
          price: 1100,
          turnaroundDays: 8,
          deliverables: "2x Dedicated Reels, 6x Carousel Stills, 5x Story Frames with swipe links",
          revisions: 2,
        },
      ],
      portfolio: [
        {
          title: "Monsoon Raw Denim Study",
          platform: "Instagram",
          description: "Four-part editorial series on selvedge denim fading and breathable linen layering.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Zoe Lindqvist",
      username: "zoe.lindqvist",
      email: "zoe.lindqvist@showcase.infurizz.local",
      bio: "Upcycled workwear designer and visual artist creating technical garments from deadstock canvas and decommissioned parachutes.",
      category: "Fashion",
      location: "Berlin",
      niche: "Upcycled Workwear & Techwear Aesthetics",
      audienceRange: "50k–250k",
      collabPrefs: "Material innovation showcases, sustainable garment wear-testing",
      languages: ["English", "German"],
      contentTypes: ["Garment Deconstruction Film", "Wear-Test Video", "Atelier Stills"],
      archetype: "emerging_growth",
      followers: 142000,
      views: 890000,
      engagementRate: 5.6,
      platform: "TikTok",
      handle: "@zoe.upcycled",
      services: [
        {
          title: "Material Dissection & Studio Review",
          platform: "TikTok",
          price: 950,
          turnaroundDays: 7,
          description: "Hands-on structural breakdown of garment construction, stitching, and waterproof membranes.",
          deliverables: "1x 90s TikTok Video, high-res process stills, licensed usage for 60 days",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Berlin Modular Trench Series",
          platform: "TikTok",
          description: "Transformative 3-in-1 outerwear wear-test across inclement weather conditions.",
          externalUrl: "https://tiktok.com",
        },
      ],
    },
    {
      name: "Devendra Joshi",
      username: "dev.joshi",
      email: "dev.joshi@showcase.infurizz.local",
      bio: "Archiving South Asian sneaker culture, indigenous textiles married with modern footwear, and Delhi subculture stories.",
      category: "Fashion",
      location: "Delhi",
      niche: "Subcontinental Heritage Streetwear & Sneaker Culture",
      audienceRange: "50k–250k",
      collabPrefs: "Sneaker drops, textile provenance storytelling, regional pop-ups",
      languages: ["English", "Hindi"],
      contentTypes: ["Footwear Macro Reel", "Subculture Documentary", "On-Foot Stills"],
      archetype: "high_engagement_niche",
      followers: 89500,
      views: 420000,
      engagementRate: 6.2,
      platform: "Instagram",
      handle: "@devkicks.delhi",
      services: [
        {
          title: "On-Foot Editorial Feature & Wear Study",
          platform: "Instagram",
          price: 650,
          turnaroundDays: 4,
          description: "Urban architecture backdrop with macro focus on stitching, materials, and silhouette profile.",
          deliverables: "1x 60s Reel, 4x Curated Stills, Unboxing Story Series",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Khadi Weaves on Retro Runners",
          platform: "Instagram",
          description: "Custom dye and textile integration testing traditional handspun cotton on vintage footwear.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Sana Al-Mansoor",
      username: "sana.mansoor",
      email: "sana.mansoor@showcase.infurizz.local",
      bio: "High-fashion modest drape educator and luxury creative director based between Dubai and London. Architectural lines and quiet luxury.",
      category: "Fashion",
      location: "Dubai",
      niche: "Contemporary Modest High-Fashion & Draping",
      audienceRange: "250k–1m",
      collabPrefs: "Editorial brand ambassadorships, haute couture showcases",
      languages: ["English", "Arabic"],
      contentTypes: ["Runway Analysis", "Draping Masterclass", "Couture Styling Film"],
      archetype: "large_audience",
      followers: 340000,
      views: 1450000,
      engagementRate: 2.9,
      platform: "Instagram",
      handle: "@sana.couture",
      services: [
        {
          title: "Editorial Luxury Reel & Style Guide",
          platform: "Instagram",
          price: 1800,
          turnaroundDays: 10,
          description: "Museum and gallery-lit modest styling feature showcasing luxury silk, wool, and structured outerwear.",
          deliverables: "1x Cinematic 90s Reel, 5x High-res lookbook images, caption editorial",
          revisions: 2,
        },
      ],
      portfolio: [
        {
          title: "Modern Abaya Silhouette Study",
          platform: "Instagram",
          description: "Structured wool crepe minimalism presented in Dubai Design District.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Chloe Dupont",
      username: "chloe.dupont",
      email: "chloe.dupont@showcase.infurizz.local",
      bio: "Documenting timeless Parisian and London wardrobe foundations: recycled cashmere, French seams, and decade-long garment lifespans.",
      category: "Fashion",
      location: "London",
      niche: "Quiet Luxury & Sustainable Cashmere Wardrobe",
      audienceRange: "50k–250k",
      collabPrefs: "Heritage wool and cashmere houses, transparent supply chains",
      languages: ["English", "French"],
      contentTypes: ["Slow Fashion Essay", "Garment Care Guide", "Autumn Lookbook"],
      archetype: "established_steady",
      followers: 195000,
      views: 740000,
      engagementRate: 3.4,
      platform: "YouTube",
      handle: "@ChloeDupontWardrobe",
      services: [
        {
          title: "Dedicated Wardrobe Integration Film",
          platform: "YouTube",
          price: 1600,
          turnaroundDays: 12,
          description: "Thoughtful 10-12 minute video dissecting garment provenance, fit on multiple silhouettes, and 30-day wear resilience.",
          deliverables: "1x 10-12 min YouTube video, pinned comment, permanent description link",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "The 7-Piece Scottish Cashmere Capsule",
          platform: "YouTube",
          description: "Deep dive into Scottish heritage mills, gauge density, and hand-washing techniques.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Riya Kapoor",
      username: "riya.kapoor",
      email: "riya.kapoor@showcase.infurizz.local",
      bio: "Promoting natural indigo dabu block printing, Bagru artisan families, and contemporary pret-a-porter silhouettes.",
      category: "Fashion",
      location: "Jaipur",
      niche: "Handcrafted Blockprint & Modern Pret Couture",
      audienceRange: "10k–50k",
      collabPrefs: "Direct artisan collaborations, ethical fashion labels",
      languages: ["English", "Hindi"],
      contentTypes: ["Artisan Workshop Tour", "Indigo Resist Dye Reel", "Lookbook Stills"],
      archetype: "regional_creator",
      followers: 46200,
      views: 210000,
      engagementRate: 6.8,
      platform: "Instagram",
      handle: "@riya.jaipurtextiles",
      services: [
        {
          title: "Artisanal Craft Narrative Reel",
          platform: "Instagram",
          price: 450,
          turnaroundDays: 5,
          description: "Behind-the-scenes block carve to fabric reveal, highlighting human craftsmanship and dye naturalness.",
          deliverables: "1x 60s Reel, 4x Artisan Stills, Story Sequence",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Bagru Mud-Resist Document",
          platform: "Instagram",
          description: "Sun drying cycles and natural river washing recorded in rural Rajasthan.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Marcus Vance",
      username: "marcus.vance",
      email: "marcus.vance@showcase.infurizz.local",
      bio: "Independent horology essayist and bespoke tailoring photographer. Mechanical complications, vintage chronographs, and Savile Row heritage.",
      category: "Lifestyle",
      location: "New York",
      niche: "Bespoke Tailoring & Horology Journal",
      audienceRange: "50k–250k",
      collabPrefs: "Independent watchmakers, heritage leather crafters",
      languages: ["English"],
      contentTypes: ["Macro Movement Film", "Wrist Presence Essay", "Horology Stills"],
      archetype: "youtube_heavy",
      followers: 118000,
      views: 650000,
      engagementRate: 3.8,
      platform: "YouTube",
      handle: "@MarcusVanceWatches",
      services: [
        {
          title: "Horological Macro Film & Review",
          platform: "YouTube",
          price: 2200,
          turnaroundDays: 14,
          description: "4K macro lens inspection of dial finishing, escapement beat rate, and ergonomics under cuff.",
          deliverables: "1x 12 min YouTube feature, 8 high-res macro stills for brand PR",
          revisions: 2,
        },
      ],
      portfolio: [
        {
          title: "The Return of the 36mm Case",
          platform: "YouTube",
          description: "Analytical comparison of mid-century proportion resurgence in modern watchmaking.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Rohan Singhal",
      username: "rohan.singhal",
      email: "rohan.singhal@showcase.infurizz.local",
      bio: "Everyday carry enthusiast reviewing weather-sealed commuter packs, ballistic nylon, and technical everyday gear in Bengaluru.",
      category: "Fashion",
      location: "Bengaluru",
      niche: "Everyday Urban Essentials & Modular Bags",
      audienceRange: "10k–50k",
      collabPrefs: "Commuter accessories, sustainable gear bags",
      languages: ["English", "Hindi"],
      contentTypes: ["EDC Loadout Flatlay", "Rain Resistance Test", "Quick Pack Reel"],
      archetype: "emerging_growth",
      followers: 36800,
      views: 180000,
      engagementRate: 5.8,
      platform: "Instagram",
      handle: "@rohan.carry",
      services: [
        {
          title: "Complete EDC Loadout Reel & Flatlay",
          platform: "Instagram",
          price: 400,
          turnaroundDays: 4,
          description: "Urban commute stress-test showing compartmentalization, zippers, and water shedding.",
          deliverables: "1x 45s Reel, 2x Overhead Flatlay Stills, Story Review",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Monsoon Commute Pack Test",
          platform: "Instagram",
          description: "Submerging and cycling through heavy tropical rainfall with modular laptop compartments.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Priyansha Roy",
      username: "priyansha.skin",
      email: "priyansha.roy@showcase.infurizz.local",
      bio: "Biochemist turned cosmetic educator focusing on skin barrier integrity, ceramides, non-comedogenic oils, and humid climate skincare.",
      category: "Beauty",
      location: "Kolkata",
      niche: "Barrier Repair & Botanical Skincare Science",
      audienceRange: "50k–250k",
      collabPrefs: "Dermatologically tested formulations, clinical trials review",
      languages: ["English", "Bengali", "Hindi"],
      contentTypes: ["Ingredient Breakdown", "pH Balance Demonstration", "Routine Guide"],
      archetype: "high_engagement_niche",
      followers: 94500,
      views: 520000,
      engagementRate: 6.1,
      platform: "Instagram",
      handle: "@priyansha.dermalab",
      services: [
        {
          title: "Clinical Formulation Breakdown Reel",
          platform: "Instagram",
          price: 750,
          turnaroundDays: 6,
          description: "Analytical review of active percentages, molecular weights, and barrier patch testing.",
          deliverables: "1x 60s Educational Reel, carousel infographic of ingredients",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "The Centella & Ceramide Comparison",
          platform: "Instagram",
          description: "Double-blind testing of soothing creams under high humidity conditions.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Elena Rostova",
      username: "elena.rostova",
      email: "elena.rostova@showcase.infurizz.local",
      bio: "Minimalist editorial makeup artist. Glass skin textures, cream tints, and deconstructive beauty for daylight photography.",
      category: "Beauty",
      location: "Toronto",
      niche: "Editorial Minimalist Makeup & Skinimalism",
      audienceRange: "50k–250k",
      collabPrefs: "Clean beauty brands, multi-use pigment sticks",
      languages: ["English"],
      contentTypes: ["Daylight Skin Tutorial", "No-Foundation Routine", "Pigment Swatch"],
      archetype: "multi_platform",
      followers: 165000,
      views: 820000,
      engagementRate: 4.2,
      platform: "TikTok",
      handle: "@elena.glows",
      services: [
        {
          title: "Seamless Daytime Glow Tutorial",
          platform: "TikTok",
          price: 1100,
          turnaroundDays: 5,
          description: "Real texture, unretouched daylight camera work showcasing skin tints and dewy balms.",
          deliverables: "1x 60s TikTok, 3x High-res unretouched beauty portraits",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Summer Dew Routine: 3 Products",
          platform: "TikTok",
          description: "SPF tint and cream blush technique filmed in direct morning sunlight.",
          externalUrl: "https://tiktok.com",
        },
      ],
    },
    {
      name: "Ayesha Khan",
      username: "ayesha.k",
      email: "ayesha.khan@showcase.infurizz.local",
      bio: "Ayurvedic trichology advocate studying cold-pressed bhringraj, amla hair baths, and scalp microbiome restoration.",
      category: "Beauty",
      location: "Hyderabad",
      niche: "Hair Health, Scalp Care & Ayurvedic Tonics",
      audienceRange: "50k–250k",
      collabPrefs: "Cold-pressed botanical oils, sulfate-free gentle cleansers",
      languages: ["English", "Urdu", "Telugu"],
      contentTypes: ["Scalp Oiling Ritual", "Herb Extraction Video", "Density Progress Reel"],
      archetype: "regional_creator",
      followers: 58000,
      views: 290000,
      engagementRate: 5.9,
      platform: "Instagram",
      handle: "@ayesha.hairtonics",
      services: [
        {
          title: "Ayurvedic Scalp Ritual Film",
          platform: "Instagram",
          price: 500,
          turnaroundDays: 5,
          description: "Step-by-step application, acupressure marma points, and wash-off results.",
          deliverables: "1x 60s Reel, 2x Application infographics, Story Q&A",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "90-Day Sesame & Bhringraj Scalp Study",
          platform: "Instagram",
          description: "Tracking follicular thickness and shedding reduction across seasonal shifts.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Maya Chen",
      username: "maya.chen",
      email: "maya.chen@showcase.infurizz.local",
      bio: "Asian skincare formulation reviewer living in Singapore. Sun protection efficacy, UV camera tests, and non-greasy humid climate finishes.",
      category: "Beauty",
      location: "Singapore",
      niche: "Clean K-Beauty Formulations & Sun Protection",
      audienceRange: "50k–250k",
      collabPrefs: "Broad spectrum SPF brands, modern chemical filters",
      languages: ["English", "Mandarin"],
      contentTypes: ["UV Camera Test", "Reapplication Hack", "Invisible Cast Comparison"],
      archetype: "multi_platform",
      followers: 238000,
      views: 1100000,
      engagementRate: 3.7,
      platform: "YouTube",
      handle: "@MayaChenSunCare",
      services: [
        {
          title: "UV Camera Sunscreen Stress Test",
          platform: "YouTube",
          price: 1750,
          turnaroundDays: 9,
          description: "Lab-grade UV camera analysis demonstrating even film formation and water resistance.",
          deliverables: "1x Dedicated 8 min YouTube feature + 1x Short clip for Shorts/Reels",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "12 Invisible SPFs on Deep Skin",
          platform: "YouTube",
          description: "White-cast testing across diverse skin tones under harsh tropical sun.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Kabir Sen",
      username: "kabir.sen",
      email: "kabir.sen@showcase.infurizz.local",
      bio: "Culinary explorer reviving Malvani and Konkani fish curries, cold-smoke dry fish preservation, and fermented rice pancakes.",
      category: "Food",
      location: "Mumbai",
      niche: "Regional Coastal Konkan Seafood & Fermentation",
      audienceRange: "50k–250k",
      collabPrefs: "Cast iron cookware, coastal spice blends, artisanal sea salts",
      languages: ["English", "Marathi", "Hindi"],
      contentTypes: ["Fisherman Dawn Market Film", "Claypot Curry Reel", "Recipe Card"],
      archetype: "high_engagement_niche",
      followers: 82000,
      views: 470000,
      engagementRate: 6.4,
      platform: "Instagram",
      handle: "@kabir.konkancoast",
      services: [
        {
          title: "Claypot Coastal Recipe Reel",
          platform: "Instagram",
          price: 600,
          turnaroundDays: 4,
          description: "Sensory cooking film featuring fresh catch, stone ground spices, and cast-iron cookware integration.",
          deliverables: "1x 60s Reel, full written recipe in caption, 3x Stills",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Dawn at Sassoon Docks",
          platform: "Instagram",
          description: "Documenting heritage wooden trawlers and seasonal pomfret auctioning.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Divya Patel",
      username: "divya.patel",
      email: "divya.patel@showcase.infurizz.local",
      bio: "Re-imagining heritage Gujarati vegetarian cooking: seasonal undhiyu in earthen matkas, wood-pressed groundnut oils, and heirloom lentils.",
      category: "Food",
      location: "Ahmedabad",
      niche: "Modern Gujarati Heritage Dishes & Seasonal Thalis",
      audienceRange: "50k–250k",
      collabPrefs: "Cold-pressed oils, organic grains, brass cookware",
      languages: ["English", "Gujarati", "Hindi"],
      contentTypes: ["Matka Cooking Reel", "Festive Thali Guide", "Millet Masterclass"],
      archetype: "established_steady",
      followers: 112000,
      views: 590000,
      engagementRate: 4.5,
      platform: "Instagram",
      handle: "@divya.kathiyawad",
      services: [
        {
          title: "Heritage Seasonal Thali Reel",
          platform: "Instagram",
          price: 700,
          turnaroundDays: 5,
          description: "Multi-course brass thali preparation highlighting pantry staples and pure ingredients.",
          deliverables: "1x 60s Reel, 2x Ingredient carousels, Story Series",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Surti Undhiyu Over Wood Fire",
          platform: "Instagram",
          description: "Traditional earthen pot technique buried in cow-dung embers.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Freya Lind",
      username: "freya.lind",
      email: "freya.lind@showcase.infurizz.local",
      bio: "Nordic wild sourdough baker and rye miller. Fermentation kinetics, sourdough starter hydration, and dark caramelized crusts.",
      category: "Food",
      location: "London",
      niche: "Artisanal Sourdough & Nordic Wild Ferments",
      audienceRange: "50k–250k",
      collabPrefs: "Stone mills, organic heritage flours, Dutch ovens",
      languages: ["English", "Swedish"],
      contentTypes: ["Crumb Shot ASMR", "Scoring Geometry Film", "Hydration Formula Guide"],
      archetype: "high_engagement_niche",
      followers: 88400,
      views: 610000,
      engagementRate: 5.7,
      platform: "YouTube",
      handle: "@FreyaLindBakes",
      services: [
        {
          title: "Dedicated Baking Masterclass Film",
          platform: "YouTube",
          price: 1400,
          turnaroundDays: 10,
          description: "Cinematic, slow-paced longform tutorial featuring flour milling and Dutch oven baking.",
          deliverables: "1x 10 min YouTube video with printable recipe PDF",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "100% Wholegrain Rye with Roasted Seeds",
          platform: "YouTube",
          description: "Fermentation tracking over 36 hours at cool room temperatures.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Arjun Varma",
      username: "arjun.eats",
      email: "arjun.varma@showcase.infurizz.local",
      bio: "Uncovering backwater toddy shop delicacies, Cochin harbour cafés, and cardamom hill plantation breakfast tables.",
      category: "Food",
      location: "Kochi",
      niche: "Kerala Spice Route & Backwater Café Discovery",
      audienceRange: "10k–50k",
      collabPrefs: "Estate coffees, single-origin spices, boutique stays",
      languages: ["English", "Malayalam"],
      contentTypes: ["Toddy Shop Food Log", "Spice Plantation Walk", "Morning Chai Stills"],
      archetype: "regional_creator",
      followers: 44500,
      views: 240000,
      engagementRate: 6.9,
      platform: "Instagram",
      handle: "@arjun.keralatable",
      services: [
        {
          title: "Culinary Travel Diary Reel",
          platform: "Instagram",
          price: 450,
          turnaroundDays: 4,
          description: "Atmospheric montage featuring local ingredients, kitchen steam, and spice aroma storytelling.",
          deliverables: "1x 60s Reel, 3x High-res food stills, Geotagged Story",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Fort Kochi Beef Roast & Appam",
          platform: "Instagram",
          description: "Documentary exploration of hundred-year-old culinary lineages in Old Kochi.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Nikhil Verma",
      username: "nikhil.verma",
      email: "nikhil.verma@showcase.infurizz.local",
      bio: "Strength coach specializing in heavy kettlebells, gymnastic ring leverage, and injury-free progressive overload.",
      category: "Fitness",
      location: "Delhi",
      niche: "Functional Strength, Calisthenics & Kettlebells",
      audienceRange: "50k–250k",
      collabPrefs: "Cast-iron kettlebells, mobility tools, clean whey isolates",
      languages: ["English", "Hindi"],
      contentTypes: ["Form Correction Reel", "Ring Muscle-up Progression", "Home Gym Guide"],
      archetype: "emerging_growth",
      followers: 132000,
      views: 780000,
      engagementRate: 5.1,
      platform: "Instagram",
      handle: "@nikhil.strength",
      services: [
        {
          title: "Technique Breakdown & Training Integration",
          platform: "Instagram",
          price: 800,
          turnaroundDays: 5,
          description: "Technical coaching breakdown integrating sponsor gear into natural training movements.",
          deliverables: "1x 60s Reel, 1x Carousel coaching cues, 2x Training Stories",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "The 32kg Turkish Get-Up Standard",
          platform: "Instagram",
          description: "Comprehensive mobility protocol for shoulder packing and thoracic rotation.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Amara Okafor",
      username: "amara.okafor",
      email: "amara.okafor@showcase.infurizz.local",
      bio: "Sub-2:50 marathon runner and track enthusiast. Aerobic base building, lactate threshold pacing, and recovery nutrition.",
      category: "Fitness",
      location: "London",
      niche: "Sub-3 Marathon Training & Aerobic Endurance",
      audienceRange: "50k–250k",
      collabPrefs: "Carbon-plated racing shoes, electrolyte formulations",
      languages: ["English"],
      contentTypes: ["Weekly Mileage Log", "Race Day VLOG", "Shoe Rotation Breakdown"],
      archetype: "established_steady",
      followers: 98000,
      views: 510000,
      engagementRate: 4.6,
      platform: "YouTube",
      handle: "@AmaraRunsFast",
      services: [
        {
          title: "Long Run Gear & Nutrition Review",
          platform: "YouTube",
          price: 1500,
          turnaroundDays: 8,
          description: "20-mile Sunday training run wear-test reviewing apparel friction and carb intake.",
          deliverables: "1x 10 min YouTube training vlog, pinned sponsor link",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "London Marathon Peak Week Diary",
          platform: "YouTube",
          description: "110-mile training week with physiological tracking and heart rate metrics.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Tenzin Norbu",
      username: "tenzin.norbu",
      email: "tenzin.norbu@showcase.infurizz.local",
      bio: "Himalayan yoga teacher exploring alignment-based vinyasa, pranayama breathwork, and minimalist mobility in Goa.",
      category: "Fitness",
      location: "Goa",
      niche: "Vinyasa Alignment, Breathwork & Mobility",
      audienceRange: "10k–50k",
      collabPrefs: "Natural rubber mats, cork blocks, hemp meditation cushions",
      languages: ["English", "Tibetan", "Hindi"],
      contentTypes: ["Morning Asana Sequence", "Breathwork Guide", "Mobility Drills"],
      archetype: "high_engagement_niche",
      followers: 36000,
      views: 220000,
      engagementRate: 7.1,
      platform: "Instagram",
      handle: "@tenzin.pranayama",
      services: [
        {
          title: "Holistic Asana & Meditation Reel",
          platform: "Instagram",
          price: 450,
          turnaroundDays: 4,
          description: "Quiet morning coastal yoga flow highlighting natural textures and mindful practice.",
          deliverables: "1x 60s Reel, 3x High-res asana portraits, practice guide",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Sun Salutation B Alignment Notes",
          platform: "Instagram",
          description: "Pelvic stabilization and breath synchronization filmed on Morjim beach.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Siddharth Roy",
      username: "sid.cricket",
      email: "sid.roy@showcase.infurizz.local",
      bio: "Former domestic pace bowler breaking down fast bowling biomechanics, run-up deceleration, and rotator cuff longevity.",
      category: "Fitness",
      location: "Pune",
      niche: "Cricket Conditioning & Fast Bowling Biomechanics",
      audienceRange: "50k–250k",
      collabPrefs: "Athletic compression wear, bowling spikes, resistance bands",
      languages: ["English", "Hindi"],
      contentTypes: ["High-speed Action Breakdown", "Pace Conditioning Drill", "Injury Prevention Reel"],
      archetype: "emerging_growth",
      followers: 64000,
      views: 380000,
      engagementRate: 5.4,
      platform: "Instagram",
      handle: "@sid.pacebowling",
      services: [
        {
          title: "Biomechanics Analysis & Training Integration",
          platform: "Instagram",
          price: 600,
          turnaroundDays: 5,
          description: "High-frame-rate 240fps analysis reviewing bowler foot strike and equipment durability.",
          deliverables: "1x 60s Reel, 1x Technique carousel, Story demonstration",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "140kmph Delivery Stride Anatomy",
          platform: "Instagram",
          description: "Force plate impact data matched to front-knee bracing angles.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Kaelen Ross",
      username: "kaelen.tech",
      email: "kaelen.ross@showcase.infurizz.local",
      bio: "Systems programmer and AI researcher exploring self-hosted local LLMs, quantized inference on Apple Silicon, and reproducible developer setups.",
      category: "Technology",
      location: "San Francisco",
      niche: "Local LLMs, Open Weights & AI Engineering Workflows",
      audienceRange: "50k–250k",
      collabPrefs: "Developer infrastructure, workstation hardware, open source tools",
      languages: ["English"],
      contentTypes: ["Terminal Benchmark Video", "Local Model Walkthrough", "Setup Essay"],
      archetype: "youtube_heavy",
      followers: 185000,
      views: 920000,
      engagementRate: 4.8,
      platform: "YouTube",
      handle: "@KaelenRossTech",
      services: [
        {
          title: "In-Depth Technical Architecture Review",
          platform: "YouTube",
          price: 2400,
          turnaroundDays: 12,
          description: "15-minute hands-on terminal walkthrough with real benchmarks, code snippets, and repo integration.",
          deliverables: "1x Dedicated 12-15 min YouTube video, GitHub repository link, pinned comment",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Running 70B Models Locally on unified memory",
          platform: "YouTube",
          description: "Token latency, memory pressure benchmarks, and quantization tradeoffs.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Ishaan Gupta",
      username: "ishaan.code",
      email: "ishaan.gupta@showcase.infurizz.local",
      bio: "Neovim maintainer, Rust enthusiast, and developer tools creator based in Bengaluru. Fast CLI tools and calm workspaces.",
      category: "Technology",
      location: "Bengaluru",
      niche: "Developer Tooling, Terminal Workflows & Open Source",
      audienceRange: "50k–250k",
      collabPrefs: "Cloud development environments, ergonomic mechanical keyboards",
      languages: ["English", "Hindi"],
      contentTypes: ["Neovim Configuration Tour", "Rust CLI Deep-dive", "Dotfiles Breakdown"],
      archetype: "emerging_growth",
      followers: 91000,
      views: 460000,
      engagementRate: 6.2,
      platform: "YouTube",
      handle: "@IshaanCodes",
      services: [
        {
          title: "Developer Workflow & Tool Integration",
          platform: "YouTube",
          price: 1300,
          turnaroundDays: 7,
          description: "Deep dive demonstrating genuine productivity improvements and command-line speedups.",
          deliverables: "1x 8-10 min YouTube video, dotfiles repository integration",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "My 0ms Latency Development Setup",
          platform: "YouTube",
          description: "Custom terminal shaders, tmux configurations, and Wayland window tiling.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Kenji Sato",
      username: "kenji.sato",
      email: "kenji.sato@showcase.infurizz.local",
      bio: "Industrial designer crafting Japanese minimalist workspaces, CNC anodized aluminium keyboards, and acoustic sound dampening.",
      category: "Technology",
      location: "Tokyo",
      niche: "Minimal Desk Setups & Custom Hardware",
      audienceRange: "50k–250k",
      collabPrefs: "Machined aluminium desk accessories, studio monitor speakers",
      languages: ["English", "Japanese"],
      contentTypes: ["Desk Tour ASMR", "Custom Keyboard Build", "Workspace Photography"],
      archetype: "large_audience",
      followers: 215000,
      views: 1250000,
      engagementRate: 3.9,
      platform: "YouTube",
      handle: "@KenjiSatoStudio",
      services: [
        {
          title: "Cinematic Desk Setup Feature",
          platform: "YouTube",
          price: 2100,
          turnaroundDays: 14,
          description: "4K studio lighting, macro lens sound recording, and clean cable management walkthrough.",
          deliverables: "1x 10-12 min dedicated YouTube feature, 5x High-res setup stills",
          revisions: 2,
        },
      ],
      portfolio: [
        {
          title: "Tokyo Micro-Apartment Workspace 2026",
          platform: "YouTube",
          description: "Compact 12sqm studio optimization with solid walnut and matte black aluminium.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Samar Banerjee",
      username: "samar.b",
      email: "samar.banerjee@showcase.infurizz.local",
      bio: "Acoustic engineer evaluating open-back planar magnetic headphones, DAC amplification stacks, and frequency response curves.",
      category: "Technology",
      location: "Pune",
      niche: "Consumer Audio Engineering & Planar Acoustic Tests",
      audienceRange: "50k–250k",
      collabPrefs: "Audiophile DACs, planar headphones, studio microphones",
      languages: ["English", "Bengali"],
      contentTypes: ["Harmon Target Measurement", "DAC Blind Test", "Soundstage Breakdown"],
      archetype: "high_engagement_niche",
      followers: 54000,
      views: 310000,
      engagementRate: 5.5,
      platform: "YouTube",
      handle: "@SamarAcoustics",
      services: [
        {
          title: "Laboratory Acoustic Measurement & Review",
          platform: "YouTube",
          price: 1100,
          turnaroundDays: 8,
          description: "MiniDSP EARS measurement rig frequency charts matched to real music listening tests.",
          deliverables: "1x 10 min YouTube video with raw frequency graph overlays",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Open Back vs Closed Back in Treat Rooms",
          platform: "YouTube",
          description: "Decibel decay measurements and soundstage imaging testing.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Meera Nambiar",
      username: "meera.nomad",
      email: "meera.nambiar@showcase.infurizz.local",
      bio: "Solo high-altitude mountaineer and wilderness photographer mapping remote Ladakh passes, packrafting Zanskar, and zero-trace bivouacking.",
      category: "Travel",
      location: "Bengaluru",
      niche: "Solo High-Altitude Himalayan Treks & Packrafting",
      audienceRange: "50k–250k",
      collabPrefs: "Ultralight tents, technical alpine apparel, solar charging banks",
      languages: ["English", "Malayalam", "Hindi"],
      contentTypes: ["High-Pass Expedition Film", "Ultralight Gear Pack", "Alpine Stills"],
      archetype: "emerging_growth",
      followers: 68000,
      views: 390000,
      engagementRate: 6.3,
      platform: "Instagram",
      handle: "@meera.himalayas",
      services: [
        {
          title: "Expedition Alpine Showcase Reel",
          platform: "Instagram",
          price: 650,
          turnaroundDays: 6,
          description: "Real 5000m altitude harsh conditions field-testing technical outdoor gear.",
          deliverables: "1x 60s Reel, 4x Ultra-sharp alpine landscape stills with gear tags",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Kang Yatse II Winter Approach",
          platform: "Instagram",
          description: "Sub-zero windchill testing of 850-fill goose down sleeping systems.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Leo Gallagher",
      username: "leo.roams",
      email: "leo.roams@showcase.infurizz.local",
      bio: "Slow rail travel documentarian traveling exclusively by electric trains, sleeper carriages, and vintage ferries across Europe.",
      category: "Travel",
      location: "Edinburgh",
      niche: "Slow Train Travel Across Western Europe & Visual Essays",
      audienceRange: "50k–250k",
      collabPrefs: "Luggage makers, noise-cancelling travel headphones, boutique train journeys",
      languages: ["English"],
      contentTypes: ["Sleeper Train Film", "Window View Visual Essay", "Packing Guide"],
      archetype: "established_steady",
      followers: 149000,
      views: 790000,
      engagementRate: 4.1,
      platform: "YouTube",
      handle: "@LeoRoamsSlow",
      services: [
        {
          title: "Cinematic Journey Narrative Feature",
          platform: "YouTube",
          price: 1800,
          turnaroundDays: 14,
          description: "Film-grain 12-minute travel narrative integrating travel essentials into slow transit journeys.",
          deliverables: "1x 12 min YouTube feature, pinned sponsor link",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Nightjet Vienna to Rome: The Quiet Sleeper",
          platform: "YouTube",
          description: "Atmospheric evening dining and mountain crossings at sunrise.",
          externalUrl: "https://youtube.com",
        },
      ],
    },
    {
      name: "Vikram Rathore",
      username: "vikram.rathore",
      email: "vikram.rathore@showcase.infurizz.local",
      bio: "Bootstrapped software founder sharing transparent revenue metrics, customer acquisition economics, and micro-SaaS architecture in India.",
      category: "Finance",
      location: "Mumbai",
      niche: "Bootstrapping Micro-SaaS & Product Studio Operations",
      audienceRange: "50k–250k",
      collabPrefs: "Developer APIs, cloud hosting platforms, payment gateways",
      languages: ["English", "Hindi"],
      contentTypes: ["Revenue Breakdown Essay", "SaaS Metric Dashboard", "Architecture Diagram"],
      archetype: "high_engagement_niche",
      followers: 74000,
      views: 380000,
      engagementRate: 5.7,
      platform: "LinkedIn",
      handle: "vikram-rathore-saas",
      services: [
        {
          title: "Technical Case Study & Founder Essay",
          platform: "LinkedIn",
          price: 900,
          turnaroundDays: 5,
          description: "Data-backed architectural breakdown of software utilities and infrastructure cost savings.",
          deliverables: "1x Long-form LinkedIn article + carousel diagram + newsletter feature",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "From Zero to $18k MRR with 2 Engineers",
          platform: "LinkedIn",
          description: "Infrastructure breakdown using lightweight Postgres and serverless edges.",
          externalUrl: "https://linkedin.com",
        },
      ],
    },
    {
      name: "Sanya Malhotra",
      username: "sanya.finance",
      email: "sanya.malhotra@showcase.infurizz.local",
      bio: "Chartered accountant demystifying tax optimization, equity compensation, and inflation-hedged index investing for modern creative workers.",
      category: "Finance",
      location: "Gurgaon",
      niche: "Tax-Advantaged Investing & Freelancer Financial Health",
      audienceRange: "50k–250k",
      collabPrefs: "Regulated brokerages, retirement funds, digital invoicing tools",
      languages: ["English", "Hindi"],
      contentTypes: ["Tax Strategy Carousel", "Index Fund Allocation Guide", "Fee Breakdown"],
      archetype: "established_steady",
      followers: 135000,
      views: 680000,
      engagementRate: 4.4,
      platform: "LinkedIn",
      handle: "sanya-malhotra-finance",
      services: [
        {
          title: "Comprehensive Financial Framework Post",
          platform: "LinkedIn",
          price: 1200,
          turnaroundDays: 6,
          description: "Pragmatic spreadsheet framework educating knowledge workers on compounding and fee reduction.",
          deliverables: "1x Dedicated longform article, 1x 8-slide PDF carousel",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "The Freelancer Tax Playbook: FY 2026",
          platform: "LinkedIn",
          description: "Presumptive taxation and global remittance deductions simplified.",
          externalUrl: "https://linkedin.com",
        },
      ],
    },
    {
      name: "Tara Deshmukh",
      username: "tara.deshmukh",
      email: "tara.deshmukh@showcase.infurizz.local",
      bio: "Spatial designer documenting tropical modernism, laterite stone masonry, and passive cross-ventilation homes along the Konkan coast.",
      category: "Lifestyle",
      location: "Goa",
      niche: "Tropical Brutalism, Reclaimed Teak & Coastal Architecture",
      audienceRange: "50k–250k",
      collabPrefs: "Architectural lighting, artisanal lime plaster, sustainable timber",
      languages: ["English", "Marathi"],
      contentTypes: ["Home Walkthrough Film", "Material Texture Macro", "Architect Interview"],
      archetype: "emerging_growth",
      followers: 59000,
      views: 340000,
      engagementRate: 6.2,
      platform: "Instagram",
      handle: "@tara.tropicalspaces",
      services: [
        {
          title: "Architectural Space & Lighting Feature",
          platform: "Instagram",
          price: 750,
          turnaroundDays: 6,
          description: "Cinematic study of daylight angles, shadow casting, and material interaction.",
          deliverables: "1x 60s Reel, 4x Interior architectural stills",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "The Laterite Courtyard House in Assagao",
          platform: "Instagram",
          description: "Passive cooling without air conditioning in tropical peak summer.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Ananya Nair",
      username: "ananya.studio",
      email: "ananya.nair@showcase.infurizz.local",
      bio: "Ceramicist throwing stoneware tableware, experimenting with wood-ash glazes, and documenting meditative studio routines in Chennai.",
      category: "Lifestyle",
      location: "Chennai",
      niche: "Studio Pottery, Wood-fired Stoneware & Visual Diaries",
      audienceRange: "10k–50k",
      collabPrefs: "Specialty tea houses, hand-poured coffee roasters, culinary studios",
      languages: ["English", "Tamil"],
      contentTypes: ["Pottery Wheel ASMR", "Kiln Opening Film", "Tabletop Stills"],
      archetype: "high_engagement_niche",
      followers: 43000,
      views: 280000,
      engagementRate: 7.4,
      platform: "Instagram",
      handle: "@ananya.stoneware",
      services: [
        {
          title: "Meditative Studio Pottery Feature",
          platform: "Instagram",
          price: 500,
          turnaroundDays: 5,
          description: "Quiet wheel-throwing and glaze application film pairing ceramic objects with brand goods.",
          deliverables: "1x 60s Reel, 3x High-res tabletop stills, Story Diary",
          revisions: 1,
        },
      ],
      portfolio: [
        {
          title: "Wood-Fired Anagama Series",
          platform: "Instagram",
          description: "72-hour pine wood firing creating natural ash blush textures.",
          externalUrl: "https://instagram.com",
        },
      ],
    },
    {
      name: "Isha Quill",
      username: "isha.quill",
      email: "isha@example.com",
      bio: "I write and film short pieces about notebooks and field notes.",
      category: "Lifestyle",
      location: "Lisbon",
      niche: "field notes",
      audienceRange: "10k–50k",
      collabPrefs: "One short film, shot simply.",
      languages: ["English"],
      contentTypes: ["Field Notes Film", "Notebook Stills"],
      archetype: "established_steady",
      followers: 24000,
      views: 120000,
      engagementRate: 5.1,
      platform: "Instagram",
      handle: "@isha.quill",
      services: [],
      portfolio: [],
    },
    {
      name: "alex",
      username: "alex.creator",
      email: "abdulasifbhelim2009@gmail.com",
      bio: "Digital creator and UI designer exploring clean interfaces and modern web design.",
      category: "Fashion",
      location: "Waranga",
      niche: "website design",
      audienceRange: "Under 10k",
      collabPrefs: "Clean design and creative collaborations",
      languages: ["English"],
      contentTypes: ["Design Reels", "Interface Stills"],
      archetype: "emerging_growth",
      followers: 8500,
      views: 45000,
      engagementRate: 6.4,
      platform: "Instagram",
      handle: "@alex.designs",
      services: [],
      portfolio: [],
    },
  ];

  // 2. BRANDS DEFINITION (13 distinct fictional brands)
  const brandData = [
    {
      name: "Kora Studios",
      email: "collab@korastudios.infurizz.local",
      location: "Mumbai",
      about: "Conscious apparel house crafting unbleached organic linen trousers, boxy overshirts, and everyday silhouettes dyed with plant tannins.",
      campaigns: [
        {
          name: "Monsoon Linen Capsule 2026",
          category: "Fashion",
          creatorNiche: "Minimalist Streetwear & Vintage Denim",
          platforms: ["Instagram", "TikTok"],
          audienceRange: "50k–250k",
          location: "Mumbai",
          budgetMin: 800,
          budgetMax: 1800,
          deliverables: "1x 9:16 Editorial Reel, 3x High-res Stills, 2x Story Frames",
          status: "Open",
        },
        {
          name: "The Everyday Boxy Tee Study",
          category: "Fashion",
          creatorNiche: "Everyday Urban Essentials & Technical Accessories",
          platforms: ["Instagram"],
          audienceRange: "10k–50k",
          location: "Bengaluru",
          budgetMin: 450,
          budgetMax: 900,
          deliverables: "1x Reel styling 3 outfits with one tee, caption review",
          status: "Open",
        },
      ],
    },
    {
      name: "Outlier Threadworks",
      email: "partnerships@outlierthreads.infurizz.local",
      location: "Bengaluru",
      about: "Technical outerwear lab developing weather-sealed storm shells, taped seam anoraks, and abrasion-resistant cordura pants.",
      campaigns: [
        {
          name: "Storm Shell Field Test Series",
          category: "Fashion",
          creatorNiche: "Upcycled Workwear & Techwear Aesthetics",
          platforms: ["TikTok", "Instagram"],
          audienceRange: "50k–250k",
          location: "Berlin",
          budgetMin: 1200,
          budgetMax: 2400,
          deliverables: "1x TikTok wear-test video in inclement rain, 3x macro waterproof stills",
          status: "Open",
        },
      ],
    },
    {
      name: "Aethel Cashmere",
      email: "press@aethelcashmere.infurizz.local",
      location: "London",
      about: "Heirloom Scottish knitwear studio spinning 4-ply un-dyed Mongolian cashmere sweaters meant to outlast fast fashion cycles.",
      campaigns: [
        {
          name: "Quiet Foundations: Cashmere Care & Wear",
          category: "Fashion",
          creatorNiche: "Quiet Luxury & Sustainable Cashmere Wardrobe",
          platforms: ["YouTube"],
          audienceRange: "50k–250k",
          location: "London",
          budgetMin: 1600,
          budgetMax: 3000,
          deliverables: "1x Dedicated 10-minute YouTube video on garment lifespan and tactile feel",
          status: "Open",
        },
      ],
    },
    {
      name: "Veda Botanicals",
      email: "press@vedabotanicals.infurizz.local",
      location: "Jaipur",
      about: "Clinical botanical skincare formulating cold-pressed moringa, sea buckthorn barrier elixirs, and copper distillations in Rajasthan.",
      campaigns: [
        {
          name: "Barrier Integrity Clinical Review",
          category: "Beauty",
          creatorNiche: "Barrier Repair & Botanical Skincare Science",
          platforms: ["Instagram"],
          audienceRange: "50k–250k",
          location: "Kolkata",
          budgetMin: 900,
          budgetMax: 1600,
          deliverables: "1x 60s Educational Reel explaining oil lipid ratios + 2x story frames",
          status: "Open",
        },
        {
          name: "Nightly Scalp & Hair Oiling Ritual",
          category: "Beauty",
          creatorNiche: "Hair Health, Scalp Care & Ayurvedic Tonics",
          platforms: ["Instagram"],
          audienceRange: "10k–50k",
          location: "Hyderabad",
          budgetMin: 550,
          budgetMax: 1100,
          deliverables: "1x 60s Reel demonstrating scalp massage marma points",
          status: "Open",
        },
      ],
    },
    {
      name: "Solis Sun",
      email: "hello@solissun.infurizz.local",
      location: "Goa",
      about: "Ocean-safe mineral SPF formulating non-nano zinc oxide fluid for humid tropical environments without white residue.",
      campaigns: [
        {
          name: "Zero White Cast Tropical Stress Test",
          category: "Beauty",
          creatorNiche: "Clean K-Beauty Formulations & Sun Protection",
          platforms: ["YouTube", "Instagram"],
          audienceRange: "50k–250k",
          location: "Singapore",
          budgetMin: 1500,
          budgetMax: 2800,
          deliverables: "1x UV Camera demonstration video, 1x Reel on sweat resistance",
          status: "Open",
        },
      ],
    },
    {
      name: "Mettle Grooming",
      email: "collabs@mettlegrooming.infurizz.local",
      location: "Delhi",
      about: "Barbering apothecary crafting solid sandalwood shaving blocks, safety razors, and cedarwood beard oils for men.",
      campaigns: [
        {
          name: "The Traditional Morning Wet Shave",
          category: "Lifestyle",
          creatorNiche: "Bespoke Tailoring & Horology Journal",
          platforms: ["YouTube", "Instagram"],
          audienceRange: "50k–250k",
          location: "New York",
          budgetMin: 1200,
          budgetMax: 2200,
          deliverables: "1x YouTube shaving ritual integration, 3x product stills",
          status: "Open",
        },
      ],
    },
    {
      name: "Nomad Roasters",
      email: "partnerships@nomadroasters.infurizz.local",
      location: "Bengaluru",
      about: "Direct-trade micro roastery sourcing anaerobic microlots from Chikmagalur and Biligirirangana Hills.",
      campaigns: [
        {
          name: "Pour-over Extraction & Estate Origins",
          category: "Food",
          creatorNiche: "Artisanal Sourdough & Nordic Wild Ferments",
          platforms: ["YouTube", "Instagram"],
          audienceRange: "50k–250k",
          location: "London",
          budgetMin: 1100,
          budgetMax: 2000,
          deliverables: "1x Longform brewing breakdown video with tasting notes",
          status: "Open",
        },
        {
          name: "South Indian Single-Origin Filter Roast",
          category: "Food",
          creatorNiche: "Kerala Spice Route & Backwater Café Discovery",
          platforms: ["Instagram"],
          audienceRange: "10k–50k",
          location: "Kochi",
          budgetMin: 500,
          budgetMax: 950,
          deliverables: "1x 60s Reel showing traditional brass filter brew",
          status: "Open",
        },
      ],
    },
    {
      name: "Amrita Kombucha",
      email: "hello@amritakombucha.infurizz.local",
      location: "Pune",
      about: "Wild-fermented botanical sparkling tonics brewed with wild Nilgiri black tea and mountain honey.",
      campaigns: [
        {
          name: "Live Cultured Summer Ferments",
          category: "Food",
          creatorNiche: "Regional Coastal Konkan Seafood & Fermentation",
          platforms: ["Instagram"],
          audienceRange: "50k–250k",
          location: "Mumbai",
          budgetMin: 700,
          budgetMax: 1300,
          deliverables: "1x Pairing Reel matching kombucha with spicy seafood",
          status: "Open",
        },
      ],
    },
    {
      name: "Earthly Oats",
      email: "hello@earthlyoats.infurizz.local",
      location: "Hyderabad",
      about: "Sprouted oat milk and clean plant creamers formulated with zero gums, seed oils, or synthetic thickeners.",
      campaigns: [
        {
          name: "Zero-Gum Barista Microfoam Challenge",
          category: "Food",
          creatorNiche: "Modern Gujarati Heritage Dishes & Seasonal Thalis",
          platforms: ["Instagram"],
          audienceRange: "50k–250k",
          location: "Ahmedabad",
          budgetMin: 750,
          budgetMax: 1400,
          deliverables: "1x Recipe reel incorporating plant milk into traditional desserts",
          status: "Open",
        },
      ],
    },
    {
      name: "Aeris Audio",
      email: "press@aerisaudio.infurizz.local",
      location: "Berlin",
      about: "Precision acoustic lab manufacturing open-back planar magnetic studio reference headphones and discrete DAC amplifiers.",
      campaigns: [
        {
          name: "Planar Driver Harmonic Distortion Study",
          category: "Technology",
          creatorNiche: "Consumer Audio Engineering & Planar Acoustic Tests",
          platforms: ["YouTube"],
          audienceRange: "50k–250k",
          location: "Pune",
          budgetMin: 1400,
          budgetMax: 2600,
          deliverables: "1x Dedicated acoustic measurement video with harmonic charts",
          status: "Open",
        },
      ],
    },
    {
      name: "Form Studio",
      email: "design@formstudio.infurizz.local",
      location: "Tokyo",
      about: "CNC milled 6063 aluminium desk objects, monitor risers, and cable ducts for minimal, focused workstations.",
      campaigns: [
        {
          name: "The Monolithic Aluminium Workspace",
          category: "Technology",
          creatorNiche: "Minimal Desk Setups & Custom Hardware",
          platforms: ["YouTube"],
          audienceRange: "50k–250k",
          location: "Tokyo",
          budgetMin: 2200,
          budgetMax: 3500,
          deliverables: "1x 10-12 min YouTube studio setup tour with macro lighting",
          status: "Open",
        },
      ],
    },
    {
      name: "Syntax Labs",
      email: "dev@syntaxlabs.infurizz.local",
      location: "San Francisco",
      about: "Developer observability infrastructure providing distributed tracing and local OpenTelemetry visualizers.",
      campaigns: [
        {
          name: "Tracing Local Microservices in Neovim",
          category: "Technology",
          creatorNiche: "Developer Tooling, Terminal Workflows & Open Source",
          platforms: ["YouTube"],
          audienceRange: "50k–250k",
          location: "Bengaluru",
          budgetMin: 1500,
          budgetMax: 2500,
          deliverables: "1x 8 min tutorial highlighting local terminal trace viewing",
          status: "Open",
        },
        {
          name: "Benchmarking LLM Inference Latency",
          category: "Technology",
          creatorNiche: "Local LLMs, Open Weights & AI Engineering Workflows",
          platforms: ["YouTube"],
          audienceRange: "50k–250k",
          location: "San Francisco",
          budgetMin: 2500,
          budgetMax: 4200,
          deliverables: "1x 15 min YouTube technical analysis video + GitHub benchmark repo",
          status: "Open",
        },
      ],
    },
    {
      name: "Terracotta & Timber",
      email: "studio@terracottatimber.infurizz.local",
      location: "Kochi",
      about: "Craft collective turning reclaimed teak furniture, wood-fired stoneware vessels, and coastal interior objects.",
      campaigns: [
        {
          name: "Living with Coastal Earthenware",
          category: "Lifestyle",
          creatorNiche: "Studio Pottery, Wood-fired Stoneware & Visual Diaries",
          platforms: ["Instagram"],
          audienceRange: "10k–50k",
          location: "Chennai",
          budgetMin: 600,
          budgetMax: 1200,
          deliverables: "1x 60s Reel showcasing handmade tableware in daily dining",
          status: "Open",
        },
        {
          name: "Laterite & Teak Material Harmony",
          category: "Lifestyle",
          creatorNiche: "Tropical Brutalism, Reclaimed Teak & Coastal Architecture",
          platforms: ["Instagram"],
          audienceRange: "50k–250k",
          location: "Goa",
          budgetMin: 850,
          budgetMax: 1600,
          deliverables: "1x Architectural reel exploring warm timber against raw stone",
          status: "Open",
        },
      ],
    },
    {
      name: "Paper Studio",
      email: "paper@example.com",
      location: "Lisbon",
      about: "A small paper studio making notebooks. Created in this prototype, not a sample company.",
      campaigns: [
        {
          name: "Ink Notes",
          category: "Lifestyle",
          creatorNiche: "field notes",
          platforms: ["Instagram"],
          audienceRange: "10k–50k",
          location: "Anywhere",
          budgetMin: 1000,
          budgetMax: 2000,
          deliverables: "One short film of someone using a notebook",
          status: "Open",
        },
      ],
    },
    {
      name: "alex",
      email: "asifabdul@gmail.com",
      location: "Waranga",
      about: "Digital agency and creative brand studio.",
      campaigns: [],
    },
  ];

  // 3. PERSIST CREATORS (Batch / in-memory optimized)
  console.log(`Checking existing users and seeding missing creators...`);
  const allExistingUsers = await prisma.user.findMany({
    include: {
      creator: { include: { services: true, portfolio: true, socials: true } },
      brand: { include: { campaigns: true } },
    },
  });
  const userByEmail = new Map(allExistingUsers.map((u) => [u.email, u]));

  for (const c of creatorData) {
    if (!userByEmail.has(c.email)) {
      console.log(`Creating missing creator user: ${c.name} (${c.email})`);
      const newUser = await prisma.user.create({
        data: {
          email: c.email,
          passwordHash,
          role: "CREATOR",
          creator: {
            create: {
              name: c.name,
              username: c.username,
              bio: c.bio,
              category: c.category,
              location: c.location,
              niche: c.niche,
              audienceRange: c.audienceRange,
              collabPrefs: c.collabPrefs,
              languages: JSON.stringify(c.languages),
              contentTypes: JSON.stringify(c.contentTypes),
              isDemo: true,
              socials: {
                create: [
                  {
                    platform: c.platform,
                    handle: c.handle,
                    audienceNote: `${c.followers.toLocaleString()} audience footprint`,
                    isSample: true,
                    connectionStatus: "CONNECTED",
                    verifiedAt: new Date(),
                  },
                ],
              },
              services: {
                create: (c.services || []).map((s) => ({
                  title: s.title,
                  description: s.description,
                  platform: s.platform,
                  price: s.price,
                  turnaroundDays: s.turnaroundDays,
                  deliverables: s.deliverables,
                  revisions: s.revisions,
                  isActive: true,
                })),
              },
              portfolio: {
                create: (c.portfolio || []).map((p, idx) => ({
                  title: p.title,
                  platform: p.platform,
                  description: p.description,
                  externalUrl: p.externalUrl,
                  sortOrder: idx + 1,
                })),
              },
            },
          },
        },
        include: { creator: { include: { services: true, portfolio: true, socials: true } }, brand: { include: { campaigns: true } } },
      });
      userByEmail.set(c.email, newUser);
    }
  }

  // 4. PERSIST BRANDS & CAMPAIGNS (Batch / in-memory optimized)
  console.log(`Checking existing brands and seeding missing brands...`);
  for (const b of brandData) {
    if (!userByEmail.has(b.email)) {
      console.log(`Creating missing brand user: ${b.name} (${b.email})`);
      const newUser = await prisma.user.create({
        data: {
          email: b.email,
          passwordHash,
          role: "BRAND",
          brand: {
            create: {
              name: b.name,
              about: b.about,
              location: b.location,
              isDemo: true,
              campaigns: {
                create: (b.campaigns || []).map((camp) => ({
                  name: camp.name,
                  category: camp.category,
                  creatorNiche: camp.creatorNiche,
                  platforms: JSON.stringify(camp.platforms),
                  audienceRange: camp.audienceRange,
                  location: camp.location,
                  budgetMin: camp.budgetMin,
                  budgetMax: camp.budgetMax,
                  deliverables: camp.deliverables,
                  status: camp.status,
                  isDemo: true,
                })),
              },
            },
          },
        },
        include: { creator: { include: { services: true, portfolio: true, socials: true } }, brand: { include: { campaigns: true } } },
      });
      userByEmail.set(b.email, newUser);
    }
  }

  // Batch query all creators and all brands
  const allCreators = await prisma.creator.findMany();
  const allBrands = await prisma.brand.findMany({ include: { campaigns: true } });
  const allCampaigns = await prisma.campaign.findMany();
  console.log(`Counts: ${allCreators.length} creators, ${allBrands.length} brands, ${allCampaigns.length} campaigns`);

  // Social accounts check
  const existingSocialAccounts = await prisma.socialAccount.findMany();
  const socialAccountByCreatorId = new Map(existingSocialAccounts.map((s) => [s.creatorId, s]));

  // Social Metric Snapshots Check
  const currentMetricCount = await prisma.socialMetricSnapshot.count();
  console.log(`Current metric snapshots count: ${currentMetricCount}`);
  if (currentMetricCount < 2700) {
    console.log("Seeding metric snapshots in bulk...");
    const past30Dates = generatePastDates(30);
    const snapshotsToInsert: any[] = [];

    for (const c of creatorData) {
      const creatorRecord = allCreators.find((cr) => cr.username === c.username);
      if (!creatorRecord) continue;
      const sa = socialAccountByCreatorId.get(creatorRecord.id);
      if (!sa) continue;

      const baseFollowers = c.followers;
      const baseViews = Math.round(c.views / 30);
      const growthFactor = c.archetype === "emerging_growth" ? 0.006 : c.archetype === "established_steady" ? 0.001 : 0.003;

      for (let dayIdx = 0; dayIdx < past30Dates.length; dayIdx++) {
        const snapDate = past30Dates[dayIdx];
        const dayOffset = 30 - dayIdx;
        const followersAtDay = Math.round(baseFollowers * (1 - (dayOffset * growthFactor)));
        const viewsAtDay = Math.round(baseViews * (0.85 + Math.sin(dayIdx * 0.4) * 0.15));
        const dailyEngagement = Math.round((c.engagementRate + (Math.sin(dayIdx * 0.7) * 0.3)) * 10) / 10;

        snapshotsToInsert.push({
          socialAccountId: sa.id,
          canonicalMetricName: "AUDIENCE_FOLLOWER_COUNT",
          providerMetricIdentifier: "follower_count",
          valueInt: BigInt(followersAtDay),
          metricValueType: "INTEGER",
          unit: "COUNT",
          sourceType: "PROVIDER_REPORTED",
          snapshotDate: snapDate,
          freshnessState: "FRESH",
        });

        snapshotsToInsert.push({
          socialAccountId: sa.id,
          canonicalMetricName: "CONTENT_LIFETIME_VIEWS",
          providerMetricIdentifier: "views",
          valueInt: BigInt(viewsAtDay),
          metricValueType: "INTEGER",
          unit: "COUNT",
          sourceType: "PROVIDER_REPORTED",
          snapshotDate: snapDate,
          freshnessState: "FRESH",
        });

        snapshotsToInsert.push({
          socialAccountId: sa.id,
          canonicalMetricName: "ENGAGEMENT_RATE",
          providerMetricIdentifier: "engagement_rate",
          valueDecimal: dailyEngagement,
          metricValueType: "DECIMAL",
          unit: "PERCENTAGE",
          sourceType: "DERIVED",
          calculationMethod: "(likes + comments + saves) / reach",
          snapshotDate: snapDate,
          freshnessState: "FRESH",
        });
      }
    }

    if (snapshotsToInsert.length > 0) {
      await prisma.socialMetricSnapshot.createMany({
        data: snapshotsToInsert,
        skipDuplicates: true,
      });
    }
  } else {
    console.log(`Metric snapshots already complete (${currentMetricCount} records). Skipping.`);
  }

  // 5. APPLICATIONS, MATCHES & CONVERSATIONS
  const currentAppCount = await prisma.campaignApplication.count();
  console.log(`Current applications count: ${currentAppCount}`);
  if (currentAppCount < 54) {
    const existingApps = await prisma.campaignApplication.findMany({
      select: { campaignId: true, creatorId: true },
    });
    const existingAppKeys = new Set(existingApps.map((a) => `${a.campaignId}:${a.creatorId}`));

    const pitchMessages = [
      `I have followed this brief closely. My audience aligns directly with this aesthetic—I've previously featured similar pieces with high saves and engagement. I propose shooting an editorial 9:16 film focusing on garment movement and texture details.`,
      `Our studio would love to collaborate on this project. Given our deep focus on this niche, we can guarantee authentic integration and an in-depth review that highlights your craftsmanship.`,
      `Excited about this brief! We can deliver within 5 business days with full color-graded deliverables and organic storytelling tailored to our audience.`,
    ];

    const appsToInsert: any[] = [];
    for (const campaign of allCampaigns) {
      const relevantCreators = allCreators.filter(
        (c) => c.category === campaign.category || c.niche === campaign.creatorNiche
      );

      for (let i = 0; i < Math.min(relevantCreators.length, 3); i++) {
        const creator = relevantCreators[i];
        const key = `${campaign.id}:${creator.id}`;
        if (!existingAppKeys.has(key)) {
          const proposedRate = Math.round((campaign.budgetMin + campaign.budgetMax) / 2);
          const isAccepted = i === 0;
          const isRejected = i === 2;
          const status = isAccepted ? "ACCEPTED" : isRejected ? "REJECTED" : "PENDING";
          appsToInsert.push({
            campaignId: campaign.id,
            creatorId: creator.id,
            proposedRate,
            pitchMessage: pitchMessages[i % pitchMessages.length],
            status,
          });
          existingAppKeys.add(key);
        }
      }
    }

    if (appsToInsert.length > 0) {
      await prisma.campaignApplication.createMany({
        data: appsToInsert,
        skipDuplicates: true,
      });
    }
  } else {
    console.log(`Applications already complete (${currentAppCount} records). Skipping.`);
  }

  // Matches & Conversations
  const currentConvoCount = await prisma.conversation.count();
  console.log(`Current conversations count: ${currentConvoCount}`);
  if (currentConvoCount < 19) {
    const allApps = await prisma.campaignApplication.findMany({
      include: {
        campaign: { include: { brand: { select: { userId: true, name: true } } } },
        creator: { select: { id: true, name: true, niche: true, userId: true } },
      },
    });

    const acceptedApps = allApps.filter((a) => a.status === "ACCEPTED");
    const existingMatches = await prisma.match.findMany({
      select: { id: true, creatorId: true, campaignId: true },
    });
    const existingMatchKeys = new Set(existingMatches.map((m) => `${m.creatorId}:${m.campaignId}`));

    const matchesToInsert = acceptedApps
      .filter((a) => !existingMatchKeys.has(`${a.creatorId}:${a.campaignId}`))
      .map((a) => ({
        creatorId: a.creatorId,
        campaignId: a.campaignId,
      }));

    if (matchesToInsert.length > 0) {
      await prisma.match.createMany({
        data: matchesToInsert,
        skipDuplicates: true,
      });
    }

    const allMatches = await prisma.match.findMany({
      include: {
        campaign: { include: { brand: { select: { userId: true, name: true } } } },
        creator: { select: { id: true, name: true, niche: true, userId: true } },
        conversation: { select: { id: true } },
      },
    });

    const existingConvos = await prisma.conversation.findMany({
      select: { id: true, matchId: true },
    });
    const existingConvoMatchIds = new Set(existingConvos.map((c) => c.matchId));

    const convosToCreate = allMatches.filter((m) => !existingConvoMatchIds.has(m.id));
    for (const match of convosToCreate) {
      const convo = await prisma.conversation.create({
        data: { matchId: match.id },
      });

      const brandUserId = match.campaign.brand.userId;
      const creatorUserId = match.creator.userId;

      await prisma.message.createMany({
        data: [
          {
            conversationId: convo.id,
            senderId: brandUserId,
            body: `Hi ${match.creator.name}! We were thrilled to review your proposal for "${match.campaign.name}". Your previous work on ${match.creator.niche} is exactly the editorial look we are aiming for.`,
            createdAt: new Date(Date.now() - 86400000 * 2),
          },
          {
            conversationId: convo.id,
            senderId: creatorUserId,
            body: `Thank you so much! Really excited for this. I have already drafted a visual moodboard with 3 styling options. Would you prefer we focus more on studio daylight stills or outdoor motion footage?`,
            createdAt: new Date(Date.now() - 86400000 * 1.5),
          },
          {
            conversationId: convo.id,
            senderId: brandUserId,
            body: `Natural daylight motion footage would be incredible—especially capturing the texture in motion. We are sending the product sample package to your studio today. Looking forward to your initial cut!`,
            createdAt: new Date(Date.now() - 86400000 * 1),
          },
          {
            conversationId: convo.id,
            senderId: creatorUserId,
            body: `Got the tracking number! I will confirm as soon as the package arrives and begin the test shoots.`,
            createdAt: new Date(Date.now() - 86400000 * 0.4),
          },
        ],
      });
    }
  } else {
    console.log(`Conversations already complete (${currentConvoCount} records). Skipping.`);
  }

  // 6. COMMUNITY POSTS (20 rich posts with reactions & comments)
  console.log("Seeding rich community posts, reactions, and peer creator comments...");
  const postBlueprints = [
    {
      authorEmail: "mira@demo.infurizz.local",
      content: "Just wrapped up our 3-part artisanal cooking series! Excited to announce we crossed 50k reach and partnered with two conscious kitchenware labels.",
      postType: "MILESTONE",
      tags: ["#recipes", "#milestone", "#cooking"],
    },
    {
      authorEmail: "northstar@demo.infurizz.local",
      content: "Announcing our Spring 2026 Trail Collection! We are actively reviewing creator applications on our Trail Notes brief.",
      postType: "PRODUCT_LAUNCH",
      tags: ["#launch", "#outdoor", "#partnerships"],
    },
    {
      authorEmail: "aarav.mehta@showcase.infurizz.local",
      content: "Just wrapped a 3-day monsoon lookbook shoot across South Bombay. Heavy rain, raw denim, and zero umbrellas. Nothing tests garment water-shedding quite like an August downpour.",
      postType: "PROJECT",
      tags: ["#streetwear", "#mumbaifashion", "#rawdenim", "#editorial"],
    },
    {
      authorEmail: "collab@korastudios.infurizz.local",
      content: "We just published the Monsoon Linen Capsule 2026 brief on INFURIZZ. Looking for 2 creators with a keen eye for unbleached textures and architectural draping. Budgets up to $1,800.",
      postType: "PRODUCT_LAUNCH",
      tags: ["#brandbrief", "#sustainablefashion", "#creatorbrief"],
    },
    {
      authorEmail: "kaelen.tech@showcase.infurizz.local",
      content: "Benchmarked 4 quantized 70B open-weight models running fully locally on 128GB unified memory. Zero cloud API calls, full privacy, and latency hovered around 18 tokens/sec. Video breakdown dropping Friday.",
      postType: "ACHIEVEMENT",
      tags: ["#localllm", "#opensource", "#applehardware", "#developer"],
    },
    {
      authorEmail: "press@aerisaudio.infurizz.local",
      content: "Our Aeris Planar Magnetic headphones are entering production. We partnered with 3 independent acoustic reviewers on INFURIZZ for pre-launch harmonic frequency testing.",
      postType: "COLLAB_ANNOUNCEMENT",
      tags: ["#audiophile", "#planarheadphones", "#engineering"],
    },
    {
      authorEmail: "priyansha.roy@showcase.infurizz.local",
      content: "Skincare barrier tip: In high humidity, occlusive heavy balms can trap heat and disrupt the microbiome. Look for lightweight squalane and centella fractions that breathe while locking in hydration.",
      postType: "UPDATE",
      tags: ["#skincareeducation", "#barrierscience", "#cosmetics"],
    },
    {
      authorEmail: "zoe.lindqvist@showcase.infurizz.local",
      content: "Deconstructed 4 military parachute canopies into 8 modular parkas. Every panel has a story, and the ripstop nylon is practically indestructible. Sustainable design doesn't mean compromising on utility.",
      postType: "PROJECT",
      tags: ["#upcycling", "#workwear", "#berlindesign"],
    },
    {
      authorEmail: "kabir.sen@showcase.infurizz.local",
      content: "Dawn at Sassoon Docks: Kingfish, baby squid, and the smell of sea spray. Filmed our entire Konkan coastal recipe series with zero studio lights—just the morning sun and cast-iron sizzle.",
      postType: "PROJECT",
      tags: ["#culinary", "#mumbaiseafood", "#konkan", "#recipefilm"],
    },
    {
      authorEmail: "partnerships@nomadroasters.infurizz.local",
      content: "Excited to welcome Arjun Varma (@arjun.eats) to the Nomad family! We're co-producing a 3-part documentary uncovering heirloom coffee varietals in Wayanad and Biligirirangana Hills.",
      postType: "COLLAB_ANNOUNCEMENT",
      tags: ["#specialtycoffee", "#coffeeroasting", "#collaboration"],
    },
    {
      authorEmail: "nikhil.verma@showcase.infurizz.local",
      content: "Hit a clean 44kg kettlebell Turkish Get-Up milestone this morning. Functional shoulder stability takes months of patient rotator cuff reinforcement, but the payoff is injury-free longevity.",
      postType: "MILESTONE",
      tags: ["#kettlebell", "#strengthtraining", "#mobility"],
    },
    {
      authorEmail: "sanya.malhotra@showcase.infurizz.local",
      content: "Reminder for freelance creators: Don't let tax filing sneak up on you. Track your studio gear write-offs, deductible software subscriptions, and foreign currency remittance receipts monthly.",
      postType: "UPDATE",
      tags: ["#personalfinance", "#creatorbusiness", "#freelancetax"],
    },
    {
      authorEmail: "ishaan.gupta@showcase.infurizz.local",
      content: "Released version 2.4 of my Neovim telemetry plugin. Clean terminal dashboards, minimal memory footprint, and instantaneous trace inspection. Check it out on GitHub!",
      postType: "PRODUCT_LAUNCH",
      tags: ["#neovim", "#rust", "#developertools", "#opensource"],
    },
    {
      authorEmail: "tara.deshmukh@showcase.infurizz.local",
      content: "Laterite courtyards and passive breezes in Goa. Filmed a 4K walkthrough of an architect's self-built coastal residence using reclaimed teak and zero artificial cooling.",
      postType: "PROJECT",
      tags: ["#architecture", "#tropicalmodernism", "#goa"],
    },
    {
      authorEmail: "ananya.nair@showcase.infurizz.local",
      content: "After 72 hours of continuous wood firing, the Anagama kiln was opened today. Natural ash glazes created shades of celadon and deep iron red that no electric kiln could ever replicate.",
      postType: "MILESTONE",
      tags: ["#pottery", "#stoneware", "#ceramics", "#craft"],
    },
    {
      authorEmail: "dev.joshi@showcase.infurizz.local",
      content: "Pairing handwoven khadi cotton with vintage running sneakers. Heritage fabrics belong in the street, not locked behind museum glass.",
      postType: "PROJECT",
      tags: ["#sneakers", "#heritagecraft", "#delhistreetwear"],
    },
    {
      authorEmail: "press@vedabotanicals.infurizz.local",
      content: "Our Cold-Pressed Moringa & Centella Elixir has cleared dermatological patch testing with a 99.4% non-comedogenic rating. First creator campaign deliveries go out tomorrow!",
      postType: "PRODUCT_LAUNCH",
      tags: ["#skincare", "#ayurvedicbotanicals", "#jaipur"],
    },
    {
      authorEmail: "amara.okafor@showcase.infurizz.local",
      content: "Peak marathon week concluded: 104 miles logged, 2 tempo workouts in torrential rain, and zero shin splints. Recovery protocol: sleep, hydration, and clean nutrition.",
      postType: "MILESTONE",
      tags: ["#running", "#marathontraining", "#londonrunners"],
    },
    {
      authorEmail: "kenji.sato@showcase.infurizz.local",
      content: "Machined from a single solid billet of 6063 aerospace aluminium. The acoustic profile of this desk riser dampens table vibrations completely. Video on setup ergonomics is live.",
      postType: "PROJECT",
      tags: ["#desksetup", "#minimalism", "#industrialdesign", "#tokyo"],
    },
    {
      authorEmail: "meera.nambiar@showcase.infurizz.local",
      content: "Solo bivouac at 5,200m in Zanskar. Woke up to fresh powder snow, complete silence, and hot filter coffee. Ultralight gear makes the wild feel like home.",
      postType: "PROJECT",
      tags: ["#mountaineering", "#himalayas", "#wilderness"],
    },
  ];

  const existingPosts = await prisma.post.findMany({
    select: { id: true, content: true },
  });
  const existingPostContents = new Set(existingPosts.map((p) => p.content));

  const postsToInsert: any[] = [];
  for (const blueprint of postBlueprints) {
    if (!existingPostContents.has(blueprint.content)) {
      const author = userByEmail.get(blueprint.authorEmail);
      if (author) {
        postsToInsert.push({
          authorId: author.id,
          content: blueprint.content,
          postType: blueprint.postType,
          tags: JSON.stringify(blueprint.tags),
        });
      }
    }
  }

  if (postsToInsert.length > 0) {
    await prisma.post.createMany({
      data: postsToInsert,
      skipDuplicates: true,
    });
  }

  const allActivePosts = await prisma.post.findMany();

  // Batch insert all reactions and comments in memory
  const existingReactions = await prisma.postReaction.findMany({
    select: { postId: true, userId: true },
  });
  const existingReactionKeys = new Set(existingReactions.map((r) => `${r.postId}:${r.userId}`));

  const existingComments = await prisma.postComment.findMany({
    select: { postId: true, userId: true },
  });
  const existingCommentKeys = new Set(existingComments.map((c) => `${c.postId}:${c.userId}`));

  const reactionsToInsert: any[] = [];
  const commentsToInsert: any[] = [];

  const reactingCreators = allCreators.slice(0, 8);

  for (const post of allActivePosts) {
    for (const rc of reactingCreators) {
      if (rc.userId !== post.authorId) {
        const key = `${post.id}:${rc.userId}`;
        if (!existingReactionKeys.has(key)) {
          const reactionTypes = ["APPLAUD", "LIKE", "INSIGHTFUL", "COLLAB"];
          const reaction = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
          reactionsToInsert.push({
            postId: post.id,
            userId: rc.userId,
            reaction,
          });
          existingReactionKeys.add(key);
        }
      }
    }

    const commenter = allCreators.find((c) => c.userId !== post.authorId);
    if (commenter) {
      const commentKey = `${post.id}:${commenter.userId}`;
      if (!existingCommentKeys.has(commentKey)) {
        const commentContents = [
          "Incredible attention to detail here! The textures look exceptional.",
          "This is what real creator craft looks like. Excited to see where this collaboration goes!",
          "Great insights—definitely saving this post for future reference.",
          "The production quality in this is unmatched. Outstanding work!",
        ];
        const content = commentContents[Math.floor(Math.random() * commentContents.length)];
        commentsToInsert.push({
          postId: post.id,
          userId: commenter.userId,
          content,
        });
        existingCommentKeys.add(commentKey);
      }
    }
  }

  if (reactionsToInsert.length > 0) {
    await prisma.postReaction.createMany({
      data: reactionsToInsert,
      skipDuplicates: true,
    });
  }

  if (commentsToInsert.length > 0) {
    await prisma.postComment.createMany({
      data: commentsToInsert,
      skipDuplicates: true,
    });
  }

  console.log("=== SHOWCASE DATA POPULATION COMPLETE ===");
  console.log(`Seeded / verified:`);
  console.log(`- ${allCreators.length} Creators`);
  console.log(`- ${allBrands.length} Brands`);
  console.log(`- ${allCampaigns.length} Campaigns`);
  console.log(`- ${allActivePosts.length} Community Posts`);
}


main()
  .catch((e) => {
    console.error("Error during showcase data population:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
