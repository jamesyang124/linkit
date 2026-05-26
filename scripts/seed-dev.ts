/**
 * Development seed: wipes all tables and inserts realistic fixture data.
 * Usage: DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit tsx scripts/seed-dev.ts
 */

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/src/db/schema";

const { users, posts, comments, accounts, sessions, verificationTokens } = schema;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

const PASSWORD_HASH = await bcrypt.hash("p@ssw0rd2004", 12);

// ─── Users ────────────────────────────────────────────────────────────────────

const USERS = [
  { name: "Mia Chen",     email: "mia@dev.local" },
  { name: "Ravi Patel",   email: "ravi@dev.local" },
  { name: "Sofía Ruiz",   email: "sofia@dev.local" },
  { name: "James Park",   email: "james@dev.local" },
  { name: "Lena Müller",  email: "lena@dev.local" },
  { name: "Kofi Asante",  email: "kofi@dev.local" },
  { name: "Yuki Tanaka",  email: "yuki@dev.local" },
  { name: "Omar Hassan",  email: "omar@dev.local" },
  { name: "Priya Sharma", email: "priya@dev.local" },
  { name: "Lukas Braun",  email: "lukas@dev.local" },
];

// ─── Posts ────────────────────────────────────────────────────────────────────

const POSTS = [
  {
    title: "The New Rules of Typography in 2025",
    link: "https://typography.io/new-rules-2025",
    providerName: "Typography.io",
    thumbnailUrl: "https://picsum.photos/seed/type01/800/600",
    profileThumbnailUrl: "https://picsum.photos/seed/type01/900/1200",
    body: "Variable fonts, optical sizing, and the return of editorial serif."
  },
  {
    title: "Designing for Calm: Reducing Cognitive Load",
    link: "https://uxdesign.cc/designing-for-calm",
    providerName: "UX Design",
    thumbnailUrl: "https://picsum.photos/seed/calm02/800/600",
    profileThumbnailUrl: "https://picsum.photos/seed/calm02/900/1200",
    body: "Why less friction means more trust, and how to get there."
  },
  {
    title: "React Server Components Are Not a Silver Bullet",
    link: "https://overreacted.io/rsc-not-silver-bullet",
    providerName: "Overreacted",
    thumbnailUrl: "https://picsum.photos/seed/rsc03/800/600",
    profileThumbnailUrl: "https://picsum.photos/seed/rsc03/900/1200",
    body: "Understanding where RSC helps and where it adds accidental complexity."
  },
  {
    title: "Brutalism is Back and It's Beautiful",
    link: "https://brutalistwebsites.com/2025-revival",
    providerName: "Brutalist Websites",
    thumbnailUrl: "https://picsum.photos/seed/brut04/800/600",
    profileThumbnailUrl: "https://picsum.photos/seed/brut04/900/1200",
    body: "Raw HTML aesthetics collide with contemporary brand strategy."
  },
  {
    title: "Color Theory in the Age of Dark Mode",
    link: "https://spectrum.adobe.com/dark-mode-color-theory",
    providerName: "Adobe Spectrum",
    thumbnailUrl: "https://picsum.photos/seed/color05/800/600",
    profileThumbnailUrl: "https://picsum.photos/seed/color05/900/1200",
    body: "Rethinking hue, contrast, and saturation when light is inverted."
  },
  {
    title: "The Quiet Grid: Swiss Design Principles for the Web",
    link: "https://smashingmagazine.com/swiss-design-web",
    providerName: "Smashing Magazine",
    thumbnailUrl: "https://picsum.photos/seed/swiss06/800/600",
    profileThumbnailUrl: "https://picsum.photos/seed/swiss06/900/1200",
    body: "Helvetica, baselines, and the grid as a moral framework."
  },
];

// ─── Comments ─────────────────────────────────────────────────────────────────

