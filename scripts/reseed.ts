/**
 * Wipe all posts and reseed with random 30-90 posts per provider, random tags.
 *
 * Usage:
 *   DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npx tsx scripts/reseed.ts
 */

import { inArray, sql } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/src/db/schema";

const { users, posts, comments } = schema;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

const DEV_EMAILS = [
  "mia@dev.local", "ravi@dev.local", "sofia@dev.local", "james@dev.local",
  "lena@dev.local", "kofi@dev.local", "yuki@dev.local", "omar@dev.local",
  "priya@dev.local", "lukas@dev.local"
];

const ALL_TAGS = [
  "Design", "Typography", "Photography", "Illustration", "Architecture",
  "Motion", "Identity", "Packaging", "Editorial", "Web",
  "UI", "Art Direction", "Color", "Grid", "Pattern",
  "Culture", "Film", "Music", "Fashion", "Space"
];

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTags(): string[] {
  return pick(ALL_TAGS, randInt(1, 4));
}

type PostSeed = {
  title: string;
  link: string;
  body: string;
  thumbnailUrl: string;
  profileThumbnailUrl: string;
  providerName: string;
};

const BEHANCE_POSTS: PostSeed[] = [
  { title: "Urban Geometry — Tokyo Architecture Series", link: "https://www.behance.net/gallery/192341580/Urban-Geometry-Tokyo", body: "Minimalist architectural photography exploring symmetry in Shinjuku and Shibuya.", thumbnailUrl: "https://picsum.photos/seed/beh01/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh01/900/1200", providerName: "Behance Photography" },
  { title: "Portrait in Natural Light — Studio Series", link: "https://www.behance.net/gallery/193104750/Portrait-Natural-Light-Studio", body: "Unretouched studio portraiture using only north-facing window light.", thumbnailUrl: "https://picsum.photos/seed/beh02/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh02/900/1200", providerName: "Behance Photography" },
  { title: "Icelandic Highlands — Long Exposure Landscapes", link: "https://www.behance.net/gallery/194207610/Iceland-Long-Exposure-Landscapes", body: "30-second exposures of waterfalls and lava fields at blue hour.", thumbnailUrl: "https://picsum.photos/seed/beh03/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh03/900/1200", providerName: "Behance Photography" },
  { title: "Street Portraits — Marrakech Medina", link: "https://www.behance.net/gallery/191884930/Street-Portraits-Marrakech", body: "Documentary work shot over two weeks in the old city.", thumbnailUrl: "https://picsum.photos/seed/beh04/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh04/900/1200", providerName: "Behance Photography" },
  { title: "Aerial Abstracts — Namib Desert", link: "https://www.behance.net/gallery/195003870/Aerial-Abstracts-Namib-Desert", body: "Drone photography at sunrise over the oldest desert on Earth.", thumbnailUrl: "https://picsum.photos/seed/beh05/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh05/900/1200", providerName: "Behance Photography" },
  { title: "Abandoned Factories — Rust Belt Survey", link: "https://www.behance.net/gallery/190672140/Abandoned-Factories-Rust-Belt", body: "Urban exploration and documentary of post-industrial Michigan.", thumbnailUrl: "https://picsum.photos/seed/beh06/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh06/900/1200", providerName: "Behance Photography" },
  { title: "Morning Fog — Japanese Mountain Lakes", link: "https://www.behance.net/gallery/196230410/Morning-Fog-Japanese-Mountain-Lakes", body: "Still-life landscapes shot at 5am before the fog burned off.", thumbnailUrl: "https://picsum.photos/seed/beh07/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh07/900/1200", providerName: "Behance Photography" },
  { title: "Astrophotography — Atacama Desert Skies", link: "https://www.behance.net/gallery/197451890/Astrophotography-Atacama", body: "Milky Way and southern constellations from 4200m altitude.", thumbnailUrl: "https://picsum.photos/seed/beh08/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh08/900/1200", providerName: "Behance Photography" },
  { title: "Macro Botany — Seasonal Studies", link: "https://www.behance.net/gallery/189563720/Macro-Botany-Seasonal-Studies", body: "Extreme close-up work on native British wildflowers.", thumbnailUrl: "https://picsum.photos/seed/beh09/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh09/900/1200", providerName: "Behance Photography" },
  { title: "Coastal Ireland — Wild Atlantic Way", link: "https://www.behance.net/gallery/198102340/Coastal-Ireland-Wild-Atlantic-Way", body: "Three-week road trip photographing the western Irish coastline.", thumbnailUrl: "https://picsum.photos/seed/beh10/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh10/900/1200", providerName: "Behance Photography" },
  { title: "Festival of Lights — Diwali in Jaipur", link: "https://www.behance.net/gallery/188905610/Festival-Lights-Diwali-Jaipur", body: "Documentary street photography during Diwali celebrations.", thumbnailUrl: "https://picsum.photos/seed/beh11/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh11/900/1200", providerName: "Behance Photography" },
  { title: "Winter Silence — Lapland Reindeer Herders", link: "https://www.behance.net/gallery/199234580/Winter-Silence-Lapland", body: "Portrait documentary of Sámi reindeer herders in Finnish Lapland.", thumbnailUrl: "https://picsum.photos/seed/beh12/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh12/900/1200", providerName: "Behance Photography" },
  { title: "Brutalist Architecture — Soviet Legacy", link: "https://www.behance.net/gallery/187821430/Brutalist-Architecture-Soviet-Legacy", body: "Survey of Constructivist and Brutalist buildings across former Soviet states.", thumbnailUrl: "https://picsum.photos/seed/beh13/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh13/900/1200", providerName: "Behance Photography" },
  { title: "Salt Flats — Uyuni Reflection Season", link: "https://www.behance.net/gallery/200341760/Salt-Flats-Uyuni-Reflection", body: "Shot during rainy season when the flats become the world's largest mirror.", thumbnailUrl: "https://picsum.photos/seed/beh14/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh14/900/1200", providerName: "Behance Photography" },
  { title: "Fashion Editorial — Mono Palette", link: "https://www.behance.net/gallery/186740920/Fashion-Editorial-Mono-Palette", body: "High-contrast B&W editorial shot in a decommissioned power station.", thumbnailUrl: "https://picsum.photos/seed/beh15/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh15/900/1200", providerName: "Behance Photography" },
  { title: "Underwater Kelp Forests — California Coast", link: "https://www.behance.net/gallery/201402890/Underwater-Kelp-Forests-California", body: "Freediving photography in Monterey Bay marine sanctuary.", thumbnailUrl: "https://picsum.photos/seed/beh16/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh16/900/1200", providerName: "Behance Photography" },
  { title: "Night Markets — Southeast Asia", link: "https://www.behance.net/gallery/185690410/Night-Markets-Southeast-Asia", body: "Available-light documentary across Bangkok, Hanoi, and Penang.", thumbnailUrl: "https://picsum.photos/seed/beh17/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh17/900/1200", providerName: "Behance Photography" },
  { title: "Abstract Steel — Bridge Structures", link: "https://www.behance.net/gallery/202501030/Abstract-Steel-Bridge-Structures", body: "Finding graphic abstraction in suspension bridge cables and trusses.", thumbnailUrl: "https://picsum.photos/seed/beh18/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh18/900/1200", providerName: "Behance Photography" },
  { title: "Wildfire Recovery — Oregon 2024", link: "https://www.behance.net/gallery/184602870/Wildfire-Recovery-Oregon-2024", body: "Documentary on forest regrowth and community rebuilding in fire zones.", thumbnailUrl: "https://picsum.photos/seed/beh19/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh19/900/1200", providerName: "Behance Photography" },
  { title: "Carnival — Rio de Janeiro Backstage", link: "https://www.behance.net/gallery/203612180/Carnival-Rio-Backstage", body: "Access photography behind the scenes of Sambadrome parade preparations.", thumbnailUrl: "https://picsum.photos/seed/beh20/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh20/900/1200", providerName: "Behance Photography" },
  { title: "Monastery Light — Tibet Pilgrims", link: "https://www.behance.net/gallery/183541620/Monastery-Light-Tibet", body: "Documentary with candlelight and incense smoke inside Tibetan monasteries.", thumbnailUrl: "https://picsum.photos/seed/beh21/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh21/900/1200", providerName: "Behance Photography" },
  { title: "Skateboarding — Concrete Poetry", link: "https://www.behance.net/gallery/204720340/Skateboarding-Concrete-Poetry", body: "Action and portrait photography in São Paulo and Buenos Aires skate spots.", thumbnailUrl: "https://picsum.photos/seed/beh22/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh22/900/1200", providerName: "Behance Photography" },
  { title: "Aurora Borealis — Northern Norway", link: "https://www.behance.net/gallery/182491430/Aurora-Borealis-Northern-Norway", body: "Northern lights photography from Tromsø and Senja island.", thumbnailUrl: "https://picsum.photos/seed/beh23/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh23/900/1200", providerName: "Behance Photography" },
  { title: "Fishing Communities — Scottish Highlands", link: "https://www.behance.net/gallery/205831490/Fishing-Communities-Scottish-Highlands", body: "Portrait documentary of traditional fishing towns on the Moray coast.", thumbnailUrl: "https://picsum.photos/seed/beh24/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh24/900/1200", providerName: "Behance Photography" },
  { title: "Reflections — Puddle Photography Series", link: "https://www.behance.net/gallery/181440270/Reflections-Puddle-Photography", body: "Urban reflections after rain — a year-long personal project in Berlin.", thumbnailUrl: "https://picsum.photos/seed/beh25/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh25/900/1200", providerName: "Behance Photography" },
  { title: "Sahara Caravans — Nomadic Portraits", link: "https://www.behance.net/gallery/206940620/Sahara-Caravans-Nomadic-Portraits", body: "Ten days with Tuareg nomads crossing the southern Moroccan desert.", thumbnailUrl: "https://picsum.photos/seed/beh26/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh26/900/1200", providerName: "Behance Photography" },
  { title: "Infrared Landscapes — English Countryside", link: "https://www.behance.net/gallery/180390140/Infrared-Landscapes-English-Countryside", body: "Modified full-spectrum camera with 720nm IR filter over four seasons.", thumbnailUrl: "https://picsum.photos/seed/beh27/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh27/900/1200", providerName: "Behance Photography" },
  { title: "Ballet — Backstage Before Curtain", link: "https://www.behance.net/gallery/208051750/Ballet-Backstage-Before-Curtain", body: "Available-light documentary backstage at the Vienna State Opera.", thumbnailUrl: "https://picsum.photos/seed/beh28/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh28/900/1200", providerName: "Behance Photography" },
  { title: "Vanlife — American Southwest Landscape", link: "https://www.behance.net/gallery/179340010/Vanlife-American-Southwest", body: "Self-portrait and landscape project from a six-month road trip.", thumbnailUrl: "https://picsum.photos/seed/beh29/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh29/900/1200", providerName: "Behance Photography" },
  { title: "Dense Cities — Aerial Night Photography", link: "https://www.behance.net/gallery/209161880/Dense-Cities-Aerial-Night", body: "Helicopter photography over Hong Kong, Cairo, and Mumbai at night.", thumbnailUrl: "https://picsum.photos/seed/beh30/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh30/900/1200", providerName: "Behance Photography" },
  { title: "Tide Pools — Pacific Northwest Biology", link: "https://www.behance.net/gallery/210272990/Tide-Pools-Pacific-Northwest", body: "Macro photography of sea anemones, starfish, and hermit crabs.", thumbnailUrl: "https://picsum.photos/seed/beh31/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh31/900/1200", providerName: "Behance Photography" },
  { title: "Lantern Festival — Pingxi Taiwan", link: "https://www.behance.net/gallery/211384100/Lantern-Festival-Pingxi-Taiwan", body: "Sky lanterns released over mountain valleys during the annual festival.", thumbnailUrl: "https://picsum.photos/seed/beh32/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh32/900/1200", providerName: "Behance Photography" },
  { title: "Oil Rigs — North Sea Documentary", link: "https://www.behance.net/gallery/212495210/Oil-Rigs-North-Sea", body: "Six-week embed on a production platform in the North Sea.", thumbnailUrl: "https://picsum.photos/seed/beh33/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh33/900/1200", providerName: "Behance Photography" },
  { title: "Mountain Marathon — Chamonix UTMB", link: "https://www.behance.net/gallery/213606320/Mountain-Marathon-UTMB", body: "Race photography along the 170km Ultra-Trail du Mont-Blanc route.", thumbnailUrl: "https://picsum.photos/seed/beh34/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh34/900/1200", providerName: "Behance Photography" },
  { title: "Nomadic Mongolia — Steppe Portraits", link: "https://www.behance.net/gallery/214717430/Nomadic-Mongolia-Steppe", body: "Documentary of nomadic families in the Mongolian steppe over two summers.", thumbnailUrl: "https://picsum.photos/seed/beh35/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh35/900/1200", providerName: "Behance Photography" },
  { title: "Jazz Clubs — New York After Midnight", link: "https://www.behance.net/gallery/215828540/Jazz-Clubs-New-York-Midnight", body: "Available-light documentary in West Village jazz rooms.", thumbnailUrl: "https://picsum.photos/seed/beh36/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh36/900/1200", providerName: "Behance Photography" },
  { title: "Cyclades — Greek Island Whitewash", link: "https://www.behance.net/gallery/216939650/Cyclades-Greek-Island-Whitewash", body: "Geometric architecture and deep Aegean blue across Santorini and Naxos.", thumbnailUrl: "https://picsum.photos/seed/beh37/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh37/900/1200", providerName: "Behance Photography" },
  { title: "Volcanoes — Hawaii Lava Flow", link: "https://www.behance.net/gallery/218050760/Volcanoes-Hawaii-Lava-Flow", body: "Active lava entering the ocean on the Big Island's Kalapana coast.", thumbnailUrl: "https://picsum.photos/seed/beh38/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh38/900/1200", providerName: "Behance Photography" },
  { title: "Fashion Week Backstage — Paris SS24", link: "https://www.behance.net/gallery/219161870/Fashion-Week-Backstage-Paris", body: "Backstage access during Paris Spring/Summer 2024 shows.", thumbnailUrl: "https://picsum.photos/seed/beh39/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh39/900/1200", providerName: "Behance Photography" },
  { title: "Children at Play — Ghana Villages", link: "https://www.behance.net/gallery/220272980/Children-Play-Ghana", body: "Documentary of childhood across coastal and inland Ghanaian communities.", thumbnailUrl: "https://picsum.photos/seed/beh40/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh40/900/1200", providerName: "Behance Photography" },
  { title: "Industrial Ports — Container Terminals", link: "https://www.behance.net/gallery/221384090/Industrial-Ports-Container", body: "Graphic abstraction in the geometry of shipping container yards.", thumbnailUrl: "https://picsum.photos/seed/beh41/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh41/900/1200", providerName: "Behance Photography" },
  { title: "Bioluminescence — Maldives Night Sea", link: "https://www.behance.net/gallery/222495200/Bioluminescence-Maldives-Night", body: "Long exposure work capturing plankton glow on a dark Maldivian beach.", thumbnailUrl: "https://picsum.photos/seed/beh42/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh42/900/1200", providerName: "Behance Photography" },
  { title: "Train Journeys — Trans-Siberian", link: "https://www.behance.net/gallery/223606310/Train-Journeys-Trans-Siberian", body: "Seven-day photography across Russia from Moscow to Vladivostok.", thumbnailUrl: "https://picsum.photos/seed/beh43/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh43/900/1200", providerName: "Behance Photography" },
  { title: "Coastal Peru — Nazca Lines Aerial", link: "https://www.behance.net/gallery/224717420/Coastal-Peru-Nazca-Lines", body: "Small aircraft photography over the UNESCO Nazca Lines geoglyphs.", thumbnailUrl: "https://picsum.photos/seed/beh44/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh44/900/1200", providerName: "Behance Photography" },
  { title: "Wetlands — Pantanal Wildlife", link: "https://www.behance.net/gallery/225828530/Wetlands-Pantanal-Wildlife", body: "Wildlife documentary in the world's largest tropical wetland system.", thumbnailUrl: "https://picsum.photos/seed/beh45/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh45/900/1200", providerName: "Behance Photography" },
  { title: "Urban Foxes — London Night Streets", link: "https://www.behance.net/gallery/226939640/Urban-Foxes-London-Night", body: "Year-long urban wildlife project tracking fox families in South London.", thumbnailUrl: "https://picsum.photos/seed/beh46/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh46/900/1200", providerName: "Behance Photography" },
  { title: "Salt Works — Maras Peru", link: "https://www.behance.net/gallery/228050750/Salt-Works-Maras-Peru", body: "Ancient Inca salt pans still worked by hand in the Sacred Valley.", thumbnailUrl: "https://picsum.photos/seed/beh47/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh47/900/1200", providerName: "Behance Photography" },
  { title: "Storm Chasing — Oklahoma Tornado Season", link: "https://www.behance.net/gallery/229161860/Storm-Chasing-Oklahoma", body: "Two months following supercell thunderstorms across Tornado Alley.", thumbnailUrl: "https://picsum.photos/seed/beh48/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh48/900/1200", providerName: "Behance Photography" },
  { title: "Coffee Harvest — Ethiopian Highlands", link: "https://www.behance.net/gallery/230272970/Coffee-Harvest-Ethiopian-Highlands", body: "Documentary of small-holder coffee farmers in Yirgacheffe and Sidama.", thumbnailUrl: "https://picsum.photos/seed/beh49/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh49/900/1200", providerName: "Behance Photography" },
  { title: "Shipbreaking — Alang India", link: "https://www.behance.net/gallery/231384080/Shipbreaking-Alang-India", body: "Documentary access to the world's largest ship-breaking yard.", thumbnailUrl: "https://picsum.photos/seed/beh50/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh50/900/1200", providerName: "Behance Photography" },
  { title: "Geisha District — Gion Kyoto", link: "https://www.behance.net/gallery/234717410/Geisha-District-Gion-Kyoto", body: "Evening documentary in the preserved machiya townhouses of Gion.", thumbnailUrl: "https://picsum.photos/seed/beh53/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh53/900/1200", providerName: "Behance Photography" },
  { title: "Coral Reefs — Great Barrier Bleaching", link: "https://www.behance.net/gallery/236939630/Coral-Reefs-Great-Barrier", body: "Underwater climate documentation of bleaching events in Queensland.", thumbnailUrl: "https://picsum.photos/seed/beh55/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh55/900/1200", providerName: "Behance Photography" },
  { title: "Bamboo Forests — Arashiyama Dawn", link: "https://www.behance.net/gallery/240272960/Bamboo-Forests-Arashiyama-Dawn", body: "Pre-tourist dawn photography in the famous Arashiyama bamboo grove.", thumbnailUrl: "https://picsum.photos/seed/beh58/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh58/900/1200", providerName: "Behance Photography" },
  { title: "Paddy Fields — Bali Tegallalang", link: "https://www.behance.net/gallery/242495180/Paddy-Fields-Bali-Tegallalang", body: "Subak irrigation system rice terraces at first light.", thumbnailUrl: "https://picsum.photos/seed/beh60/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh60/900/1200", providerName: "Behance Photography" },
];

