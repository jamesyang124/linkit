/**
 * Seeds gallery with 4 providers × ~60 posts each (~240 total).
 * Uses picsum.photos for thumbnails.
 *
 * Usage:
 *   DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npx tsx scripts/seed-gallery.ts
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
  "mia@dev.local",
  "ravi@dev.local",
  "sofia@dev.local",
  "james@dev.local",
  "lena@dev.local",
  "kofi@dev.local",
  "yuki@dev.local",
  "omar@dev.local",
  "priya@dev.local",
  "lukas@dev.local"
];

type PostSeed = {
  title: string;
  link: string;
  body: string;
  thumbnailUrl: string;
  profileThumbnailUrl: string;
  providerName: string;
};

// ─── Behance Photography (60 posts) ──────────────────────────────────────────

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
  { title: "Cycling Peloton — Tour de France", link: "https://www.behance.net/gallery/232495190/Cycling-Peloton-Tour-de-France", body: "Accredited race photography along the Pyrenean mountain stages.", thumbnailUrl: "https://picsum.photos/seed/beh51/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh51/900/1200", providerName: "Behance Photography" },
  { title: "Tepui Summits — Venezuela Tabletop Mountains", link: "https://www.behance.net/gallery/233606300/Tepui-Summits-Venezuela", body: "Helicopter and trekking access to Roraima and Kukenan tepuis.", thumbnailUrl: "https://picsum.photos/seed/beh52/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh52/900/1200", providerName: "Behance Photography" },
  { title: "Geisha District — Gion Kyoto", link: "https://www.behance.net/gallery/234717410/Geisha-District-Gion-Kyoto", body: "Evening documentary in the preserved machiya townhouses of Gion.", thumbnailUrl: "https://picsum.photos/seed/beh53/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh53/900/1200", providerName: "Behance Photography" },
  { title: "Refugee Camp — Dadaab Kenya", link: "https://www.behance.net/gallery/235828520/Refugee-Camp-Dadaab-Kenya", body: "UNHCR-accredited documentary in the world's largest refugee settlement.", thumbnailUrl: "https://picsum.photos/seed/beh54/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh54/900/1200", providerName: "Behance Photography" },
  { title: "Coral Reefs — Great Barrier Bleaching", link: "https://www.behance.net/gallery/236939630/Coral-Reefs-Great-Barrier", body: "Underwater climate documentation of bleaching events in Queensland.", thumbnailUrl: "https://picsum.photos/seed/beh55/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh55/900/1200", providerName: "Behance Photography" },
  { title: "Boxing Gym — Havana Cuba", link: "https://www.behance.net/gallery/238050740/Boxing-Gym-Havana-Cuba", body: "Available-light documentary in historic Havana boxing training halls.", thumbnailUrl: "https://picsum.photos/seed/beh56/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh56/900/1200", providerName: "Behance Photography" },
  { title: "Wool Dyeing — Fez Tanneries", link: "https://www.behance.net/gallery/239161850/Wool-Dyeing-Fez-Tanneries", body: "Overhead photography of the ancient leather tanneries in Fez medina.", thumbnailUrl: "https://picsum.photos/seed/beh57/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh57/900/1200", providerName: "Behance Photography" },
  { title: "Bamboo Forests — Arashiyama Dawn", link: "https://www.behance.net/gallery/240272960/Bamboo-Forests-Arashiyama-Dawn", body: "Pre-tourist dawn photography in the famous Arashiyama bamboo grove.", thumbnailUrl: "https://picsum.photos/seed/beh58/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh58/900/1200", providerName: "Behance Photography" },
  { title: "Antarctic Expedition — Research Station", link: "https://www.behance.net/gallery/241384070/Antarctic-Expedition-Research", body: "Three months embedded with scientists at a British Antarctic Survey base.", thumbnailUrl: "https://picsum.photos/seed/beh59/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh59/900/1200", providerName: "Behance Photography" },
  { title: "Paddy Fields — Bali Tegallalang", link: "https://www.behance.net/gallery/242495180/Paddy-Fields-Bali-Tegallalang", body: "Subak irrigation system rice terraces at first light.", thumbnailUrl: "https://picsum.photos/seed/beh60/820/580", profileThumbnailUrl: "https://picsum.photos/seed/beh60/900/1200", providerName: "Behance Photography" },
];

// ─── Pinterest (60 posts) ─────────────────────────────────────────────────────

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
  { title: "Book Fair — Frankfurt Crowds", link: "https://www.pinterest.com/pin/916904805394680047/", body: "Street documentary at the world's largest book fair.", thumbnailUrl: "https://picsum.photos/seed/pin20/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin20/736/980", providerName: "Pinterest" },
  { title: "Wabi-Sabi — Imperfect Ceramics", link: "https://www.pinterest.com/pin/916904805394761134/", body: "Product photography embracing cracks, chips, and imperfect glaze.", thumbnailUrl: "https://picsum.photos/seed/pin21/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin21/736/1050", providerName: "Pinterest" },
  { title: "Cherry Blossoms — Kyoto Maruyama Park", link: "https://www.pinterest.com/pin/916904805394842221/", body: "One week of dawn shoots under Kyoto's famous weeping cherry.", thumbnailUrl: "https://picsum.photos/seed/pin22/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin22/736/920", providerName: "Pinterest" },
  { title: "Rock Climbing — Yosemite Big Wall", link: "https://www.pinterest.com/pin/916904805394923308/", body: "Vertical expedition photography on El Capitan.", thumbnailUrl: "https://picsum.photos/seed/pin23/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin23/736/1100", providerName: "Pinterest" },
  { title: "Concrete Poetry — Brutalist Interiors", link: "https://www.pinterest.com/pin/916904805395004395/", body: "Interior architectural photography in Barbican Estate, London.", thumbnailUrl: "https://picsum.photos/seed/pin24/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin24/736/980", providerName: "Pinterest" },
  { title: "Desert Bloom — Atacama Wildflowers", link: "https://www.pinterest.com/pin/916904805395085482/", body: "The rare superbloom event in the driest desert on Earth.", thumbnailUrl: "https://picsum.photos/seed/pin25/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin25/736/1050", providerName: "Pinterest" },
  { title: "Surf Photography — Pipeline Hawaii", link: "https://www.pinterest.com/pin/916904805395166569/", body: "In-water tube photography at Banzai Pipeline.", thumbnailUrl: "https://picsum.photos/seed/pin26/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin26/736/920", providerName: "Pinterest" },
  { title: "Autumn Leaves — Kyoto Temples", link: "https://www.pinterest.com/pin/916904805395247656/", body: "Maple (momiji) season photography in Arashiyama and Tofukuji.", thumbnailUrl: "https://picsum.photos/seed/pin27/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin27/736/1100", providerName: "Pinterest" },
  { title: "Food Photography — Ramen Close-Up", link: "https://www.pinterest.com/pin/916904805395328743/", body: "Steaming tonkotsu ramen overhead editorial in Fukuoka.", thumbnailUrl: "https://picsum.photos/seed/pin28/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin28/736/980", providerName: "Pinterest" },
  { title: "Glacier Terminus — Alaska Field Work", link: "https://www.pinterest.com/pin/916904805395409830/", body: "Scientific expedition photography on the retreating Exit Glacier.", thumbnailUrl: "https://picsum.photos/seed/pin29/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin29/736/1050", providerName: "Pinterest" },
  { title: "Portraits of Age — Village Elders Georgia", link: "https://www.pinterest.com/pin/916904805395490917/", body: "Intimate portrait series from mountain villages in Georgian Caucasus.", thumbnailUrl: "https://picsum.photos/seed/pin30/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin30/736/920", providerName: "Pinterest" },
  { title: "Lofoten Islands — Winter Fishing Villages", link: "https://www.pinterest.com/pin/916904805395572004/", body: "Red fishing huts on stilts against snow-capped Norwegian peaks.", thumbnailUrl: "https://picsum.photos/seed/pin31/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin31/736/1100", providerName: "Pinterest" },
  { title: "Urban Gardens — Rooftop Farming NYC", link: "https://www.pinterest.com/pin/916904805395653091/", body: "Community garden photography on Brooklyn rooftops.", thumbnailUrl: "https://picsum.photos/seed/pin32/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin32/736/980", providerName: "Pinterest" },
  { title: "Masked Carnival — Venice Italy", link: "https://www.pinterest.com/pin/916904805395734178/", body: "Costumed figures photographed in fog along the Grand Canal.", thumbnailUrl: "https://picsum.photos/seed/pin33/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin33/736/1050", providerName: "Pinterest" },
  { title: "Bee Keeping — Rural France", link: "https://www.pinterest.com/pin/916904805395815265/", body: "Apiary documentary in the lavender fields of Provence.", thumbnailUrl: "https://picsum.photos/seed/pin34/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin34/736/920", providerName: "Pinterest" },
  { title: "Polaroids — Summer Road Trip", link: "https://www.pinterest.com/pin/916904805395896352/", body: "Instant film documentation of a cross-country drive from Maine to California.", thumbnailUrl: "https://picsum.photos/seed/pin35/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin35/736/1100", providerName: "Pinterest" },
  { title: "Night Train — Eastern Europe Sleeper", link: "https://www.pinterest.com/pin/916904805395977439/", body: "Available-light photography in sleeping compartments across Eastern Europe.", thumbnailUrl: "https://picsum.photos/seed/pin36/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin36/736/980", providerName: "Pinterest" },
  { title: "Wild Horses — Camargue France", link: "https://www.pinterest.com/pin/916904805396058526/", body: "Free-roaming white horses in the Rhône delta wetlands.", thumbnailUrl: "https://picsum.photos/seed/pin37/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin37/736/1050", providerName: "Pinterest" },
  { title: "Bookshops — Independent Stores London", link: "https://www.pinterest.com/pin/916904805396139613/", body: "Interior photography of London's surviving independent bookshops.", thumbnailUrl: "https://picsum.photos/seed/pin38/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin38/736/920", providerName: "Pinterest" },
  { title: "Skate Parks — Empty at Dusk", link: "https://www.pinterest.com/pin/916904805396220700/", body: "Architectural photography of abandoned skate parks at golden hour.", thumbnailUrl: "https://picsum.photos/seed/pin39/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin39/736/1100", providerName: "Pinterest" },
  { title: "Wetland Birds — Camargue Flamingos", link: "https://www.pinterest.com/pin/916904805396301787/", body: "Wildlife telephoto photography of flamingo colonies in southern France.", thumbnailUrl: "https://picsum.photos/seed/pin40/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin40/736/980", providerName: "Pinterest" },
  { title: "Rooftops — Naples at Sunset", link: "https://www.pinterest.com/pin/916904805396382874/", body: "Golden light across the terracotta rooftops and laundry lines of Naples.", thumbnailUrl: "https://picsum.photos/seed/pin41/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin41/736/1050", providerName: "Pinterest" },
  { title: "Coastal Fishermen — Kerala Backwaters", link: "https://www.pinterest.com/pin/916904805396463961/", body: "Traditional Chinese fishing nets at sunrise in Fort Kochi.", thumbnailUrl: "https://picsum.photos/seed/pin42/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin42/736/920", providerName: "Pinterest" },
  { title: "Desert Roads — Outback Australia", link: "https://www.pinterest.com/pin/916904805396545048/", body: "Stuart Highway straight-line photography across the red centre.", thumbnailUrl: "https://picsum.photos/seed/pin43/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin43/736/1100", providerName: "Pinterest" },
  { title: "Flower Market — Amsterdam Bloemenmarkt", link: "https://www.pinterest.com/pin/916904805396626135/", body: "Color saturation study in the world's only floating flower market.", thumbnailUrl: "https://picsum.photos/seed/pin44/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin44/736/980", providerName: "Pinterest" },
  { title: "Midnight Sun — Finnish Lapland", link: "https://www.pinterest.com/pin/916904805396707222/", body: "24-hour daylight landscape photography in midsummer Finland.", thumbnailUrl: "https://picsum.photos/seed/pin45/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin45/736/1050", providerName: "Pinterest" },
  { title: "Textile Weavers — Oaxaca Mexico", link: "https://www.pinterest.com/pin/916904805396788309/", body: "Documentary of backstrap loom weaving traditions in Teotitlán del Valle.", thumbnailUrl: "https://picsum.photos/seed/pin46/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin46/736/920", providerName: "Pinterest" },
  { title: "Mountain Huts — Dolomites Italy", link: "https://www.pinterest.com/pin/916904805396869396/", body: "Rifugio hut photography at altitude in the Tre Cime di Lavaredo area.", thumbnailUrl: "https://picsum.photos/seed/pin47/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin47/736/1100", providerName: "Pinterest" },
  { title: "Analog Darkroom — Film Development", link: "https://www.pinterest.com/pin/916904805396950483/", body: "Red safelight documentary of the analog printing and development process.", thumbnailUrl: "https://picsum.photos/seed/pin48/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin48/736/980", providerName: "Pinterest" },
  { title: "Vineyard Harvest — Burgundy France", link: "https://www.pinterest.com/pin/916904805397031570/", body: "Documentary of hand-harvest and sorting at a small Burgundy domaine.", thumbnailUrl: "https://picsum.photos/seed/pin49/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin49/736/1050", providerName: "Pinterest" },
  { title: "Street Corners — Havana Architecture", link: "https://www.pinterest.com/pin/916904805397112657/", body: "Faded colonial facades and street life in central Havana.", thumbnailUrl: "https://picsum.photos/seed/pin50/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin50/736/920", providerName: "Pinterest" },
  { title: "Sunflower Fields — Provence Summer", link: "https://www.pinterest.com/pin/916904805397193744/", body: "Landscape photography across sunflower fields at Valensole plateau.", thumbnailUrl: "https://picsum.photos/seed/pin51/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin51/736/1100", providerName: "Pinterest" },
  { title: "Potters Market — Fès El Bali", link: "https://www.pinterest.com/pin/916904805397274831/", body: "Artisan ceramics documentary in the Fez pottery quarter.", thumbnailUrl: "https://picsum.photos/seed/pin52/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin52/736/980", providerName: "Pinterest" },
  { title: "Stormy Seas — Faroe Islands", link: "https://www.pinterest.com/pin/916904805397355918/", body: "Long exposure seascapes of Atlantic swells crashing at Sørvágsvatn.", thumbnailUrl: "https://picsum.photos/seed/pin53/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin53/736/1050", providerName: "Pinterest" },
  { title: "Greenhouse Flowers — Dutch Horticulture", link: "https://www.pinterest.com/pin/916904805397437005/", body: "Close-up editorial in the vast flower greenhouses of the Westland region.", thumbnailUrl: "https://picsum.photos/seed/pin54/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin54/736/920", providerName: "Pinterest" },
  { title: "Caves — Waitomo Glowworms NZ", link: "https://www.pinterest.com/pin/916904805397518092/", body: "Long exposure in total darkness lit only by bioluminescent glowworms.", thumbnailUrl: "https://picsum.photos/seed/pin55/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin55/736/1100", providerName: "Pinterest" },
  { title: "Sunday Market — Antananarivo Madagascar", link: "https://www.pinterest.com/pin/916904805397599179/", body: "Color and crowd documentary at the weekly highland capital market.", thumbnailUrl: "https://picsum.photos/seed/pin56/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin56/736/980", providerName: "Pinterest" },
  { title: "Cliffside Villages — Cinque Terre", link: "https://www.pinterest.com/pin/916904805397680266/", body: "Coastal hiking trail photography linking the five Ligurian villages.", thumbnailUrl: "https://picsum.photos/seed/pin57/736/1050", profileThumbnailUrl: "https://picsum.photos/seed/pin57/736/1050", providerName: "Pinterest" },
  { title: "Fishing Boats — Essaouira Morocco", link: "https://www.pinterest.com/pin/916904805397761353/", body: "Blue and white fishing fleet in the Atlantic port city of Essaouira.", thumbnailUrl: "https://picsum.photos/seed/pin58/736/920", profileThumbnailUrl: "https://picsum.photos/seed/pin58/736/920", providerName: "Pinterest" },
  { title: "Tulip Fields — Lisse Netherlands", link: "https://www.pinterest.com/pin/916904805397842440/", body: "Aerial and ground-level photography during Keukenhof peak bloom.", thumbnailUrl: "https://picsum.photos/seed/pin59/736/1100", profileThumbnailUrl: "https://picsum.photos/seed/pin59/736/1100", providerName: "Pinterest" },
  { title: "Misty Rainforest — Olympic Peninsula WA", link: "https://www.pinterest.com/pin/916904805397923527/", body: "Temperate rainforest photography in the Hoh Rain Forest, Washington State.", thumbnailUrl: "https://picsum.photos/seed/pin60/736/980", profileThumbnailUrl: "https://picsum.photos/seed/pin60/736/980", providerName: "Pinterest" },
];

// ─── Dribbble (60 posts) ──────────────────────────────────────────────────────

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
  { title: "Newsletter Template — Editorial Grid", link: "https://dribbble.com/shots/24119199-Newsletter-Template-Editorial", body: "Email newsletter with three-column editorial layout and custom header.", thumbnailUrl: "https://picsum.photos/seed/dri19/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri19/400/300", providerName: "Dribbble" },
  { title: "Fitness App — Progress Tracking", link: "https://dribbble.com/shots/24120200-Fitness-App-Progress-Tracking", body: "Workout log with streak calendar, personal records, and chart views.", thumbnailUrl: "https://picsum.photos/seed/dri20/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri20/400/300", providerName: "Dribbble" },
  { title: "Chat Interface — AI Assistant", link: "https://dribbble.com/shots/24121211-Chat-Interface-AI-Assistant", body: "Conversational UI with streaming text, code blocks, and quick replies.", thumbnailUrl: "https://picsum.photos/seed/dri21/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri21/400/300", providerName: "Dribbble" },
  { title: "Menu Design — Sushi Restaurant", link: "https://dribbble.com/shots/24122222-Menu-Design-Sushi-Restaurant", body: "A4 menu with ink brush texture, Japanese typography, and QR code.", thumbnailUrl: "https://picsum.photos/seed/dri22/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri22/400/300", providerName: "Dribbble" },
  { title: "AR Interface — Navigation Overlay", link: "https://dribbble.com/shots/24123233-AR-Interface-Navigation", body: "Augmented reality walking navigation with floating waypoints.", thumbnailUrl: "https://picsum.photos/seed/dri23/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri23/400/300", providerName: "Dribbble" },
  { title: "Food App — Restaurant Discovery", link: "https://dribbble.com/shots/24124244-Food-App-Restaurant-Discovery", body: "Geolocation-based restaurant cards with filter chips and rating display.", thumbnailUrl: "https://picsum.photos/seed/dri24/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri24/400/300", providerName: "Dribbble" },
  { title: "Annual Report — Data Visualization", link: "https://dribbble.com/shots/24125255-Annual-Report-Data-Visualization", body: "48-page report with waffle charts, network graphs, and section breaks.", thumbnailUrl: "https://picsum.photos/seed/dri25/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri25/400/300", providerName: "Dribbble" },
  { title: "Watch Face — Minimal Sport", link: "https://dribbble.com/shots/24126266-Watch-Face-Minimal-Sport", body: "Apple Watch face with always-on heart rate ring and complication slots.", thumbnailUrl: "https://picsum.photos/seed/dri26/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri26/400/300", providerName: "Dribbble" },
  { title: "Poster Series — Jazz Festival", link: "https://dribbble.com/shots/24127277-Poster-Series-Jazz-Festival", body: "Set of three A2 posters with risograph-style illustration and hand lettering.", thumbnailUrl: "https://picsum.photos/seed/dri27/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri27/400/300", providerName: "Dribbble" },
  { title: "Token System — Spacing and Color", link: "https://dribbble.com/shots/24128288-Token-System-Spacing-Color", body: "Design token documentation with semantic naming and Figma variables.", thumbnailUrl: "https://picsum.photos/seed/dri28/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri28/400/300", providerName: "Dribbble" },
  { title: "Checkout Flow — Mobile Commerce", link: "https://dribbble.com/shots/24129299-Checkout-Flow-Mobile-Commerce", body: "Three-step checkout with address autofill and Apple Pay integration.", thumbnailUrl: "https://picsum.photos/seed/dri29/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri29/400/300", providerName: "Dribbble" },
  { title: "Illustration System — Empty States", link: "https://dribbble.com/shots/24130300-Illustration-System-Empty-States", body: "Set of 20 empty state illustrations for common UI scenarios.", thumbnailUrl: "https://picsum.photos/seed/dri30/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri30/400/300", providerName: "Dribbble" },
  { title: "Split Testing — A/B Landing Variants", link: "https://dribbble.com/shots/24131311-Split-Testing-AB-Landing", body: "Side-by-side variants with headline and CTA color tests annotated.", thumbnailUrl: "https://picsum.photos/seed/dri31/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri31/400/300", providerName: "Dribbble" },
  { title: "Mobile Game UI — Match 3 Puzzle", link: "https://dribbble.com/shots/24132322-Mobile-Game-UI-Match-3", body: "Colorful match-3 game with lives system, booster bar, and level map.", thumbnailUrl: "https://picsum.photos/seed/dri32/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri32/400/300", providerName: "Dribbble" },
  { title: "Navigation — Mega Menu Redesign", link: "https://dribbble.com/shots/24133333-Navigation-Mega-Menu-Redesign", body: "Hierarchical mega menu with featured image, category columns, and search.", thumbnailUrl: "https://picsum.photos/seed/dri33/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri33/400/300", providerName: "Dribbble" },
  { title: "Logotype — Geometric Wordmark", link: "https://dribbble.com/shots/24134344-Logotype-Geometric-Wordmark", body: "Custom geometric typeface used as a wordmark with optical adjustments.", thumbnailUrl: "https://picsum.photos/seed/dri34/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri34/400/300", providerName: "Dribbble" },
  { title: "Smart Home — Control Panel UI", link: "https://dribbble.com/shots/24135355-Smart-Home-Control-Panel", body: "Home automation panel with room scenes, energy usage, and device tiles.", thumbnailUrl: "https://picsum.photos/seed/dri35/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri35/400/300", providerName: "Dribbble" },
  { title: "Slide Deck — Investor Presentation", link: "https://dribbble.com/shots/24136366-Slide-Deck-Investor-Presentation", body: "20-slide pitch deck template with data chart layouts and section dividers.", thumbnailUrl: "https://picsum.photos/seed/dri36/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri36/400/300", providerName: "Dribbble" },
  { title: "Crypto Wallet — Portfolio View", link: "https://dribbble.com/shots/24137377-Crypto-Wallet-Portfolio-View", body: "Asset allocation donut chart with 24h delta indicators and transaction list.", thumbnailUrl: "https://picsum.photos/seed/dri37/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri37/400/300", providerName: "Dribbble" },
  { title: "Microinteraction — Toggle States", link: "https://dribbble.com/shots/24138388-Microinteraction-Toggle-States", body: "Springy toggle animation with haptic timing annotations.", thumbnailUrl: "https://picsum.photos/seed/dri38/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri38/400/300", providerName: "Dribbble" },
  { title: "Editorial Layout — Digital Magazine", link: "https://dribbble.com/shots/24139399-Editorial-Layout-Digital-Magazine", body: "Web magazine spread with pull quotes, inline video, and scroll animation.", thumbnailUrl: "https://picsum.photos/seed/dri39/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri39/400/300", providerName: "Dribbble" },
  { title: "Dark Mode — Code Editor Theme", link: "https://dribbble.com/shots/24140400-Dark-Mode-Code-Editor-Theme", body: "Syntax highlighting theme with carefully tuned contrast ratios.", thumbnailUrl: "https://picsum.photos/seed/dri40/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri40/400/300", providerName: "Dribbble" },
  { title: "Job Board — Filter and Search", link: "https://dribbble.com/shots/24141411-Job-Board-Filter-Search", body: "Faceted job search with role, salary, remote toggle, and company size.", thumbnailUrl: "https://picsum.photos/seed/dri41/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri41/400/300", providerName: "Dribbble" },
  { title: "Illustration — Character Design System", link: "https://dribbble.com/shots/24142422-Illustration-Character-Design-System", body: "Modular character parts library with skin tone and expression variants.", thumbnailUrl: "https://picsum.photos/seed/dri42/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri42/400/300", providerName: "Dribbble" },
  { title: "Notification Center — Priority Inbox", link: "https://dribbble.com/shots/24143433-Notification-Center-Priority", body: "Batched notification system with AI-suggested priority sorting.", thumbnailUrl: "https://picsum.photos/seed/dri43/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri43/400/300", providerName: "Dribbble" },
  { title: "Form Design — Multi-step Wizard", link: "https://dribbble.com/shots/24144444-Form-Design-Multistep-Wizard", body: "Insurance application form with progress stepper and validation states.", thumbnailUrl: "https://picsum.photos/seed/dri44/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri44/400/300", providerName: "Dribbble" },
  { title: "Video Platform — Creator Studio", link: "https://dribbble.com/shots/24145455-Video-Platform-Creator-Studio", body: "Analytics, upload, and monetization dashboard for video creators.", thumbnailUrl: "https://picsum.photos/seed/dri45/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri45/400/300", providerName: "Dribbble" },
  { title: "Color Palette — Seasonal Brand System", link: "https://dribbble.com/shots/24146466-Color-Palette-Seasonal-Brand", body: "Four seasonal palettes with WCAG-compliant pairings and usage guidelines.", thumbnailUrl: "https://picsum.photos/seed/dri46/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri46/400/300", providerName: "Dribbble" },
  { title: "Timeline — Project Gantt View", link: "https://dribbble.com/shots/24147477-Timeline-Project-Gantt-View", body: "Horizontal Gantt chart with dependency lines, milestones, and swimlanes.", thumbnailUrl: "https://picsum.photos/seed/dri47/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri47/400/300", providerName: "Dribbble" },
  { title: "Recipe App — Ingredient Scanner", link: "https://dribbble.com/shots/24148488-Recipe-App-Ingredient-Scanner", body: "Camera-based ingredient detection feeding into a meal suggestion engine.", thumbnailUrl: "https://picsum.photos/seed/dri48/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri48/400/300", providerName: "Dribbble" },
  { title: "Print — Identity Manual Layout", link: "https://dribbble.com/shots/24149499-Print-Identity-Manual-Layout", body: "Brand guideline book spread with grid diagrams and logo exclusion zone.", thumbnailUrl: "https://picsum.photos/seed/dri49/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri49/400/300", providerName: "Dribbble" },
  { title: "Prototype — Swipe Card Stack", link: "https://dribbble.com/shots/24150500-Prototype-Swipe-Card-Stack", body: "Tinder-style swipe deck with spring physics and decision gesture.", thumbnailUrl: "https://picsum.photos/seed/dri50/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri50/400/300", providerName: "Dribbble" },
  { title: "Dashboard — Real Estate Analytics", link: "https://dribbble.com/shots/24151511-Dashboard-Real-Estate-Analytics", body: "Property market trends with neighborhood heatmap and listing KPIs.", thumbnailUrl: "https://picsum.photos/seed/dri51/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri51/400/300", providerName: "Dribbble" },
  { title: "Web3 Mint Page — NFT Drop", link: "https://dribbble.com/shots/24152522-Web3-Mint-Page-NFT-Drop", body: "Countdown timer, wallet connect, and mint progress bar for NFT launch.", thumbnailUrl: "https://picsum.photos/seed/dri52/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri52/400/300", providerName: "Dribbble" },
  { title: "CMS Interface — Content Calendar", link: "https://dribbble.com/shots/24153533-CMS-Interface-Content-Calendar", body: "Editorial calendar with channel filter, status chips, and bulk edit.", thumbnailUrl: "https://picsum.photos/seed/dri53/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri53/400/300", providerName: "Dribbble" },
  { title: "Error States — 404 Illustration", link: "https://dribbble.com/shots/24154544-Error-States-404-Illustration", body: "Playful 404 and 500 illustration set with reconnect flow.", thumbnailUrl: "https://picsum.photos/seed/dri54/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri54/400/300", providerName: "Dribbble" },
  { title: "Checkout UX — Guest vs Account", link: "https://dribbble.com/shots/24155555-Checkout-UX-Guest-vs-Account", body: "Decision screen comparing friction of guest checkout and account benefits.", thumbnailUrl: "https://picsum.photos/seed/dri55/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri55/400/300", providerName: "Dribbble" },
  { title: "Illustration — Isometric City", link: "https://dribbble.com/shots/24156566-Illustration-Isometric-City", body: "Detailed isometric city block with animated traffic and ambient loop.", thumbnailUrl: "https://picsum.photos/seed/dri56/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri56/400/300", providerName: "Dribbble" },
  { title: "Voice UI — Listening State", link: "https://dribbble.com/shots/24157577-Voice-UI-Listening-State", body: "Waveform animation for voice assistant active and processing states.", thumbnailUrl: "https://picsum.photos/seed/dri57/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri57/400/300", providerName: "Dribbble" },
  { title: "Reward System — Loyalty Points", link: "https://dribbble.com/shots/24158588-Reward-System-Loyalty-Points", body: "Gamified points accumulation with tier badges and reward catalog.", thumbnailUrl: "https://picsum.photos/seed/dri58/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri58/400/300", providerName: "Dribbble" },
  { title: "Survey Tool — Question Builder", link: "https://dribbble.com/shots/24159599-Survey-Tool-Question-Builder", body: "Drag-and-drop survey builder with logic branching and response preview.", thumbnailUrl: "https://picsum.photos/seed/dri59/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri59/400/300", providerName: "Dribbble" },
  { title: "Brand — Typeface Pairing Guide", link: "https://dribbble.com/shots/24160600-Brand-Typeface-Pairing-Guide", body: "Display and body font pairing showcase with usage examples across media.", thumbnailUrl: "https://picsum.photos/seed/dri60/800/600", profileThumbnailUrl: "https://picsum.photos/seed/dri60/400/300", providerName: "Dribbble" },
];

// ─── Unsplash (60 posts) ──────────────────────────────────────────────────────

const UNSPLASH_POSTS: PostSeed[] = [
  { title: "Misty Mountain Morning — Pacific Crest", link: "https://unsplash.com/photos/misty-mountain-morning-pacific-crest-aA0uHHEzGaI", body: "Blue-hour mist rolling through pine ridges on the PCT.", thumbnailUrl: "https://picsum.photos/seed/uns01/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns01/1080/720", providerName: "Unsplash" },
  { title: "Concrete Staircase — Minimalist Architecture", link: "https://unsplash.com/photos/concrete-staircase-minimalist-bB5OGCZWiLM", body: "Helical concrete stair with a single shaft of natural light.", thumbnailUrl: "https://picsum.photos/seed/uns02/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns02/1080/720", providerName: "Unsplash" },
  { title: "Ocean at Dusk — Long Exposure Waves", link: "https://unsplash.com/photos/ocean-at-dusk-long-exposure-cTWoKkIcxJA", body: "Silky water effect at 2s exposure on a rocky Atlantic coast.", thumbnailUrl: "https://picsum.photos/seed/uns03/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns03/1080/720", providerName: "Unsplash" },
  { title: "Street Market — Fresh Produce Colors", link: "https://unsplash.com/photos/street-market-fresh-produce-pDEKwKs9RNM", body: "Overhead flat lay of vegetable stalls in a Catalan market.", thumbnailUrl: "https://picsum.photos/seed/uns04/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns04/1080/720", providerName: "Unsplash" },
  { title: "Forest Path — Autumn Light Filter", link: "https://unsplash.com/photos/forest-path-autumn-light-XDi5Pah8rjQ", body: "Dappled afternoon light through turning leaves on a narrow trail.", thumbnailUrl: "https://picsum.photos/seed/uns05/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns05/1080/720", providerName: "Unsplash" },
  { title: "Rooftop Pool — Dubai Skyline", link: "https://unsplash.com/photos/rooftop-pool-dubai-skyline-bvS7DUnoPA4", body: "Infinity edge pool reflecting city towers at blue hour.", thumbnailUrl: "https://picsum.photos/seed/uns06/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns06/1080/720", providerName: "Unsplash" },
  { title: "Weathered Wood — Texture Study", link: "https://unsplash.com/photos/weathered-wood-texture-study-LKAMlMaTa6I", body: "Close-up macro of grain and weathering in reclaimed timber.", thumbnailUrl: "https://picsum.photos/seed/uns07/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns07/1080/720", providerName: "Unsplash" },
  { title: "Candid Portrait — Farmer's Market", link: "https://unsplash.com/photos/candid-portrait-farmers-market-NMk1Vggt2hg", body: "Natural light portrait of a vendor in warm afternoon glow.", thumbnailUrl: "https://picsum.photos/seed/uns08/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns08/1080/720", providerName: "Unsplash" },
  { title: "City at Night — Rain Reflections", link: "https://unsplash.com/photos/city-at-night-rain-reflections-EiF5_QnDbbI", body: "Neon reflections on wet asphalt in a rainy city intersection.", thumbnailUrl: "https://picsum.photos/seed/uns09/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns09/1080/720", providerName: "Unsplash" },
  { title: "Greenhouse Interior — Tropical Plants", link: "https://unsplash.com/photos/greenhouse-interior-tropical-plants-WtIfDKtkwSs", body: "Lush interior of a Victorian-style greenhouse with fern fronds.", thumbnailUrl: "https://picsum.photos/seed/uns10/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns10/1080/720", providerName: "Unsplash" },
  { title: "Desert Sunrise — Sahara Sand Ripples", link: "https://unsplash.com/photos/desert-sunrise-sahara-sand-ripples-K4Zr8bMLMOo", body: "Raking light on wind-formed dune ripples at Erg Chebbi.", thumbnailUrl: "https://picsum.photos/seed/uns11/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns11/1080/720", providerName: "Unsplash" },
  { title: "Library Interior — Reading Room", link: "https://unsplash.com/photos/library-interior-reading-room-s9CC2SKySJM", body: "High-ceilinged reading room with natural light and dark oak stacks.", thumbnailUrl: "https://picsum.photos/seed/uns12/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns12/1080/720", providerName: "Unsplash" },
  { title: "Snowy Cabin — Nordic Wilderness", link: "https://unsplash.com/photos/snowy-cabin-nordic-wilderness-h7R5xNkmgN8", body: "Smoke rising from a red cabin amid a white birch forest.", thumbnailUrl: "https://picsum.photos/seed/uns13/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns13/1080/720", providerName: "Unsplash" },
  { title: "Kayaking — Sea Caves at Low Tide", link: "https://unsplash.com/photos/kayaking-sea-caves-low-tide-4d1vBbVWyiU", body: "Sea kayak entering a turquoise-lit coastal cave at tide drop.", thumbnailUrl: "https://picsum.photos/seed/uns14/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns14/1080/720", providerName: "Unsplash" },
  { title: "Birds Eye — Aerial Rice Terraces", link: "https://unsplash.com/photos/birds-eye-aerial-rice-terraces-8fSH5Hs9EHM", body: "Geometric green terrace steps carved into a Philippine mountainside.", thumbnailUrl: "https://picsum.photos/seed/uns15/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns15/1080/720", providerName: "Unsplash" },
  { title: "Coffee Close-Up — Espresso Pour", link: "https://unsplash.com/photos/coffee-close-up-espresso-pour-jNhwNMSBpOE", body: "Macro extraction of a naked portafilter shot under controlled light.", thumbnailUrl: "https://picsum.photos/seed/uns16/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns16/1080/720", providerName: "Unsplash" },
  { title: "Street Art — Berlin Wall Fragments", link: "https://unsplash.com/photos/street-art-berlin-wall-fragments-r2ohCFfX65M", body: "Layered spray paint and wheat paste on East Side Gallery remnants.", thumbnailUrl: "https://picsum.photos/seed/uns17/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns17/1080/720", providerName: "Unsplash" },
  { title: "Fog Over Harbor — Foghorn Morning", link: "https://unsplash.com/photos/fog-over-harbor-foghorn-morning-7TiSHm40LE4", body: "Fishing boats disappearing into heavy morning fog in a Maine harbor.", thumbnailUrl: "https://picsum.photos/seed/uns18/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns18/1080/720", providerName: "Unsplash" },
  { title: "Motorcycle Journey — Mountain Pass", link: "https://unsplash.com/photos/motorcycle-journey-mountain-pass-9DaOYUYnOls", body: "Lone rider on a switchback road in the Balkans.", thumbnailUrl: "https://picsum.photos/seed/uns19/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns19/1080/720", providerName: "Unsplash" },
  { title: "Apartment Balcony — Urban Garden", link: "https://unsplash.com/photos/apartment-balcony-urban-garden-MJaChQCWUKI", body: "Dense balcony planting in a Paris Haussmann-era building.", thumbnailUrl: "https://picsum.photos/seed/uns20/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns20/1080/720", providerName: "Unsplash" },
  { title: "Frozen Lake — Ice Bubbles", link: "https://unsplash.com/photos/frozen-lake-ice-bubbles-PZCiKQGpxNE", body: "Methane bubbles trapped in crystal-clear ice on a Canadian alpine lake.", thumbnailUrl: "https://picsum.photos/seed/uns21/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns21/1080/720", providerName: "Unsplash" },
  { title: "Wildflower Meadow — Golden Hour", link: "https://unsplash.com/photos/wildflower-meadow-golden-hour-3Yv984bZn3M", body: "Backlit poppy and cornflower meadow with soft lens flare.", thumbnailUrl: "https://picsum.photos/seed/uns22/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns22/1080/720", providerName: "Unsplash" },
  { title: "Roman Forum — Blue Sky Ruins", link: "https://unsplash.com/photos/roman-forum-blue-sky-ruins-mKvFjHPGHm4", body: "Forum columns against a high-contrast blue Roman sky.", thumbnailUrl: "https://picsum.photos/seed/uns23/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns23/1080/720", providerName: "Unsplash" },
  { title: "Mountain Goat — Rocky Ridge", link: "https://unsplash.com/photos/mountain-goat-rocky-ridge-Iu6parQAvAI", body: "Mountain goat silhouetted against a white sky on a talus slope.", thumbnailUrl: "https://picsum.photos/seed/uns24/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns24/1080/720", providerName: "Unsplash" },
  { title: "Waterfall — Seljalandsfoss Iceland", link: "https://unsplash.com/photos/waterfall-seljalandsfoss-iceland-GWqkUMhMTvA", body: "Walk-behind waterfall at golden hour in southern Iceland.", thumbnailUrl: "https://picsum.photos/seed/uns25/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns25/1080/720", providerName: "Unsplash" },
  { title: "Lemon Orchard — Amalfi Terrace", link: "https://unsplash.com/photos/lemon-orchard-amalfi-terrace-6Woj_wozqmA", body: "Terraced lemon trees above the Tyrrhenian sea at Ravello.", thumbnailUrl: "https://picsum.photos/seed/uns26/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns26/1080/720", providerName: "Unsplash" },
  { title: "Spiral Staircase — Vatican Museum", link: "https://unsplash.com/photos/spiral-staircase-vatican-museum-rMHrFM7LsrE", body: "The Bramante spiral staircase from above, classic double helix.", thumbnailUrl: "https://picsum.photos/seed/uns27/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns27/1080/720", providerName: "Unsplash" },
  { title: "Autumn Creek — Maple Reflections", link: "https://unsplash.com/photos/autumn-creek-maple-reflections-Cqe5YX36bkE", body: "Still creek with perfect mirror reflection of red autumn maples.", thumbnailUrl: "https://picsum.photos/seed/uns28/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns28/1080/720", providerName: "Unsplash" },
  { title: "Urban Decay — Detroit Abandoned", link: "https://unsplash.com/photos/urban-decay-detroit-abandoned-MsB_nMWA3Kc", body: "Peeling paint and collapsed ceiling in a derelict Detroit ballroom.", thumbnailUrl: "https://picsum.photos/seed/uns29/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns29/1080/720", providerName: "Unsplash" },
  { title: "Hot Air Balloon — Cappadocia Dawn", link: "https://unsplash.com/photos/hot-air-balloon-cappadocia-dawn-BO73XMr5CsU", body: "Dozen balloons rising over fairy chimney rock formations at first light.", thumbnailUrl: "https://picsum.photos/seed/uns30/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns30/1080/720", providerName: "Unsplash" },
  { title: "Misty Fjord — Geiranger Norway", link: "https://unsplash.com/photos/misty-fjord-geiranger-norway-geiA6KkVEDs", body: "Layered fog in the UNESCO Geirangerfjord from Ørnevegen viewpoint.", thumbnailUrl: "https://picsum.photos/seed/uns31/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns31/1080/720", providerName: "Unsplash" },
  { title: "Minimalist Still Life — Ceramics", link: "https://unsplash.com/photos/minimalist-still-life-ceramics-vUNQaTtZrOY", body: "Warm grey ceramics on linen against a matte white wall.", thumbnailUrl: "https://picsum.photos/seed/uns32/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns32/1080/720", providerName: "Unsplash" },
  { title: "Dawn Mist — Loire Valley Vineyard", link: "https://unsplash.com/photos/dawn-mist-loire-valley-vineyard-iHZhW4hhHqo", body: "Ground mist over château vines in the early morning Loire Valley.", thumbnailUrl: "https://picsum.photos/seed/uns33/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns33/1080/720", providerName: "Unsplash" },
  { title: "Macro — Dewdrops on Spider Web", link: "https://unsplash.com/photos/macro-dewdrops-spider-web-3JYIdNnB5Oo", body: "Morning dew on a garden orb web with natural light refraction.", thumbnailUrl: "https://picsum.photos/seed/uns34/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns34/1080/720", providerName: "Unsplash" },
  { title: "Iceland Black Sand Beach — Reynisfjara", link: "https://unsplash.com/photos/iceland-black-sand-beach-reynisfjara-kCrrUx7US04", body: "Basalt columns and black sand with dramatic Atlantic surf.", thumbnailUrl: "https://picsum.photos/seed/uns35/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns35/1080/720", providerName: "Unsplash" },
  { title: "Lavender Field — Provençal Purple", link: "https://unsplash.com/photos/lavender-field-provencal-purple-mEZ3PoFGs_k", body: "Peak bloom lavender rows at the Plateau de Valensole at sunrise.", thumbnailUrl: "https://picsum.photos/seed/uns36/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns36/1080/720", providerName: "Unsplash" },
  { title: "Tunnel of Trees — Irish Country Road", link: "https://unsplash.com/photos/tunnel-of-trees-irish-country-road-DnBtFBnqlRc", body: "The dark hedges of County Antrim forming a cathedral of branches.", thumbnailUrl: "https://picsum.photos/seed/uns37/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns37/1080/720", providerName: "Unsplash" },
  { title: "Tea Ceremony — Japanese Tatami", link: "https://unsplash.com/photos/tea-ceremony-japanese-tatami-OIoNa3M0lvo", body: "Traditional chado ceremony with powdered matcha and bamboo whisk.", thumbnailUrl: "https://picsum.photos/seed/uns38/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns38/1080/720", providerName: "Unsplash" },
  { title: "Salt Lake — Hexagonal Crust Texture", link: "https://unsplash.com/photos/salt-lake-hexagonal-crust-texture-CmF_5GYc6c0", body: "Perfect hexagonal salt polygons in a Bolivian dry lake at midday.", thumbnailUrl: "https://picsum.photos/seed/uns39/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns39/1080/720", providerName: "Unsplash" },
  { title: "Lighthouse at Storm — Breton Coast", link: "https://unsplash.com/photos/lighthouse-at-storm-breton-coast-8Y2Q7NXMDOU", body: "Atlantic swell crashing over a Finistère lighthouse in a winter gale.", thumbnailUrl: "https://picsum.photos/seed/uns40/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns40/1080/720", providerName: "Unsplash" },
  { title: "Cactus Garden — Tenerife Desert", link: "https://unsplash.com/photos/cactus-garden-tenerife-desert-VjBFWpRdEcY", body: "Canarian cardón cacti in the volcanic landscape of Tenerife south.", thumbnailUrl: "https://picsum.photos/seed/uns41/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns41/1080/720", providerName: "Unsplash" },
  { title: "Cobblestone Street — Old Town Prague", link: "https://unsplash.com/photos/cobblestone-street-old-town-prague-LiqCLYLADSo", body: "Rain-wet cobblestones reflecting lantern light in Staré Město.", thumbnailUrl: "https://picsum.photos/seed/uns42/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns42/1080/720", providerName: "Unsplash" },
  { title: "Bird of Paradise — Tropical Macro", link: "https://unsplash.com/photos/bird-of-paradise-tropical-macro-6ywyo2qtaZ8", body: "Strelitzia flower detail with water droplets and backlight glow.", thumbnailUrl: "https://picsum.photos/seed/uns43/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns43/1080/720", providerName: "Unsplash" },
  { title: "Empty Motorway — Dawn Long Exposure", link: "https://unsplash.com/photos/empty-motorway-dawn-long-exposure-2FlE9XSRE6U", body: "Light trails on an empty motorway during the pre-dawn blue hour.", thumbnailUrl: "https://picsum.photos/seed/uns44/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns44/1080/720", providerName: "Unsplash" },
  { title: "Venice Canal — Gondola Reflection", link: "https://unsplash.com/photos/venice-canal-gondola-reflection-Wpnoqo55b4k", body: "Palazzo reflection in still canal water with a moored gondola.", thumbnailUrl: "https://picsum.photos/seed/uns45/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns45/1080/720", providerName: "Unsplash" },
  { title: "Night Hike — Milky Way Ridge", link: "https://unsplash.com/photos/night-hike-milky-way-ridge-EEBSj7mO2MI", body: "Hiker silhouette on a volcanic ridge with Milky Way above.", thumbnailUrl: "https://picsum.photos/seed/uns46/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns46/1080/720", providerName: "Unsplash" },
  { title: "Studio Still Life — Citrus Slices", link: "https://unsplash.com/photos/studio-still-life-citrus-slices-ror6JuS9jRU", body: "Overhead flat lay of lemon and grapefruit cross-sections on marble.", thumbnailUrl: "https://picsum.photos/seed/uns47/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns47/1080/720", providerName: "Unsplash" },
  { title: "Cliff Walk — Pembrokeshire Coast", link: "https://unsplash.com/photos/cliff-walk-pembrokeshire-coast-DLjQcWa03GY", body: "Walker on headland path with sea pinks and a distant stack.", thumbnailUrl: "https://picsum.photos/seed/uns48/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns48/1080/720", providerName: "Unsplash" },
  { title: "Industrial Chimneys — Power Station", link: "https://unsplash.com/photos/industrial-chimneys-power-station-G_MJ_68wL4A", body: "Cooling tower symmetry at a decommissioned thermal power plant.", thumbnailUrl: "https://picsum.photos/seed/uns49/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns49/1080/720", providerName: "Unsplash" },
  { title: "Orange Grove — Valencia Spain", link: "https://unsplash.com/photos/orange-grove-valencia-spain-2A8IM08WXsI", body: "Laden branches in a Valencia orange grove at harvest time.", thumbnailUrl: "https://picsum.photos/seed/uns50/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns50/1080/720", providerName: "Unsplash" },
  { title: "Stone Arch — Arches National Park", link: "https://unsplash.com/photos/stone-arch-arches-national-park-pHANr-CpbYM", body: "Delicate Arch at sunset with the La Sal Mountains behind.", thumbnailUrl: "https://picsum.photos/seed/uns51/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns51/1080/720", providerName: "Unsplash" },
  { title: "Fishing Pier — Golden Gate Fog", link: "https://unsplash.com/photos/fishing-pier-golden-gate-fog-PqRvLsjD_TU", body: "Fog consuming the Golden Gate Bridge seen from Crissy Field.", thumbnailUrl: "https://picsum.photos/seed/uns52/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns52/1080/720", providerName: "Unsplash" },
  { title: "Gorge — Antelope Canyon Light Beams", link: "https://unsplash.com/photos/gorge-antelope-canyon-light-beams-ToFm1D0jmEs", body: "Shafts of light illuminating the rust-red sandstone walls of Lower Antelope.", thumbnailUrl: "https://picsum.photos/seed/uns53/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns53/1080/720", providerName: "Unsplash" },
  { title: "Mountain Lodge — Log Cabin Interior", link: "https://unsplash.com/photos/mountain-lodge-log-cabin-interior-GdTl4y3FWWM", body: "Firelit interior of a Montanan log cabin with elk antler chandelier.", thumbnailUrl: "https://picsum.photos/seed/uns54/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns54/1080/720", providerName: "Unsplash" },
  { title: "Sea Stack — Oregon Coast", link: "https://unsplash.com/photos/sea-stack-oregon-coast-haC1PQZjH_M", body: "Haystack Rock at low tide with tide pool in the foreground.", thumbnailUrl: "https://picsum.photos/seed/uns55/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns55/1080/720", providerName: "Unsplash" },
  { title: "Cobalt Sky — Santorini Blue Dome", link: "https://unsplash.com/photos/cobalt-sky-santorini-blue-dome-HQLFKhNN76A", body: "Iconic blue-domed church against the Aegean at Oia.", thumbnailUrl: "https://picsum.photos/seed/uns56/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns56/1080/720", providerName: "Unsplash" },
  { title: "Wheat Field — Stormy Sky", link: "https://unsplash.com/photos/wheat-field-stormy-sky-BHd56RZBv8U", body: "Ripe wheat bending in wind under an approaching cumulonimbus.", thumbnailUrl: "https://picsum.photos/seed/uns57/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns57/1080/720", providerName: "Unsplash" },
  { title: "Rope Bridge — Scottish Highlands", link: "https://unsplash.com/photos/rope-bridge-scottish-highlands-6GHXuY26e0k", body: "Carrick-a-Rede rope bridge suspended over a 30-metre coastal chasm.", thumbnailUrl: "https://picsum.photos/seed/uns58/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns58/1080/720", providerName: "Unsplash" },
  { title: "Autumn Vineyard — Chianti Tuscany", link: "https://unsplash.com/photos/autumn-vineyard-chianti-tuscany-F5y80-oqMGA", body: "Russet and amber vine rows in the Chianti Classico zone at harvest.", thumbnailUrl: "https://picsum.photos/seed/uns59/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns59/1080/720", providerName: "Unsplash" },
  { title: "Observatory — Stargazing Telescope", link: "https://unsplash.com/photos/observatory-stargazing-telescope-J28ic7vBFSc", body: "Open dome observatory with telescope silhouetted against the Milky Way.", thumbnailUrl: "https://picsum.photos/seed/uns60/1080/720", profileThumbnailUrl: "https://picsum.photos/seed/uns60/1080/720", providerName: "Unsplash" },
];

// ─── Comment pool ─────────────────────────────────────────────────────────────

const COMMENT_POOL = [
  "The light in this frame is doing everything. Perfect window of timing.",
  "Shot on film or digital? The grain profile looks intentional.",
  "The framing here is perfect — negative space working in exactly the right direction.",
  "What camera and lens for this? The bokeh renders so smoothly.",
  "The color grading gives this such a cinematic quality without screaming preset.",
  "This is what I mean when I say light is everything. The scene is ordinary, the light makes it.",
  "Composition is strong but what really makes it is the decisive moment.",
  "Incredible patience to get this shot. Weather, timing, all of it lined up.",
  "The tonal range from shadow to highlight is impressive — what's the dynamic range of the sensor?",
  "The layer of fog adds so much depth to the mid-ground.",
  "Black and white was the right call. Color would have distracted from the texture.",
  "This is in my top five frames I've seen this year. Printing this reference.",
  "The symmetry here is almost architectural. Deliberately composed or happy accident?",
  "Found this from a repost and immediately saved it as a lighting reference.",
  "The selective focus is working perfectly — sharp where it counts, soft everywhere else.",
  "That leading line draws the eye exactly where it should go before you even notice it.",
  "The scale here is hard to read at first, which makes it land even harder when you figure it out.",
  "This edit style reminds me of Anders Petersen — very intimate and slightly raw.",
  "Documentary photography at its best. No obvious staging, just trust in the moment.",
  "The grain texture gives this such a film look. 35mm or simulation?",
  "I've tried to shoot this type of scene for years. This nails what I was going for.",
  "Strong work. The subject's relationship to the environment tells the whole story.",
  "Five stops of dynamic range blended in post or straight out of camera?",
  "The compression on this telephoto shot is doing a lot of narrative work.",
  "Shot at blue hour or civil twilight? The sky tone is really specific.",
  "The depth of field control here is surgical. What aperture?",
  "This is going into my reference folder. Exactly the mood I want for a project I'm planning.",
  "The reflections add a second layer that I didn't notice on first view. Clever.",
  "Long exposure or fast freeze frame? Hard to tell and that ambiguity is interesting.",
  "The shadow detail here is remarkable. Lifted in processing or retained from RAW?",
  "This captures the feeling of the place better than any wide-angle tourist shot could.",
  "The post-processing is invisible, which means it's very good.",
  "First frame or did you work the scene for a while to get here?",
  "The moment is rare but the composition to receive it is what takes the work.",
  "That texture in the foreground anchors the whole image. Excellent eye.",
  "Really appreciate the restraint here. Most photographers would have cropped tighter.",
  "The low POV changes everything. Same light from standing height would have been ordinary.",
  "This is the shot that justifies waking up at 4am.",
  "The color temperature feels deliberately cool to contrast the warmth of the subject.",
  "Spot metering on the face or evaluative? The exposure is perfect given the backlight."
];

const REPLY_POOL = [
  "Agreed — the timing here is what separates it from 100 similar compositions.",
  "Shot on digital but the grain is added in Lightroom with the film emulation panel.",
  "Sony A7 IV with a vintage Canon 85mm f/1.2 on an adapter. Combination is magic.",
  "Yes, deliberately composed. Spent about 45 minutes adjusting the angle and waiting.",
  "The long exposure was 25 seconds at f/11 with a 6-stop ND to hold back the sky.",
  "It's all natural light. North-facing window at around 2pm in winter gives that cool tone.",
  "The fog came in overnight and was gone by 8am. Pure luck to be there at the right time.",
  "A3 matte print is the way to go with this palette — the tones will hold without gloss glare.",
  "First attempt actually. I was set up for something else and this presented itself.",
  "Spot metering on the brightest highlight, then dialed back 2/3 of a stop.",
  "Fuji film simulations — this is Classic Chrome with a custom starting point.",
  "Yeah the f/1.4 compression gives that quality. Anything stopped down loses the character.",
  "Blue hour, about 20 minutes after sunset. The window is only about 8 minutes wide.",
  "The reflection was pure chance. The light shifted exactly right when I crouched down.",
  "Shooting handheld at 1/15s. Image stabilization has changed what's possible in low light."
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const devUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.email, DEV_EMAILS));

  if (devUsers.length === 0) {
    throw new Error("No dev users found. Run `npm run seed:dev` first.");
  }

  console.log(`Found ${devUsers.length} dev users.`);

  const allPostSeeds = [
    ...BEHANCE_POSTS,
    ...PINTEREST_POSTS,
    ...DRIBBBLE_POSTS,
    ...UNSPLASH_POSTS,
  ];

  console.log(`\nSeeding ${allPostSeeds.length} posts across 4 providers...\n`);

  const insertedPostIds: string[] = [];
  let skipped = 0;

  for (let i = 0; i < allPostSeeds.length; i++) {
    const seed = allPostSeeds[i]!;
    const author = devUsers[i % devUsers.length]!;
    const now = new Date(Date.now() - i * 120_000);

    const [inserted] = await db
      .insert(posts)
      .values({
        userId: author.id,
        title: seed.title,
        link: seed.link,
        body: seed.body,
        thumbnailUrl: seed.thumbnailUrl,
        profileThumbnailUrl: seed.profileThumbnailUrl,
        providerName: seed.providerName,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: posts.link,
        set: {
          title: seed.title,
          thumbnailUrl: seed.thumbnailUrl,
          profileThumbnailUrl: seed.profileThumbnailUrl,
          updatedAt: now
        }
      })
      .returning({ id: posts.id });

    if (inserted) {
      insertedPostIds.push(inserted.id);
      console.log(`  [${String(i + 1).padStart(3)}/${allPostSeeds.length}] ${seed.providerName.padEnd(20)} ${seed.title.slice(0, 50)}`);
    } else {
      skipped += 1;
    }
  }

  console.log(`\nPosts done: ${insertedPostIds.length} upserted, ${skipped} skipped.\n`);

  let totalComments = 0;
  let totalReplies = 0;

  for (let postIdx = 0; postIdx < insertedPostIds.length; postIdx++) {
    const postId = insertedPostIds[postIdx]!;

    const commentCount = 2 + (postIdx % 4);
    const rootCommentIds: string[] = [];

    for (let c = 0; c < commentCount; c++) {
      const commentText = COMMENT_POOL[(postIdx * 7 + c * 3 + 11) % COMMENT_POOL.length]!;
      const commenter = devUsers[(postIdx * 3 + c * 5 + 2) % devUsers.length]!;

      const [rootComment] = await db
        .insert(comments)
        .values({
          postId,
          userId: commenter.id,
          body: commentText,
          parentId: null,
          replyToUserName: null
        })
        .returning({ id: comments.id });

      rootCommentIds.push(rootComment!.id);
      totalComments += 1;

      await db.execute(
        sql`UPDATE ${posts} SET comments_count = comments_count + 1 WHERE id = ${postId}`
      );
    }

    if (postIdx % 3 === 0 && rootCommentIds.length > 0) {
      const replyCount = 1 + (postIdx % 2);
      const parentId = rootCommentIds[0]!;
      const parentUser = devUsers[(postIdx * 3 + 2) % devUsers.length]!;

      for (let r = 0; r < replyCount; r++) {
        const replyText = REPLY_POOL[(postIdx * 5 + r * 7 + 3) % REPLY_POOL.length]!;
        const replier = devUsers[(postIdx * 11 + r * 3 + 7) % devUsers.length]!;

        await db.insert(comments).values({
          postId,
          userId: replier.id,
          body: replyText,
          parentId,
          replyToUserName: parentUser.name ?? "user"
        });

        await db.execute(
          sql`UPDATE ${comments} SET reply_count = reply_count + 1 WHERE id = ${parentId}`
        );

        totalReplies += 1;
      }
    }
  }

  console.log(`Comments done: ${totalComments} root, ${totalReplies} replies.`);
  console.log("\nGallery seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => client.end());