const COMMENT_THREADS: Record<number, { body: string; replies?: { body: string; replyToIdx: number }[] }[]> = {
  0: [ // Typography post
    {
      body: "The section on variable fonts is spot on. We switched our design system to one variable font last year and never looked back.",
      replies: [
        { body: "Which variable font? We're evaluating Fraunces vs. Recursive right now.", replyToIdx: 0 },
        { body: "Recursive is wild for code, but Fraunces has that editorial warmth. Depends on the brand.", replyToIdx: 1 },
        { body: "We ended up with Inter Variable for UI and Source Serif 4 for editorial. Different tools.", replyToIdx: 0 },
        { body: "Source Serif 4 is underrated. Optical sizing at small scales is genuinely impressive.", replyToIdx: 3 },
      ]
    },
    { body: "Optical sizing is the hidden gem here. Most devs still hardcode font-size and wonder why it looks wrong at 12px." },
    {
      body: "The 'return of editorial serif' section feels like recency bias. Serifs never really left print design.",
      replies: [
        { body: "True for print, but on the web? Serifs were considered hard to render until Retina displays.", replyToIdx: 2 },
        { body: "And now we're back full circle. The article is specifically about web typography.", replyToIdx: 1 },
        { body: "Fair clarification. The retina point is what made the shift possible.", replyToIdx: 1 },
      ]
    },
    { body: "Saved this. Going to share with our entire design team tomorrow morning." },
    { body: "The contrast ratio recommendations are well-sourced. WCAG 3.0's APCA algorithm is still not widely understood." },
    { body: "I wish they'd addressed CJK typography. The rules are completely different and Western-centric articles always skip it." },
    { body: "Really liked the letter-spacing section. 0.04em on all-caps labels is such a small thing but makes a huge difference." },
  ],
  1: [ // Calm design post
    {
      body: "This is essentially the Calm Technology principles from Amber Case's book, updated for mobile-first reality.",
      replies: [
        { body: "Came here to mention that exact book. Great companion read.", replyToIdx: 0 },
        { body: "Yes, but the section on notification fatigue adds something new. Amber's book predates that era.", replyToIdx: 0 },
        { body: "Good point. The smartphone notification landscape was completely different in 2015.", replyToIdx: 1 },
        { body: "Anyone know if Amber Case has responded to this piece?", replyToIdx: 0 },
        { body: "She retweeted it so I'd assume she's on board with the framing.", replyToIdx: 3 },
      ]
    },
    { body: "The friction taxonomy in section 3 is going straight into our design review checklist." },
    { body: "Hard disagree on the confirmation dialogs point. Sometimes friction is exactly the right choice." },
    {
      body: "The research citations are solid. Good to see this backed by actual studies rather than vibes.",
      replies: [
        { body: "Agreed. Too many UX hot takes are just opinion dressed as principle.", replyToIdx: 3 },
        { body: "The Nielsen Norman study they cite is from 2021 though. Digital habits shifted again post-pandemic.", replyToIdx: 3 },
      ]
    },
    { body: "Applied the 'necessary interruptions' framework to our onboarding last sprint. Churn dropped noticeably." },
    { body: "Quiet and calm design is great until stakeholders demand an engagement metric and then everything gets a badge." },
    { body: "The skeleton screen vs. spinner debate at the end is settled imo. Skeletons win every time for perceived performance." },
    { body: "Bookmarked. Perfect ammo for the next meeting where someone wants to add another toast notification." },
  ],
  2: [ // RSC post
    {
      body: "This is the most honest take on RSC I've read. The DX overhead is real and the community pretends it isn't.",
      replies: [
        { body: "Totally agree. The mental model split between server and client is genuinely hard to communicate to new engineers.", replyToIdx: 0 },
        { body: "It's not that hard once you internalize it but there's no shortcut to that moment. Takes a week at least.", replyToIdx: 1 },
        { body: "A week is optimistic for someone coming from a non-React background.", replyToIdx: 1 },
        { body: "Fair. I was thinking of mid-senior React devs. Beginners hit a wall faster.", replyToIdx: 2 },
      ]
    },
    {
      body: "The 'waterfall vs. parallel fetch' comparison table is the best explanation I've seen of when RSC actually wins.",
      replies: [
        { body: "Agreed. The N+1 fetch problem at the component level is where RSC shines brightest.", replyToIdx: 0 },
        { body: "I wish Next.js documented this better instead of just saying 'fetch in Server Components'.", replyToIdx: 0 },
        { body: "The Next.js docs have gotten much better but examples still feel toy-ish.", replyToIdx: 1 },
      ]
    },
    { body: "Sharing this with anyone who says 'just use RSC for everything' in our next architecture review." },
    { body: "The part about streaming is undersold here. RSC + Suspense streaming is genuinely transformative for TTFB." },
    { body: "I appreciate the nuance. The React team deserves credit for solving a hard problem even if the solution is complex." },
    { body: "We evaluated RSC for 6 months and ultimately moved back to a simpler SPA with a separate API. Not every app benefits." },
    { body: "The authentication boundary section is critical and people skip it. Secure-by-default is not automatic with RSC." },
    { body: "Came here after the Theo rant on Twitter. This is the calm, evidence-based version of that same argument." },
  ],
  3: [ // Brutalism post
    { body: "The Cargo.site explosion definitely contributed to this revival. Easy to make 'brutalist' with their editor." },
    {
      body: "Brutalism as a brand choice still feels like a contradiction. Brutalism was about honesty; using it for marketing isn't honest.",
      replies: [
        { body: "Neo-brutalism vs. original brutalism. The aesthetic got decoupled from the ideology.", replyToIdx: 1 },
        { body: "Which is fine? Design movements always get recontextualized. Memphis furniture isn't radical now either.", replyToIdx: 1 },
        { body: "True but worth naming the distinction rather than collapsing them under the same word.", replyToIdx: 0 },
        { body: "The article actually covers this in the footnotes. They acknowledge the historical tension.", replyToIdx: 0 },
      ]
    },
    { body: "I love it but my clients hate it. The tension between designer taste and market readiness is real." },
    { body: "The Figma community templates are already flooding with 'brutalist UI kits'. It peaked." },
    {
      body: "Is there a good resource for brutal typography specifically? Most examples I see are layout-first.",
      replies: [
        { body: "Newwork Magazine does incredible things with brutal type. Their PDFs are worth downloading.", replyToIdx: 4 },
        { body: "Also check out Europa type foundry's specimen work. Very raw editorial sensibility.", replyToIdx: 4 },
      ]
    },
    { body: "The B&W examples in this article are more convincing than the color ones. Color bruatalism is an oxymoron to me." },
    { body: "Added the linked sites to my swipe file. The Warehouse example is particularly strong." },
  ],
  4: [ // Color theory post
    {
      body: "The HSLuv color space recommendation is underrated. Perceptually uniform and dark-mode friendly.",
      replies: [
        { body: "We use OKLCH now. Same perceptual uniformity idea but with better tooling in CSS.", replyToIdx: 0 },
        { body: "CSS color-mix() with oklch just changed everything for us. No more manual dark variants.", replyToIdx: 1 },
        { body: "Is color-mix() production-safe? I see it in Chrome but Safari support?", replyToIdx: 1 },
        { body: "Safari 16.2+. Should be fine unless you're supporting iOS 15 which most aren't anymore.", replyToIdx: 2 },
        { body: "Good to know. Will propose this at our next design systems meeting.", replyToIdx: 3 },
      ]
    },
    { body: "The section on saturation compression for dark mode is exactly why most dark modes look grey and lifeless. Needed to read this." },
    {
      body: "Figma's new dark mode variables support makes implementing this much more tractable than it used to be.",
      replies: [
        { body: "Still requires discipline though. Variables make the mechanism easier, not the decisions easier.", replyToIdx: 2 },
        { body: "100%. The tool doesn't tell you what the right palette decisions are. That's still design work.", replyToIdx: 1 },
      ]
    },
    { body: "Saving the chroma curve charts. Going to use them to educate our PMs on why our dark mode needs a dedicated pass." },
    { body: "The contrast ratio discussion needs a follow-up for APCA vs. WCAG 2.1. They sometimes give opposite answers." },
    { body: "This would have saved me 3 weeks of work 2 years ago when we first shipped our dark mode. Painful lessons." },
    { body: "The Stripe and Linear case studies are what made this click for me. Real examples > abstract principles." },
    { body: "I expected the usual basics but the temporal perception angle was completely new to me. Great piece." },
  ],
  5: [ // Swiss design post
    { body: "The example comparing old NYT grid to current nytimes.com is perfect. They held on to the principles even as the medium changed." },
    {
      body: "The 'grid as moral framework' framing is provocative but earned. Müller-Brockmann really did believe this.",
      replies: [
        { body: "And it shows in his work. There's a legibility ethic baked into Swiss design that most modern design doesn't have.", replyToIdx: 0 },
        { body: "Though some would argue the rigidity became its own problem. Post-Swiss movements were reacting against that.", replyToIdx: 0 },
        { body: "Exactly. Grunge typography in the 90s was a direct rejection of that moral certainty.", replyToIdx: 1 },
        { body: "Full circle again. We're back to the grid because chaos got exhausting.", replyToIdx: 2 },
      ]
    },
    { body: "The responsive grid section translates the 12-column convention back to its Swiss origins nicely." },
    {
      body: "I teach design and this is going into my syllabus immediately. Clean, cited, historically honest.",
      replies: [
        { body: "What level do you teach? Curious how much Müller-Brockmann students are expected to know.", replyToIdx: 3 },
        { body: "Graduate level. Undergrads get the 12-column grid first, then we trace it back to the source.", replyToIdx: 3 },
        { body: "That sequencing makes sense. Rules before the reasons.", replyToIdx: 4 },
      ]
    },
    { body: "The Helvetica section is brief but accurate. I'd love a deeper dive on what neutrality actually means in typeface choice." },
    { body: "Going to print the baseline grid comparison and put it on the studio wall. Perfect reference material." },
    { body: "Loved that they brought in Josef Müller-Brockmann's own quotes. Primary sources over paraphrase." },
  ],
};