const PINTEREST_POSTS: PostSeed[] = [
  { title: "Golden Hour — Coastal Cliffs Portugal", link: "https://www.pinterest.com/pin/916904805393143374/", body: "Warm afternoon light on the Algarve sea stacks.", thumbnailUrl: "https://picsum.photos/seed/pin01/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin01/736/1100", providerName: "Pinterest" },
  { title: "Film Photography — Contax G2 Street", link: "https://www.pinterest.com/pin/916904805393220481/", body: "Street photography on Kodak Portra 400 in downtown Chicago.", thumbnailUrl: "https://picsum.photos/seed/pin02/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin02/736/980", providerName: "Pinterest" },
  { title: "Minimal Interiors — Japandi Style", link: "https://www.pinterest.com/pin/916904805393301568/", body: "White walls, raw wood, and a single houseplant doing all the work.", thumbnailUrl: "https://picsum.photos/seed/pin03/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin03/736/1050", providerName: "Pinterest" },
  { title: "Black & White Forest After Rain", link: "https://www.pinterest.com/pin/916904805393382655/", body: "B&W conversion of a rainy old-growth forest in the Pacific Northwest.", thumbnailUrl: "https://picsum.photos/seed/pin04/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin04/736/920", providerName: "Pinterest" },
  { title: "Street Cats — Istanbul Medina", link: "https://www.pinterest.com/pin/916904805393463742/", body: "Documentary of Istanbul's famous street cat culture.", thumbnailUrl: "https://picsum.photos/seed/pin05/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin05/736/1100", providerName: "Pinterest" },
  { title: "Moody Portraits — Low-Key Lighting", link: "https://www.pinterest.com/pin/916904805393544829/", body: "Single light source portraiture with deep shadow contrast.", thumbnailUrl: "https://picsum.photos/seed/pin06/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin06/736/980", providerName: "Pinterest" },
  { title: "Snowy Mountain Pass — Swiss Alps", link: "https://www.pinterest.com/pin/916904805393625916/", body: "Winter crossing of the Bernina Pass in near-whiteout conditions.", thumbnailUrl: "https://picsum.photos/seed/pin07/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin07/736/920", providerName: "Pinterest" },
  { title: "Old Books Still Life — Editorial Props", link: "https://www.pinterest.com/pin/916904805393707003/", body: "Styled product and prop photography for editorial use.", thumbnailUrl: "https://picsum.photos/seed/pin08/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin08/736/1050", providerName: "Pinterest" },
  { title: "Rainy Day Bokeh — Tokyo Side Streets", link: "https://www.pinterest.com/pin/916904805393788090/", body: "f/1.4 rain bokeh from a quiet Tokyo laneway at night.", thumbnailUrl: "https://picsum.photos/seed/pin09/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin09/736/1100", providerName: "Pinterest" },
  { title: "Red Rock Canyons — Utah Drone", link: "https://www.pinterest.com/pin/916904805393869177/", body: "Aerial survey of Bryce Canyon formations at sunrise.", thumbnailUrl: "https://picsum.photos/seed/pin10/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin10/736/980", providerName: "Pinterest" },
  { title: "Coffee Bar Aesthetic — Specialty Third Wave", link: "https://www.pinterest.com/pin/916904805393950264/", body: "Interior and pour photography from a speciality café in Melbourne.", thumbnailUrl: "https://picsum.photos/seed/pin11/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin11/736/920", providerName: "Pinterest" },
  { title: "Abandoned Lighthouse — Baltic Coast", link: "https://www.pinterest.com/pin/916904805394031351/", body: "Decommissioned lighthouse on the Estonian coast at blue hour.", thumbnailUrl: "https://picsum.photos/seed/pin12/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin12/736/1100", providerName: "Pinterest" },
  { title: "Candid Family — Documentary Style", link: "https://www.pinterest.com/pin/916904805394112438/", body: "Unposed family portraiture in natural home environments.", thumbnailUrl: "https://picsum.photos/seed/pin13/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin13/736/1050", providerName: "Pinterest" },
  { title: "Neon Signs — Hong Kong at Night", link: "https://www.pinterest.com/pin/916904805394193525/", body: "Vertical neon signage in Mong Kok and Kowloon before demolition.", thumbnailUrl: "https://picsum.photos/seed/pin14/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin14/736/920", providerName: "Pinterest" },
  { title: "Sand Dunes — Sossusvlei Namibia", link: "https://www.pinterest.com/pin/916904805394274612/", body: "Dead Vlei pan with ancient camel thorn trees and orange dunes.", thumbnailUrl: "https://picsum.photos/seed/pin15/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin15/736/1100", providerName: "Pinterest" },
  { title: "Fashion Week — Front Row Candid", link: "https://www.pinterest.com/pin/916904805394355699/", body: "Street style and front-row candids from Milan Fashion Week.", thumbnailUrl: "https://picsum.photos/seed/pin16/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin16/736/980", providerName: "Pinterest" },
  { title: "Jungle Canopy — Borneo Rainforest", link: "https://www.pinterest.com/pin/916904805394436786/", body: "Looking up through 60-metre tropical canopy in Sabah.", thumbnailUrl: "https://picsum.photos/seed/pin17/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin17/736/1050", providerName: "Pinterest" },
  { title: "Vintage Motorcycles — Workshop Still Life", link: "https://www.pinterest.com/pin/916904805394517873/", body: "Dramatic sidelit workshop photography of mid-century motorcycle restoration.", thumbnailUrl: "https://picsum.photos/seed/pin18/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin18/736/920", providerName: "Pinterest" },
  { title: "Sunrise Swimmer — Open Water", link: "https://www.pinterest.com/pin/916904805394598960/", body: "Cold-water swimming documentary at dawn on the Cornish coast.", thumbnailUrl: "https://picsum.photos/seed/pin19/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin19/736/1100", providerName: "Pinterest" },
  { title: "Wabi-Sabi — Imperfect Ceramics", link: "https://www.pinterest.com/pin/916904805394761134/", body: "Product photography embracing cracks, chips, and imperfect glaze.", thumbnailUrl: "https://picsum.photos/seed/pin21/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin21/736/1050", providerName: "Pinterest" },
  { title: "Cherry Blossoms — Kyoto Maruyama Park", link: "https://www.pinterest.com/pin/916904805394842221/", body: "One week of dawn shoots under Kyoto's famous weeping cherry.", thumbnailUrl: "https://picsum.photos/seed/pin22/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin22/736/920", providerName: "Pinterest" },
  { title: "Rock Climbing — Yosemite Big Wall", link: "https://www.pinterest.com/pin/916904805394923308/", body: "Vertical expedition photography on El Capitan.", thumbnailUrl: "https://picsum.photos/seed/pin23/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin23/736/1100", providerName: "Pinterest" },
  { title: "Desert Bloom — Atacama Wildflowers", link: "https://www.pinterest.com/pin/916904805395085482/", body: "The rare superbloom event in the driest desert on Earth.", thumbnailUrl: "https://picsum.photos/seed/pin25/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin25/736/1050", providerName: "Pinterest" },
  { title: "Surf Photography — Pipeline Hawaii", link: "https://www.pinterest.com/pin/916904805395166569/", body: "In-water tube photography at Banzai Pipeline.", thumbnailUrl: "https://picsum.photos/seed/pin26/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin26/736/920", providerName: "Pinterest" },
  { title: "Autumn Leaves — Kyoto Temples", link: "https://www.pinterest.com/pin/916904805395247656/", body: "Maple (momiji) season photography in Arashiyama and Tofukuji.", thumbnailUrl: "https://picsum.photos/seed/pin27/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin27/736/1100", providerName: "Pinterest" },
  { title: "Food Photography — Ramen Close-Up", link: "https://www.pinterest.com/pin/916904805395328743/", body: "Steaming tonkotsu ramen overhead editorial in Fukuoka.", thumbnailUrl: "https://picsum.photos/seed/pin28/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin28/736/980", providerName: "Pinterest" },
  { title: "Wild Horses — Camargue France", link: "https://www.pinterest.com/pin/916904805396058526/", body: "Free-roaming white horses in the Rhône delta wetlands.", thumbnailUrl: "https://picsum.photos/seed/pin37/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin37/736/1050", providerName: "Pinterest" },
  { title: "Skate Parks — Empty at Dusk", link: "https://www.pinterest.com/pin/916904805396220700/", body: "Architectural photography of abandoned skate parks at golden hour.", thumbnailUrl: "https://picsum.photos/seed/pin39/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin39/736/1100", providerName: "Pinterest" },
  { title: "Midnight Sun — Finnish Lapland", link: "https://www.pinterest.com/pin/916904805396707222/", body: "24-hour daylight landscape photography in midsummer Finland.", thumbnailUrl: "https://picsum.photos/seed/pin45/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin45/736/1050", providerName: "Pinterest" },
  { title: "Stormy Seas — Faroe Islands", link: "https://www.pinterest.com/pin/916904805397355918/", body: "Long exposure seascapes of Atlantic swells crashing at Sørvágsvatn.", thumbnailUrl: "https://picsum.photos/seed/pin53/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin53/736/1050", providerName: "Pinterest" },
  { title: "Misty Rainforest — Olympic Peninsula WA", link: "https://www.pinterest.com/pin/916904805397923527/", body: "Temperate rainforest photography in the Hoh Rain Forest, Washington State.", thumbnailUrl: "https://picsum.photos/seed/pin60/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin60/736/980", providerName: "Pinterest" },
];

const DRIBBBLE_POSTS: PostSeed[] = [
  { title: "Dashboard UI — Dark Mode Analytics", link: "https://dribbble.com/shots/24101011-Dashboard-UI-Dark-Mode-Analytics", body: "Data visualization dashboard with chart components and sidebar navigation.", thumbnailUrl: "https://picsum.photos/seed/dri01/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri01/400/300", providerName: "Dribbble" },
  { title: "Mobile Banking App — Transaction Flow", link: "https://dribbble.com/shots/24102022-Mobile-Banking-Transaction-Flow", body: "iOS banking app with transfer, pay, and budgeting screens.", thumbnailUrl: "https://picsum.photos/seed/dri02/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri02/400/300", providerName: "Dribbble" },
  { title: "Brand Identity — Coffee Roaster", link: "https://dribbble.com/shots/24103033-Brand-Identity-Coffee-Roaster", body: "Minimal wordmark and packaging system for a specialty coffee brand.", thumbnailUrl: "https://picsum.photos/seed/dri03/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri03/400/300", providerName: "Dribbble" },
  { title: "Landing Page — SaaS Productivity Tool", link: "https://dribbble.com/shots/24104044-Landing-Page-SaaS-Productivity", body: "Marketing landing page with hero section, feature grid, and pricing.", thumbnailUrl: "https://picsum.photos/seed/dri04/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri04/400/300", providerName: "Dribbble" },
  { title: "Icon Set — Finance and Banking", link: "https://dribbble.com/shots/24105055-Icon-Set-Finance-Banking", body: "60-piece icon set for fintech applications, available in 3 weights.", thumbnailUrl: "https://picsum.photos/seed/dri05/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri05/400/300", providerName: "Dribbble" },
  { title: "E-commerce Product Page — Minimal", link: "https://dribbble.com/shots/24106066-Ecommerce-Product-Page-Minimal", body: "Clean product detail page with image carousel and add-to-cart flow.", thumbnailUrl: "https://picsum.photos/seed/dri06/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri06/400/300", providerName: "Dribbble" },
  { title: "App Onboarding — Meditation Platform", link: "https://dribbble.com/shots/24107077-App-Onboarding-Meditation", body: "Three-step onboarding flow with illustration and progress indicator.", thumbnailUrl: "https://picsum.photos/seed/dri07/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri07/400/300", providerName: "Dribbble" },
  { title: "Typography Poster — Bauhaus Grid", link: "https://dribbble.com/shots/24108088-Typography-Poster-Bauhaus", body: "Experimental type layout inspired by Bauhaus grid systems.", thumbnailUrl: "https://picsum.photos/seed/dri08/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri08/400/300", providerName: "Dribbble" },
  { title: "Maps UI — Delivery Tracking", link: "https://dribbble.com/shots/24109099-Maps-UI-Delivery-Tracking", body: "Real-time delivery tracking map with status cards and ETA countdown.", thumbnailUrl: "https://picsum.photos/seed/dri09/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri09/400/300", providerName: "Dribbble" },
  { title: "Illustration — Abstract Landscape", link: "https://dribbble.com/shots/24110100-Illustration-Abstract-Landscape", body: "Geometric landscape illustration with layered shapes and gradient fills.", thumbnailUrl: "https://picsum.photos/seed/dri10/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri10/400/300", providerName: "Dribbble" },
  { title: "Design System — Component Library", link: "https://dribbble.com/shots/24111111-Design-System-Component-Library", body: "Atomic design system with button states, form fields, and data display.", thumbnailUrl: "https://picsum.photos/seed/dri11/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri11/400/300", providerName: "Dribbble" },
  { title: "Calendar App — Week View", link: "https://dribbble.com/shots/24112122-Calendar-App-Week-View", body: "Weekly calendar with event chips, conflict detection, and drag-to-reschedule.", thumbnailUrl: "https://picsum.photos/seed/dri12/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri12/400/300", providerName: "Dribbble" },
  { title: "Packaging — Minimal Skincare", link: "https://dribbble.com/shots/24113133-Packaging-Minimal-Skincare", body: "Glass bottle packaging with embossed logotype and paper wrap.", thumbnailUrl: "https://picsum.photos/seed/dri13/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri13/400/300", providerName: "Dribbble" },
  { title: "Social App — Story Feature", link: "https://dribbble.com/shots/24114144-Social-App-Story-Feature", body: "Ephemeral story interface with reaction bar and viewer count.", thumbnailUrl: "https://picsum.photos/seed/dri14/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri14/400/300", providerName: "Dribbble" },
  { title: "Motion Design — Logo Animation", link: "https://dribbble.com/shots/24115155-Motion-Design-Logo-Animation", body: "Morph and reveal animation for a geometric logomark.", thumbnailUrl: "https://picsum.photos/seed/dri15/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri15/400/300", providerName: "Dribbble" },
  { title: "Travel App — Itinerary Builder", link: "https://dribbble.com/shots/24116166-Travel-App-Itinerary-Builder", body: "Drag-and-drop trip planner with map integration and activity cards.", thumbnailUrl: "https://picsum.photos/seed/dri16/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri16/400/300", providerName: "Dribbble" },
  { title: "3D Render — Abstract Blob Form", link: "https://dribbble.com/shots/24117177-3D-Render-Abstract-Blob", body: "Organic blob geometry with subsurface scattering and studio lighting.", thumbnailUrl: "https://picsum.photos/seed/dri17/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri17/400/300", providerName: "Dribbble" },
  { title: "Music Player — Waveform Interface", link: "https://dribbble.com/shots/24118188-Music-Player-Waveform", body: "Audio player with waveform scrubber, lyrics view, and queue panel.", thumbnailUrl: "https://picsum.photos/seed/dri18/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri18/400/300", providerName: "Dribbble" },
  { title: "Fitness App — Progress Tracking", link: "https://dribbble.com/shots/24120200-Fitness-App-Progress-Tracking", body: "Workout log with streak calendar, personal records, and chart views.", thumbnailUrl: "https://picsum.photos/seed/dri20/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri20/400/300", providerName: "Dribbble" },
  { title: "Chat Interface — AI Assistant", link: "https://dribbble.com/shots/24121211-Chat-Interface-AI-Assistant", body: "Conversational UI with streaming text, code blocks, and quick replies.", thumbnailUrl: "https://picsum.photos/seed/dri21/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri21/400/300", providerName: "Dribbble" },
  { title: "AR Interface — Navigation Overlay", link: "https://dribbble.com/shots/24123233-AR-Interface-Navigation", body: "Augmented reality walking navigation with floating waypoints.", thumbnailUrl: "https://picsum.photos/seed/dri23/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri23/400/300", providerName: "Dribbble" },
  { title: "Food App — Restaurant Discovery", link: "https://dribbble.com/shots/24124244-Food-App-Restaurant-Discovery", body: "Geolocation-based restaurant cards with filter chips and rating display.", thumbnailUrl: "https://picsum.photos/seed/dri24/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri24/400/300", providerName: "Dribbble" },
  { title: "Watch Face — Minimal Sport", link: "https://dribbble.com/shots/24126266-Watch-Face-Minimal-Sport", body: "Apple Watch face with always-on heart rate ring and complication slots.", thumbnailUrl: "https://picsum.photos/seed/dri26/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri26/400/300", providerName: "Dribbble" },
  { title: "Poster Series — Jazz Festival", link: "https://dribbble.com/shots/24127277-Poster-Series-Jazz-Festival", body: "Set of three A2 posters with risograph-style illustration and hand lettering.", thumbnailUrl: "https://picsum.photos/seed/dri27/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri27/400/300", providerName: "Dribbble" },
  { title: "Token System — Spacing and Color", link: "https://dribbble.com/shots/24128288-Token-System-Spacing-Color", body: "Design token documentation with semantic naming and Figma variables.", thumbnailUrl: "https://picsum.photos/seed/dri28/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri28/400/300", providerName: "Dribbble" },
  { title: "Checkout Flow — Mobile Commerce", link: "https://dribbble.com/shots/24129299-Checkout-Flow-Mobile-Commerce", body: "Three-step checkout with address autofill and Apple Pay integration.", thumbnailUrl: "https://picsum.photos/seed/dri29/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri29/400/300", providerName: "Dribbble" },
  { title: "Dark Mode — Code Editor Theme", link: "https://dribbble.com/shots/24140400-Dark-Mode-Code-Editor-Theme", body: "Syntax highlighting theme with carefully tuned contrast ratios.", thumbnailUrl: "https://picsum.photos/seed/dri40/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri40/400/300", providerName: "Dribbble" },
  { title: "Job Board — Filter and Search", link: "https://dribbble.com/shots/24141411-Job-Board-Filter-Search", body: "Faceted job search with role, salary, remote toggle, and company size.", thumbnailUrl: "https://picsum.photos/seed/dri41/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri41/400/300", providerName: "Dribbble" },
  { title: "Form Design — Multi-step Wizard", link: "https://dribbble.com/shots/24144444-Form-Design-Multistep-Wizard", body: "Insurance application form with progress stepper and validation states.", thumbnailUrl: "https://picsum.photos/seed/dri44/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri44/400/300", providerName: "Dribbble" },
  { title: "Video Platform — Creator Studio", link: "https://dribbble.com/shots/24145455-Video-Platform-Creator-Studio", body: "Analytics, upload, and monetization dashboard for video creators.", thumbnailUrl: "https://picsum.photos/seed/dri45/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri45/400/300", providerName: "Dribbble" },
  { title: "Prototype — Swipe Card Stack", link: "https://dribbble.com/shots/24150500-Prototype-Swipe-Card-Stack", body: "Tinder-style swipe deck with spring physics and decision gesture.", thumbnailUrl: "https://picsum.photos/seed/dri50/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri50/400/300", providerName: "Dribbble" },
  { title: "Error States — 404 Illustration", link: "https://dribbble.com/shots/24154544-Error-States-404-Illustration", body: "Playful 404 and 500 illustration set with reconnect flow.", thumbnailUrl: "https://picsum.photos/seed/dri54/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri54/400/300", providerName: "Dribbble" },
  { title: "Illustration — Isometric City", link: "https://dribbble.com/shots/24156566-Illustration-Isometric-City", body: "Detailed isometric city block with animated traffic and ambient loop.", thumbnailUrl: "https://picsum.photos/seed/dri56/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri56/400/300", providerName: "Dribbble" },
  { title: "Voice UI — Listening State", link: "https://dribbble.com/shots/24157577-Voice-UI-Listening-State", body: "Waveform animation for voice assistant active and processing states.", thumbnailUrl: "https://picsum.photos/seed/dri57/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri57/400/300", providerName: "Dribbble" },
  { title: "Brand — Typeface Pairing Guide", link: "https://dribbble.com/shots/24160600-Brand-Typeface-Pairing-Guide", body: "Display and body font pairing showcase with usage examples across media.", thumbnailUrl: "https://picsum.photos/seed/dri60/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri60/400/300", providerName: "Dribbble" },
];