// ─── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  console.log("Truncating all tables…");

  await db.execute(sql`
    TRUNCATE TABLE
      ${sql.identifier("comments")},
      ${sql.identifier("posts")},
      ${sql.identifier("accounts")},
      ${sql.identifier("sessions")},
      ${sql.identifier("verification_tokens")},
      ${sql.identifier("users")}
    RESTART IDENTITY CASCADE
  `);

  console.log("Creating users…");

  const createdUsers = await db
    .insert(users)
    .values(
      USERS.map((u) => ({
        email: u.email,
        name: u.name,
        passwordHash: PASSWORD_HASH,
      }))
    )
    .returning();

  console.log(`  ${createdUsers.length} users created`);

  console.log("Creating posts…");

  const createdPosts: (typeof posts.$inferSelect)[] = [];
  for (let i = 0; i < POSTS.length; i++) {
    const postData = POSTS[i];
    const author = createdUsers[i % createdUsers.length];
    const [post] = await db
      .insert(posts)
      .values({
        userId: author.id,
        title: postData.title,
        link: postData.link,
        body: postData.body,
        thumbnailUrl: postData.thumbnailUrl,
        profileThumbnailUrl: postData.profileThumbnailUrl,
        providerName: postData.providerName,
      })
      .returning();
    createdPosts.push(post);
    console.log(`  [${i + 1}] ${postData.title.slice(0, 50)}…`);
  }

  console.log("Creating comments and replies…");

  let totalComments = 0;
  let totalReplies = 0;

  for (let postIdx = 0; postIdx < createdPosts.length; postIdx++) {
    const post = createdPosts[postIdx];
    const threads = COMMENT_THREADS[postIdx] ?? [];

    for (let threadIdx = 0; threadIdx < threads.length; threadIdx++) {
      const thread = threads[threadIdx];
      const commentAuthor = createdUsers[(postIdx * 3 + threadIdx + 2) % createdUsers.length];

      const [rootComment] = await db
        .insert(comments)
        .values({
          postId: post.id,
          userId: commentAuthor.id,
          body: thread.body,
          parentId: null,
          replyToUserName: null,
        })
        .returning();

      totalComments++;

      if (thread.replies && thread.replies.length > 0) {
        const replyAuthors: string[] = [commentAuthor.name ?? "user"];
        for (let replyIdx = 0; replyIdx < thread.replies.length; replyIdx++) {
          const reply = thread.replies[replyIdx];
          const replyAuthor = createdUsers[(postIdx * 7 + threadIdx * 3 + replyIdx + 5) % createdUsers.length];
          const replyToName = replyAuthors[reply.replyToIdx] ?? replyAuthors[0];

          await db.insert(comments).values({
            postId: post.id,
            userId: replyAuthor.id,
            body: reply.body,
            parentId: rootComment.id,
            replyToUserName: replyToName,
          });

          replyAuthors.push(replyAuthor.name ?? "user");

          // Increment replyCount on root comment
          await db
            .execute(sql`UPDATE ${comments} SET reply_count = reply_count + 1 WHERE id = ${rootComment.id}`);

          totalReplies++;
        }
      }

      // Increment post commentsCount for every top-level comment
      await db
        .execute(sql`UPDATE ${posts} SET comments_count = comments_count + 1 WHERE id = ${post.id}`);
    }
  }

  console.log(`  ${totalComments} root comments, ${totalReplies} replies created`);
  console.log("\nDone. Dev seed complete.");

  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