const UNSPLASH_POSTS: PostSeed[] = [
  { title: "Misty Mountain Morning — Pacific Crest", link: "https://unsplash.com/photos/misty-mountain-morning-pacific-crest-aA0uHHEzGaI", body: "Blue-hour mist rolling through pine ridges on the PCT.", thumbnailUrl: "https://picsum.photos/seed/uns01/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns01/1080/720", providerName: "Unsplash" },
  { title: "Concrete Staircase — Minimalist Architecture", link: "https://unsplash.com/photos/concrete-staircase-minimalist-bB5OGCZWiLM", body: "Helical concrete stair with a single shaft of natural light.", thumbnailUrl: "https://picsum.photos/seed/uns02/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns02/1080/720", providerName: "Unsplash" },
  { title: "Ocean at Dusk — Long Exposure Waves", link: "https://unsplash.com/photos/ocean-at-dusk-long-exposure-cTWoKkIcxJA", body: "Silky water effect at 2s exposure on a rocky Atlantic coast.", thumbnailUrl: "https://picsum.photos/seed/uns03/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns03/1080/720", providerName: "Unsplash" },
  { title: "Street Market — Fresh Produce Colors", link: "https://unsplash.com/photos/street-market-fresh-produce-pDEKwKs9RNM", body: "Overhead flat lay of vegetable stalls in a Catalan market.", thumbnailUrl: "https://picsum.photos/seed/uns04/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns04/1080/720", providerName: "Unsplash" },
  { title: "Forest Path — Autumn Light Filter", link: "https://unsplash.com/photos/forest-path-autumn-light-XDi5Pah8rjQ", body: "Dappled afternoon light through turning leaves on a narrow trail.", thumbnailUrl: "https://picsum.photos/seed/uns05/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns05/1080/720", providerName: "Unsplash" },
  { title: "Rooftop Pool — Dubai Skyline", link: "https://unsplash.com/photos/rooftop-pool-dubai-skyline-bvS7DUnoPA4", body: "Infinity edge pool reflecting city towers at blue hour.", thumbnailUrl: "https://picsum.photos/seed/uns06/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns06/1080/720", providerName: "Unsplash" },
  { title: "Weathered Wood — Texture Study", link: "https://unsplash.com/photos/weathered-wood-texture-study-LKAMlMaTa6I", body: "Close-up macro of grain and weathering in reclaimed timber.", thumbnailUrl: "https://picsum.photos/seed/uns07/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns07/1080/720", providerName: "Unsplash" },
  { title: "City at Night — Rain Reflections", link: "https://unsplash.com/photos/city-at-night-rain-reflections-EiF5_QnDbbI", body: "Neon reflections on wet asphalt in a rainy city intersection.", thumbnailUrl: "https://picsum.photos/seed/uns09/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns09/1080/720", providerName: "Unsplash" },
  { title: "Desert Sunrise — Sahara Sand Ripples", link: "https://unsplash.com/photos/desert-sunrise-sahara-sand-ripples-K4Zr8bMLMOo", body: "Raking light on wind-formed dune ripples at Erg Chebbi.", thumbnailUrl: "https://picsum.photos/seed/uns11/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns11/1080/720", providerName: "Unsplash" },
  { title: "Library Interior — Reading Room", link: "https://unsplash.com/photos/library-interior-reading-room-s9CC2SKySJM", body: "High-ceilinged reading room with natural light and dark oak stacks.", thumbnailUrl: "https://picsum.photos/seed/uns12/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns12/1080/720", providerName: "Unsplash" },
  { title: "Snowy Cabin — Nordic Wilderness", link: "https://unsplash.com/photos/snowy-cabin-nordic-wilderness-h7R5xNkmgN8", body: "Smoke rising from a red cabin amid a white birch forest.", thumbnailUrl: "https://picsum.photos/seed/uns13/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns13/1080/720", providerName: "Unsplash" },
  { title: "Birds Eye — Aerial Rice Terraces", link: "https://unsplash.com/photos/birds-eye-aerial-rice-terraces-8fSH5Hs9EHM", body: "Geometric green terrace steps carved into a Philippine mountainside.", thumbnailUrl: "https://picsum.photos/seed/uns15/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns15/1080/720", providerName: "Unsplash" },
  { title: "Coffee Close-Up — Espresso Pour", link: "https://unsplash.com/photos/coffee-close-up-espresso-pour-jNhwNMSBpOE", body: "Macro extraction of a naked portafilter shot under controlled light.", thumbnailUrl: "https://picsum.photos/seed/uns16/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns16/1080/720", providerName: "Unsplash" },
  { title: "Street Art — Berlin Wall Fragments", link: "https://unsplash.com/photos/street-art-berlin-wall-fragments-r2ohCFfX65M", body: "Layered spray paint and wheat paste on East Side Gallery remnants.", thumbnailUrl: "https://picsum.photos/seed/uns17/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns17/1080/720", providerName: "Unsplash" },
  { title: "Hot Air Balloon — Cappadocia Dawn", link: "https://unsplash.com/photos/hot-air-balloon-cappadocia-dawn-BO73XMr5CsU", body: "Dozen balloons rising over fairy chimney rock formations at first light.", thumbnailUrl: "https://picsum.photos/seed/uns30/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns30/1080/720", providerName: "Unsplash" },
  { title: "Minimalist Still Life — Ceramics", link: "https://unsplash.com/photos/minimalist-still-life-ceramics-vUNQaTtZrOY", body: "Warm grey ceramics on linen against a matte white wall.", thumbnailUrl: "https://picsum.photos/seed/uns32/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns32/1080/720", providerName: "Unsplash" },
  { title: "Iceland Black Sand Beach — Reynisfjara", link: "https://unsplash.com/photos/iceland-black-sand-beach-reynisfjara-kCrrUx7US04", body: "Basalt columns and black sand with dramatic Atlantic surf.", thumbnailUrl: "https://picsum.photos/seed/uns35/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns35/1080/720", providerName: "Unsplash" },
  { title: "Lavender Field — Provençal Purple", link: "https://unsplash.com/photos/lavender-field-provencal-purple-mEZ3PoFGs_k", body: "Peak bloom lavender rows at the Plateau de Valensole at sunrise.", thumbnailUrl: "https://picsum.photos/seed/uns36/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns36/1080/720", providerName: "Unsplash" },
  { title: "Tea Ceremony — Japanese Tatami", link: "https://unsplash.com/photos/tea-ceremony-japanese-tatami-OIoNa3M0lvo", body: "Traditional chado ceremony with powdered matcha and bamboo whisk.", thumbnailUrl: "https://picsum.photos/seed/uns38/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns38/1080/720", providerName: "Unsplash" },
  { title: "Venice Canal — Gondola Reflection", link: "https://unsplash.com/photos/venice-canal-gondola-reflection-Wpnoqo55b4k", body: "Palazzo reflection in still canal water with a moored gondola.", thumbnailUrl: "https://picsum.photos/seed/uns45/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns45/1080/720", providerName: "Unsplash" },
  { title: "Night Hike — Milky Way Ridge", link: "https://unsplash.com/photos/night-hike-milky-way-ridge-EEBSj7mO2MI", body: "Hiker silhouette on a volcanic ridge with Milky Way above.", thumbnailUrl: "https://picsum.photos/seed/uns46/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns46/1080/720", providerName: "Unsplash" },
  { title: "Stone Arch — Arches National Park", link: "https://unsplash.com/photos/stone-arch-arches-national-park-pHANr-CpbYM", body: "Delicate Arch at sunset with the La Sal Mountains behind.", thumbnailUrl: "https://picsum.photos/seed/uns51/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns51/1080/720", providerName: "Unsplash" },
  { title: "Gorge — Antelope Canyon Light Beams", link: "https://unsplash.com/photos/gorge-antelope-canyon-light-beams-ToFm1D0jmEs", body: "Shafts of light illuminating the rust-red sandstone walls of Lower Antelope.", thumbnailUrl: "https://picsum.photos/seed/uns53/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns53/1080/720", providerName: "Unsplash" },
  { title: "Cobalt Sky — Santorini Blue Dome", link: "https://unsplash.com/photos/cobalt-sky-santorini-blue-dome-HQLFKhNN76A", body: "Iconic blue-domed church against the Aegean at Oia.", thumbnailUrl: "https://picsum.photos/seed/uns56/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns56/1080/720", providerName: "Unsplash" },
  { title: "Wheat Field — Stormy Sky", link: "https://unsplash.com/photos/wheat-field-stormy-sky-BHd56RZBv8U", body: "Ripe wheat bending in wind under an approaching cumulonimbus.", thumbnailUrl: "https://picsum.photos/seed/uns57/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns57/1080/720", providerName: "Unsplash" },
  { title: "Observatory — Stargazing Telescope", link: "https://unsplash.com/photos/observatory-stargazing-telescope-J28ic7vBFSc", body: "Open dome observatory with telescope silhouetted against the Milky Way.", thumbnailUrl: "https://picsum.photos/seed/uns60/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns60/1080/720", providerName: "Unsplash" },
];

// Medium-style article posts
const MEDIUM_POSTS: PostSeed[] = [
  { title: "The Craft of Negative Space in Typography", link: "https://medium.com/design/the-craft-of-negative-space-in-typography-a1b2c3d4e5f6", body: "How the spaces between letters define character and hierarchy more than the letterforms themselves.", thumbnailUrl: "https://picsum.photos/seed/med01/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med01/1200/630", providerName: "Medium" },
  { title: "Designing for Emotional Resonance", link: "https://medium.com/ux-design/designing-for-emotional-resonance-b2c3d4e5f6a1", body: "The psychological principles behind interfaces that feel human rather than transactional.", thumbnailUrl: "https://picsum.photos/seed/med02/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med02/1200/630", providerName: "Medium" },
  { title: "Grid Systems Are Not Constraints, They Are Freedom", link: "https://medium.com/design/grid-systems-are-not-constraints-c3d4e5f6a1b2", body: "Why the most expressive editorial design still begins with a rigorous modular grid.", thumbnailUrl: "https://picsum.photos/seed/med03/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med03/1200/630", providerName: "Medium" },
  { title: "Color Theory for the Colorblind Designer", link: "https://medium.com/accessibility/color-theory-for-the-colorblind-designer-d4e5f6a1b2c3", body: "Accessible palette construction using contrast ratios and perceptual luminance as the primary tools.", thumbnailUrl: "https://picsum.photos/seed/med04/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med04/1200/630", providerName: "Medium" },
  { title: "The Return of Brutalism in Digital Design", link: "https://medium.com/design-culture/the-return-of-brutalism-e5f6a1b2c3d4", body: "Raw, anti-polish aesthetics are having a moment — tracing the arc from Swiss style reaction to web brutalism.", thumbnailUrl: "https://picsum.photos/seed/med05/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med05/1200/630", providerName: "Medium" },
  { title: "Motion as Information: When Animation Earns Its Keep", link: "https://medium.com/motion/motion-as-information-f6a1b2c3d4e5", body: "A framework for deciding which transitions communicate meaning versus which ones just look impressive.", thumbnailUrl: "https://picsum.photos/seed/med06/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med06/1200/630", providerName: "Medium" },
  { title: "How Swiss International Style Still Shapes Your Apps", link: "https://medium.com/design-history/swiss-international-style-apps-a1b2c3d4e5f7", body: "From Müller-Brockmann to iOS — the direct lineage of functional modernism in interface design.", thumbnailUrl: "https://picsum.photos/seed/med07/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med07/1200/630", providerName: "Medium" },
  { title: "Design Tokens: The Real Reason Your Design System Breaks", link: "https://medium.com/design-systems/design-tokens-b2c3d4e5f6a2", body: "How misaligned token semantics cause inconsistency even when everyone follows the rules.", thumbnailUrl: "https://picsum.photos/seed/med08/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med08/1200/630", providerName: "Medium" },
  { title: "The Invisible Hand of Default Fonts", link: "https://medium.com/typography/the-invisible-hand-of-default-fonts-c3d4e5f6a1b3", body: "Why Times New Roman, Helvetica, and Georgia persist — and what it costs us to ignore them.", thumbnailUrl: "https://picsum.photos/seed/med09/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med09/1200/630", providerName: "Medium" },
  { title: "Analog Photography in a Post-Filter World", link: "https://medium.com/photography/analog-photography-post-filter-world-d4e5f6a1b2c4", body: "What drives photographers back to film when algorithms can simulate its look instantly.", thumbnailUrl: "https://picsum.photos/seed/med10/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med10/1200/630", providerName: "Medium" },
  { title: "Cultural Semiotics in Brand Identity", link: "https://medium.com/branding/cultural-semiotics-brand-identity-e5f6a1b2c3d5", body: "How symbols carry cultural weight that crosses — and sometimes contradicts — brand intent.", thumbnailUrl: "https://picsum.photos/seed/med11/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med11/1200/630", providerName: "Medium" },
  { title: "The Architecture of White Space", link: "https://medium.com/spatial-design/the-architecture-of-white-space-f6a1b2c3d4e6", body: "How publication designers and architects use void as the primary structural element.", thumbnailUrl: "https://picsum.photos/seed/med12/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med12/1200/630", providerName: "Medium" },
  { title: "AI-Generated Imagery and the Authorship Question", link: "https://medium.com/ai-art/ai-generated-imagery-authorship-a1b2c3d4e5f8", body: "When a prompt is the creative act, what does it mean to be a photographer or illustrator?", thumbnailUrl: "https://picsum.photos/seed/med13/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med13/1200/630", providerName: "Medium" },
  { title: "Wayfinding as Urban Experience Design", link: "https://medium.com/urban-design/wayfinding-urban-experience-b2c3d4e5f6a3", body: "Lessons from New York, London, and Tokyo's signage systems for screen-based navigation.", thumbnailUrl: "https://picsum.photos/seed/med14/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med14/1200/630", providerName: "Medium" },
  { title: "The Decluttering of Dashboard Design", link: "https://medium.com/data-viz/the-decluttering-of-dashboard-design-c3d4e5f6a1b4", body: "Why the best data dashboards show less and communicate more — and how to get there.", thumbnailUrl: "https://picsum.photos/seed/med15/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med15/1200/630", providerName: "Medium" },
  { title: "Fashion Photography's Debt to Architecture", link: "https://medium.com/fashion/fashion-photography-debt-to-architecture-d4e5f6a1b2c5", body: "How Richard Avedon, Helmut Newton, and later designers used built space as co-subject.", thumbnailUrl: "https://picsum.photos/seed/med16/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med16/1200/630", providerName: "Medium" },
  { title: "Pattern Languages in Interaction Design", link: "https://medium.com/ux/pattern-languages-interaction-design-e5f6a1b2c3d6", body: "Christopher Alexander's 1977 framework remains the most honest theory of design we have.", thumbnailUrl: "https://picsum.photos/seed/med17/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med17/1200/630", providerName: "Medium" },
  { title: "Illustration in the Age of Stock Libraries", link: "https://medium.com/illustration/illustration-age-of-stock-libraries-f6a1b2c3d4e7", body: "Why original illustration still commands a premium and how to justify it to non-designers.", thumbnailUrl: "https://picsum.photos/seed/med18/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med18/1200/630", providerName: "Medium" },
  { title: "The Comeback of Tactile Packaging", link: "https://medium.com/packaging/the-comeback-of-tactile-packaging-a1b2c3d4e5f9", body: "Embossing, soft-touch laminate, and paper grain as sensory differentiators in a digital economy.", thumbnailUrl: "https://picsum.photos/seed/med19/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med19/1200/630", providerName: "Medium" },
  { title: "Why Editorial Design Is Having a Renaissance", link: "https://medium.com/editorial/why-editorial-design-is-having-a-renaissance-b2c3d4e5f6a4", body: "Independent publications are pushing print further than mainstream media ever dared.", thumbnailUrl: "https://picsum.photos/seed/med20/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med20/1200/630", providerName: "Medium" },
  { title: "The Semiotics of Startup Logos", link: "https://medium.com/branding/the-semiotics-of-startup-logos-c3d4e5f6a1b5", body: "Every Y Combinator cohort uses the same 12 visual signals — and why that's not accidental.", thumbnailUrl: "https://picsum.photos/seed/med21/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med21/1200/630", providerName: "Medium" },
  { title: "Street Photography Ethics in 2025", link: "https://medium.com/photography/street-photography-ethics-2025-d4e5f6a1b2c6", body: "Consent, surveillance capitalism, and the shrinking public space for candid documentary work.", thumbnailUrl: "https://picsum.photos/seed/med22/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med22/1200/630", providerName: "Medium" },
  { title: "The Music of Interface Sound Design", link: "https://medium.com/audio-ux/the-music-of-interface-sound-design-e5f6a1b2c3d7", body: "From iOS keyboard clicks to spatial audio — how sound shapes perception of digital quality.", thumbnailUrl: "https://picsum.photos/seed/med23/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med23/1200/630", providerName: "Medium" },
  { title: "Space Design Principles That Work for Screens", link: "https://medium.com/spatial-ux/space-design-principles-for-screens-f6a1b2c3d4e8", body: "Prospect-refuge theory, compression-release, and other architectural concepts applied to UI depth.", thumbnailUrl: "https://picsum.photos/seed/med24/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med24/1200/630", providerName: "Medium" },
  { title: "The New Wave of Independent Type Foundries", link: "https://medium.com/typography/the-new-wave-of-independent-type-foundries-a1b2c3d4e5fa", body: "Commercial Type, Klim, Grilli, and the designers who chose craft over scale.", thumbnailUrl: "https://picsum.photos/seed/med25/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med25/1200/630", providerName: "Medium" },
  { title: "Colour Grading as Cultural Shorthand in Film", link: "https://medium.com/film/colour-grading-cultural-shorthand-b2c3d4e5f6a5", body: "How teal-and-orange became blockbuster visual language and what the backlash reveals about taste.", thumbnailUrl: "https://picsum.photos/seed/med26/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med26/1200/630", providerName: "Medium" },
  { title: "The Hidden UX of Physical Products", link: "https://medium.com/product-design/the-hidden-ux-of-physical-products-c3d4e5f6a1b6", body: "Unboxing, assembly, and disposal — the product experience that most digital designers never design.", thumbnailUrl: "https://picsum.photos/seed/med27/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med27/1200/630", providerName: "Medium" },
  { title: "Web Typography in 2025: Variable Fonts in Practice", link: "https://medium.com/web/web-typography-variable-fonts-d4e5f6a1b2c7", body: "Weight, width, and optical axes — practical implementation patterns for variable font systems.", thumbnailUrl: "https://picsum.photos/seed/med28/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med28/1200/630", providerName: "Medium" },
  { title: "Mastering the Art of the Still Life", link: "https://medium.com/photography/mastering-the-art-of-still-life-e5f6a1b2c3d8", body: "Light direction, surface selection, and compositional tension in product and object photography.", thumbnailUrl: "https://picsum.photos/seed/med29/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med29/1200/630", providerName: "Medium" },
  { title: "The Rise and Fall of Flat Design", link: "https://medium.com/design-history/the-rise-and-fall-of-flat-design-f6a1b2c3d4e9", body: "From Windows Phone's Metro to Material Design — how skeuomorphism's killer became the new conventional.", thumbnailUrl: "https://picsum.photos/seed/med30/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med30/1200/630", providerName: "Medium" },
  { title: "Culture and Colour: Why Red Means Different Things", link: "https://medium.com/cross-cultural/culture-and-colour-red-means-different-things-a1b2c3d4e5fb", body: "Colour symbolism across Chinese, Western, and Middle Eastern design contexts — a practical guide.", thumbnailUrl: "https://picsum.photos/seed/med31/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med31/1200/630", providerName: "Medium" },
  { title: "The Grid as Social Contract in Graphic Design", link: "https://medium.com/theory/the-grid-as-social-contract-b2c3d4e5f6a6", body: "Why the invisible structure of publication design is actually a promise to the reader.", thumbnailUrl: "https://picsum.photos/seed/med32/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med32/1200/630", providerName: "Medium" },
  { title: "Architecture Photography: The Ethics of Access", link: "https://medium.com/photography/architecture-photography-ethics-of-access-c3d4e5f6a1b7", body: "Who gets to photograph buildings, who gets credited, and who gets paid — the industry's blind spots.", thumbnailUrl: "https://picsum.photos/seed/med33/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med33/1200/630", providerName: "Medium" },
  { title: "Design Systems That Don't Die", link: "https://medium.com/design-systems/design-systems-that-dont-die-d4e5f6a1b2c8", body: "The governance, documentation, and adoption practices that separate living systems from archived ones.", thumbnailUrl: "https://picsum.photos/seed/med34/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med34/1200/630", providerName: "Medium" },
  { title: "The Aesthetic of Impermanence in Japanese Design", link: "https://medium.com/culture/aesthetic-impermanence-japanese-design-e5f6a1b2c3d9", body: "Ma, mono no aware, and wabi-sabi — untranslatable concepts that explain everything about Muji.", thumbnailUrl: "https://picsum.photos/seed/med35/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med35/1200/630", providerName: "Medium" },
  { title: "The Quiet Death of the Sidebar", link: "https://medium.com/ux/the-quiet-death-of-the-sidebar-f6a1b2c3d4ea", body: "Navigation pattern evolution from 2000 to now — and what the collapse of the left nav means for IA.", thumbnailUrl: "https://picsum.photos/seed/med36/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med36/1200/630", providerName: "Medium" },
  { title: "Fashion as a System of Signs", link: "https://medium.com/culture/fashion-as-a-system-of-signs-a1b2c3d4e5fc", body: "Barthes, Baudrillard, and what semiotics tells us about why people buy expensive sneakers.", thumbnailUrl: "https://picsum.photos/seed/med37/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med37/1200/630", providerName: "Medium" },
  { title: "Illustration vs Photography: Choosing the Right Visual Language", link: "https://medium.com/visual-strategy/illustration-vs-photography-b2c3d4e5f6a7", body: "When to reach for a camera, when to reach for a stylus — and how to brief both.", thumbnailUrl: "https://picsum.photos/seed/med38/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med38/1200/630", providerName: "Medium" },
  { title: "Making Music for Games: Adaptive Audio Systems", link: "https://medium.com/game-audio/making-music-for-games-adaptive-audio-c3d4e5f6a1b8", body: "How Wwise, FMOD, and dynamic stem layering create soundscapes that respond to player state.", thumbnailUrl: "https://picsum.photos/seed/med39/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med39/1200/630", providerName: "Medium" },
  { title: "The Long Lens: Documentary Photography's Ethical Horizon", link: "https://medium.com/documentary/the-long-lens-documentary-photography-d4e5f6a1b2c9", body: "The questions that follow every candid frame: consent, context, and consequence.", thumbnailUrl: "https://picsum.photos/seed/med40/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/med40/1200/630", providerName: "Medium" },
];

// GitHub-style open source project posts
const GITHUB_POSTS: PostSeed[] = [
  { title: "shadcn/ui — Beautifully designed components built with Radix and Tailwind", link: "https://github.com/shadcn-ui/ui", body: "Copy-paste React components — not a component library, a collection of reusable patterns.", thumbnailUrl: "https://picsum.photos/seed/gh01/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh01/1200/630", providerName: "GitHub" },
  { title: "tldraw — Infinite canvas toolkit for creating whiteboards", link: "https://github.com/tldraw/tldraw", body: "A very good, very fast, infinite canvas library for building collaborative tools.", thumbnailUrl: "https://picsum.photos/seed/gh02/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh02/1200/630", providerName: "GitHub" },
  { title: "Excalidraw — Virtual whiteboard for sketching hand-drawn like diagrams", link: "https://github.com/excalidraw/excalidraw", body: "An open source virtual hand-drawn style whiteboard. Collaborative and end-to-end encrypted.", thumbnailUrl: "https://picsum.photos/seed/gh03/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh03/1200/630", providerName: "GitHub" },
  { title: "Motion — A modern animation library for React", link: "https://github.com/motiondivision/motion", body: "Production-ready animation library with a natural API for declarative transitions.", thumbnailUrl: "https://picsum.photos/seed/gh04/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh04/1200/630", providerName: "GitHub" },
  { title: "Radix UI — Unstyled accessible component primitives", link: "https://github.com/radix-ui/primitives", body: "Low-level UI primitives with a focus on accessibility, customization, and developer experience.", thumbnailUrl: "https://picsum.photos/seed/gh05/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh05/1200/630", providerName: "GitHub" },
  { title: "Ark UI — Headless UI library for building design systems", link: "https://github.com/chakra-ui/ark", body: "Machine-driven, framework-agnostic headless UI components built with Zag.js state machines.", thumbnailUrl: "https://picsum.photos/seed/gh06/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh06/1200/630", providerName: "GitHub" },
  { title: "Storybook — Frontend workshop for building UI components in isolation", link: "https://github.com/storybookjs/storybook", body: "Develop, document, and test your UI components outside of your app context.", thumbnailUrl: "https://picsum.photos/seed/gh07/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh07/1200/630", providerName: "GitHub" },
  { title: "Panda CSS — Build-time, type-safe, CSS-in-JS styling solution", link: "https://github.com/chakra-ui/panda", body: "Zero-runtime CSS generation with Atomic CSS output and a TypeScript-first developer experience.", thumbnailUrl: "https://picsum.photos/seed/gh08/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh08/1200/630", providerName: "GitHub" },
  { title: "Vaul — Drawer component for React, built on top of Radix Dialog", link: "https://github.com/emilkowalski/vaul", body: "An unstyled, accessible drawer component that snaps to the bottom of the screen on mobile.", thumbnailUrl: "https://picsum.photos/seed/gh09/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh09/1200/630", providerName: "GitHub" },
  { title: "cmdk — Fast, composable, unstyled command menu for React", link: "https://github.com/pacocoursey/cmdk", body: "Render items, filter and sort them, and let users select. No opinions, infinitely flexible.", thumbnailUrl: "https://picsum.photos/seed/gh10/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh10/1200/630", providerName: "GitHub" },
  { title: "Sonner — Opinionated toast component for React", link: "https://github.com/emilkowalski/sonner", body: "An opinionated toast component that is beautifully designed, accessible, and customizable.", thumbnailUrl: "https://picsum.photos/seed/gh11/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh11/1200/630", providerName: "GitHub" },
  { title: "Zustand — Small, fast, and scalable state-management solution", link: "https://github.com/pmndrs/zustand", body: "A bearable state management with a comfortable API based on hooks, not boilerplate.", thumbnailUrl: "https://picsum.photos/seed/gh12/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh12/1200/630", providerName: "GitHub" },
  { title: "TanStack Query — Powerful data synchronization for web UIs", link: "https://github.com/TanStack/query", body: "Fetching, caching, synchronizing and updating server state without any of the boilerplate.", thumbnailUrl: "https://picsum.photos/seed/gh13/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh13/1200/630", providerName: "GitHub" },
  { title: "Drizzle ORM — Lightweight TypeScript ORM that stays out of your way", link: "https://github.com/drizzle-team/drizzle-orm", body: "SQL-like query builder with full TypeScript support, zero magic, and edge-runtime compatibility.", thumbnailUrl: "https://picsum.photos/seed/gh14/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh14/1200/630", providerName: "GitHub" },
  { title: "Zod — TypeScript-first schema validation with static type inference", link: "https://github.com/colinhacks/zod", body: "Eliminate duplicative type declarations. With Zod, you declare a validator once.", thumbnailUrl: "https://picsum.photos/seed/gh15/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh15/1200/630", providerName: "GitHub" },
  { title: "React Hook Form — Performant, flexible forms with easy validation", link: "https://github.com/react-hook-form/react-hook-form", body: "Reduce re-renders and isolate component updates with performant, uncontrolled form handling.", thumbnailUrl: "https://picsum.photos/seed/gh16/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh16/1200/630", providerName: "GitHub" },
  { title: "Astro — The web framework for content-driven websites", link: "https://github.com/withastro/astro", body: "Build fast websites with any UI framework — React, Preact, Svelte, Vue, or none at all.", thumbnailUrl: "https://picsum.photos/seed/gh17/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh17/1200/630", providerName: "GitHub" },
  { title: "Hono — Small, simple, and ultrafast web framework for the Edge", link: "https://github.com/honojs/hono", body: "Works on Cloudflare Workers, Deno, Bun, Vercel Edge, and Node.js with a unified API.", thumbnailUrl: "https://picsum.photos/seed/gh18/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh18/1200/630", providerName: "GitHub" },
  { title: "Lucia — Simple session-based authentication for TypeScript", link: "https://github.com/lucia-auth/lucia", body: "A minimal auth library that gives you control over sessions without abstracting away the database.", thumbnailUrl: "https://picsum.photos/seed/gh19/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh19/1200/630", providerName: "GitHub" },
  { title: "Million.js — Make React 70% faster with virtual DOM replacement", link: "https://github.com/aidenybai/million", body: "Block-based virtual DOM that reduces React reconciliation overhead for dynamic content.", thumbnailUrl: "https://picsum.photos/seed/gh20/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh20/1200/630", providerName: "GitHub" },
  { title: "Conform — Type-safe form validation for Remix and Next.js", link: "https://github.com/edmundhung/conform", body: "Progressive enhancement first, server-side validation with Zod and Yup support built-in.", thumbnailUrl: "https://picsum.photos/seed/gh21/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh21/1200/630", providerName: "GitHub" },
  { title: "Jotai — Primitive and flexible state management for React", link: "https://github.com/pmndrs/jotai", body: "Bottom-up approach to React state with atoms — composable and derived state without context hell.", thumbnailUrl: "https://picsum.photos/seed/gh22/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh22/1200/630", providerName: "GitHub" },
  { title: "Biome — Fast formatter and linter for JavaScript and TypeScript", link: "https://github.com/biomejs/biome", body: "Replaces Prettier and ESLint with a single tool — 10x faster, zero configuration required.", thumbnailUrl: "https://picsum.photos/seed/gh23/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh23/1200/630", providerName: "GitHub" },
  { title: "Valibot — Modular schema validation with minimal bundle size", link: "https://github.com/fabian-hiller/valibot", body: "Bundle-size aware alternative to Zod — tree-shakeable, modular, and under 1kb for simple schemas.", thumbnailUrl: "https://picsum.photos/seed/gh24/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh24/1200/630", providerName: "GitHub" },
  { title: "Nanostores — Tiny state manager with many intergrations", link: "https://github.com/nanostores/nanostores", body: "Framework-agnostic 334-byte state manager with integrations for React, Preact, Vue, and Svelte.", thumbnailUrl: "https://picsum.photos/seed/gh25/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh25/1200/630", providerName: "GitHub" },
  { title: "Resend — Email API for developers", link: "https://github.com/resend/resend-node", body: "Send transactional emails with an API that developers actually enjoy using.", thumbnailUrl: "https://picsum.photos/seed/gh26/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh26/1200/630", providerName: "GitHub" },
  { title: "Oslo — Collection of auth-related utilities for JavaScript", link: "https://github.com/pilcrowOnPaper/oslo", body: "JWT, PKCE, TOTP, HMAC, and more — the cryptographic primitives for auth without the framework lock-in.", thumbnailUrl: "https://picsum.photos/seed/gh27/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh27/1200/630", providerName: "GitHub" },
  { title: "Uploadthing — File uploads for modern web applications", link: "https://github.com/pingdotgg/uploadthing", body: "Type-safe file upload with S3 under the hood — works with Next.js, Remix, and Express.", thumbnailUrl: "https://picsum.photos/seed/gh28/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh28/1200/630", providerName: "GitHub" },
  { title: "Nuqs — Type-safe search params state manager for Next.js", link: "https://github.com/47ng/nuqs", body: "URL search parameters as React state — shareable, bookmarkable, and serialization-aware.", thumbnailUrl: "https://picsum.photos/seed/gh29/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh29/1200/630", providerName: "GitHub" },
  { title: "Trigger.dev — Open source background jobs platform for TypeScript", link: "https://github.com/triggerdotdev/trigger.dev", body: "Run long-running tasks, scheduled jobs, and event-driven workflows from your existing codebase.", thumbnailUrl: "https://picsum.photos/seed/gh30/1200/630", profileThumbnailUrl: "https://picsum.photos/seed/gh30/1200/630", providerName: "GitHub" },
];

// Counts for each provider — random-ish but fixed so each run is deterministic-ish
const PROVIDER_COUNTS: Record<string, number> = {
  "Behance Photography": 45,
  "Pinterest": 30,
  "Dribbble": 35,
  "Unsplash": 40,
  "Medium": 50,
  "GitHub": 30,
};

const ALL_POSTS: Record<string, PostSeed[]> = {
  "Behance Photography": BEHANCE_POSTS,
  "Pinterest": PINTEREST_POSTS,
  "Dribbble": DRIBBBLE_POSTS,
  "Unsplash": UNSPLASH_POSTS,
  "Medium": MEDIUM_POSTS,
  "GitHub": GITHUB_POSTS,
};

const COMMENT_POOL = [
  "The light in this frame is doing everything. Perfect window of timing.",
  "What camera and lens for this? The bokeh renders so smoothly.",
  "Composition is strong but what really makes it is the decisive moment.",
  "The tonal range from shadow to highlight is impressive.",
  "This is in my top five frames I've seen this year.",
  "The symmetry here is almost architectural. Deliberately composed or happy accident?",
  "Found this from a repost and immediately saved it as a reference.",
  "The selective focus is working perfectly — sharp where it counts.",
  "That leading line draws the eye exactly where it should go.",
  "Strong work. The subject's relationship to the environment tells the whole story.",
  "This captures the feeling of the place better than any wide-angle tourist shot could.",
  "Really appreciate the restraint here. Most would have cropped tighter.",
  "The low POV changes everything. Same light from standing height would have been ordinary.",
  "This is the shot that justifies waking up at 4am.",
  "The color temperature feels deliberately cool to contrast the warmth of the subject.",
];

async function main() {
  const devUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.email, DEV_EMAILS));

  if (devUsers.length === 0) {
    throw new Error("No dev users found. Run `npm run seed:dev` first.");
  }

  console.log(`Found ${devUsers.length} dev users.`);
  console.log("\nDeleting all existing posts (cascades to comments and saves)...");

  await db.execute(sql`TRUNCATE TABLE ${posts} CASCADE`);
  console.log("Done.\n");

  let totalInserted = 0;
  let postIndex = 0;

  for (const [providerName, pool] of Object.entries(ALL_POSTS)) {
    const targetCount = PROVIDER_COUNTS[providerName] ?? 30;
    const selected = pick(pool, Math.min(targetCount, pool.length));

    console.log(`Seeding ${selected.length} posts for ${providerName}...`);

    for (const seed of selected) {
      const author = devUsers[postIndex % devUsers.length]!;
      const tags = randomTags();
      const now = new Date(Date.now() - postIndex * 90_000);

      await db
        .insert(posts)
        .values({
          userId: author.id,
          title: seed.title,
          link: seed.link,
          body: seed.body,
          thumbnailUrl: seed.thumbnailUrl,
          profileThumbnailUrl: seed.profileThumbnailUrl,
          providerName: seed.providerName,
          tags,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoNothing({ target: posts.link });

      postIndex++;
      totalInserted++;
    }
  }

  console.log(`\nInserted ${totalInserted} posts.\n`);

  // Add a few comments per post
  const allPostIds = await db.select({ id: posts.id }).from(posts);

  let totalComments = 0;
  for (let i = 0; i < allPostIds.length; i++) {
    const postId = allPostIds[i]!.id;
    const commentCount = 1 + (i % 3);

    for (let c = 0; c < commentCount; c++) {
      const commenter = devUsers[(i * 3 + c * 5 + 2) % devUsers.length]!;
      const text = COMMENT_POOL[(i * 7 + c * 3 + 11) % COMMENT_POOL.length]!;

      await db.insert(comments).values({
        postId,
        userId: commenter.id,
        body: text,
        parentId: null,
        replyToUserName: null
      });

      await db.execute(
        sql`UPDATE ${posts} SET comments_count = comments_count + 1 WHERE id = ${postId}`
      );
      totalComments++;
    }
  }

  console.log(`Added ${totalComments} comments.\n`);
  console.log("Reseed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => client.end());
