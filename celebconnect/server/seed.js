// Seeds the database with FICTIONAL celebrity personas (not real public figures),
// their posts, and realistic volumes of comments/reactions so the feed feels alive.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { randomUUID: uuid } = require('node:crypto');
const db = require('./db');

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function daysAgoISO(days, hourJitter = 12) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(rand(0, 23), rand(0, 59), rand(0, 59));
  return d.toISOString();
}

const CELEBRITIES = [
  { name: 'Nova Reyes', handle: 'novareyes', category: 'Music', bio: 'Pop singer-songwriter. 4x chart-topping albums. Coffee addict.', followers: 68_000_000 },
  { name: 'Jax Calloway', handle: 'jaxcalloway', category: 'Film & TV', bio: 'Actor. Sci-fi trilogy lead. Dog dad to two huskies.', followers: 41_000_000 },
  { name: 'Priya Anand-Osei', handle: 'priyaao', category: 'Film & TV', bio: 'Actress & producer. Award-winning drama series creator.', followers: 33_500_000 },
  { name: 'Marcus "Blaze" Thompson', handle: 'blazethompson', category: 'Sports', bio: 'Point guard. Three-time league MVP. Sneakerhead.', followers: 55_200_000 },
  { name: 'Lena Kowalski', handle: 'lenakowalski', category: 'Comedy', bio: 'Stand-up comedian. Sold-out world tour. I say what you\'re thinking.', followers: 18_900_000 },
  { name: 'Diego Fuentes', handle: 'diegofuentes', category: 'Sports', bio: 'Forward. Captain. Two-time golden boot winner.', followers: 92_000_000 },
  { name: 'Amara Chukwu', handle: 'amarachukwu', category: 'Music', bio: 'R&B vocalist. Grammy nominee. New album out now.', followers: 27_300_000 },
  { name: 'Skylar Vance', handle: 'skylarvance', category: 'Internet', bio: 'Creator. Vlogs, pranks, and way too much coffee.', followers: 14_600_000 },
  { name: 'Theo Bergström', handle: 'theobergstrom', category: 'Film & TV', bio: 'Director & actor. Three-time festival winner.', followers: 9_800_000 },
  { name: 'Ruby Sinclair', handle: 'rubysinclair', category: 'Music', bio: 'Country singer. Storyteller. Boots always on.', followers: 21_400_000 },
  { name: 'Kenji Watanabe', handle: 'kenjiwatanabe', category: 'Internet', bio: 'Pro gamer turned streamer. World champion, Rift Legends.', followers: 12_100_000 },
  { name: 'Zara Malik', handle: 'zaramalik', category: 'Fashion', bio: 'Designer. Creative director. Runway to street.', followers: 30_700_000 },
  { name: 'Odell Brooks', handle: 'odellbrooks', category: 'Sports', bio: 'Wide receiver. Two-time champion. Family first.', followers: 24_800_000 },
  { name: 'Ivy Chen', handle: 'ivychen', category: 'Music', bio: 'Actress & singer. Double threat. New single every month.', followers: 46_900_000 },
  { name: 'Dmitri Volkov', handle: 'dmitrivolkov', category: 'Sports', bio: 'Grandmaster. World chess champion. Now on TV.', followers: 8_400_000 },
  { name: 'Bianca Rossi', handle: 'biancarossi', category: 'Comedy', bio: 'Comedian & actress. Sketch show creator. Chaotic good.', followers: 16_200_000 },
  { name: 'Nate Okafor', handle: 'nateokafor', category: 'Music', bio: 'Rapper. Producer. Independent label founder.', followers: 38_500_000 },
  { name: 'Selene Marchetti', handle: 'selenemarchetti', category: 'Music', bio: 'Pop star. Stadium tours. Cat mom.', followers: 71_200_000 },
  { name: 'Cole Ashford', handle: 'coleashford', category: 'Film & TV', bio: 'Actor. Superhero franchise lead. Coffee shop regular.', followers: 58_300_000 },
  { name: 'Harper Quinn', handle: 'harperquinn', category: 'Comedy', bio: 'Late-night talk show host. Ask me anything.', followers: 19_700_000 },
];

const POST_TEMPLATES = {
  Music: [
    'Just dropped the music video for my new single 🎶 link in bio, go watch it now!!',
    'Studio session ran until 3am but we got something special 🔥 can\'t wait for you all to hear this',
    'TOUR DATES ARE LIVE 🎤 who\'s coming to see me this summer?',
    'Rehearsals for the awards show performance are going so well, I\'m nervous and excited lol',
    'Thank you for streaming the album a million times this week, I\'m literally crying',
    'Little acoustic version of the new song for you today 🎸',
  ],
  'Film & TV': [
    'IT\'S OFFICIAL. Season 2 has been greenlit! Thank you for the love on this show 🎬',
    'First look at my character for the new film drops next week, get ready',
    'Wrapped filming today after 4 months. Gonna miss this cast so much 😭',
    'Table read for the new script was incredible, this one\'s going to be special',
    'Premiere night! Thank you to everyone who came out, love you all ❤️',
    'Behind the scenes chaos from set today, we could not stop laughing lol',
  ],
  Sports: [
    'WHAT A GAME. Thank you to the fans, you carried us tonight 🏆',
    'Back in the gym at 5am, championship don\'t come easy 💪',
    'Proud of this team. Proud of this city. Let\'s keep going.',
    'Signed autographs for 2 hours after the game and would do it again in a heartbeat',
    'That last-second shot still doesn\'t feel real. Let\'s gooo!!',
    'Recovery day. Ice bath, film review, and rest. Big game this weekend 👀',
  ],
  Comedy: [
    'New special is officially out, go stream it and tell your friends lol',
    'Bombed so hard at an open mic in college and now I sell out arenas, life is wild',
    'POV: you\'re backstage right before a show and your mic pack won\'t stop beeping lol',
    'Wrote a whole new bit in the green room tonight, testing it out this weekend',
    'The crowd tonight was UNREAL, thank you for laughing at my nonsense',
    'Someone in the front row heckled me and honestly they were kind of right lol',
  ],
  Internet: [
    'New video is up!! this one got way more chaotic than planned lol',
    'We hit a huge subscriber milestone today, thank you all so much 🥹',
    'Behind the scenes of today\'s upload, this took way longer than it should have',
    'Livestream tonight at 8pm, bring snacks, we\'re doing a huge Q&A',
    'Collab video dropping this week and it might be the funniest thing I\'ve ever filmed',
    'Can\'t believe this many of you showed up to the meetup today, love this community',
  ],
  Fashion: [
    'New collection just hit the runway and I am SHAKING, thank you for the love 👗',
    'Fitting room chaos before the show today, so many pieces almost didn\'t make it lol',
    'This look took 340 hours to make by hand. Worth every second.',
    'Front row was full of legends tonight, what a show',
    'Sketching the next collection at 2am because the ideas won\'t stop coming',
    'So honored to be dressing icons this awards season 🖤',
  ],
};

const FAN_FIRST = ['Alex','Jordan','Taylor','Sam','Casey','Riley','Morgan','Jamie','Avery','Quinn','Drew','Skyler','Reese','Rowan','Emerson','Kendall','Peyton','Hayden','Marley','Elliot','Priya','Mateo','Aisha','Noah','Liam','Mia','Sofia','Lucas','Zoe','Ethan','Grace','Leo','Chloe','Mason','Ava','Kai','Nina','Omar','Farah','Yusuf'];
const FAN_LAST = ['Rivera','Chen','Patel','Nguyen','Smith','Garcia','Kim','Johnson','Brown','Okafor','Silva','Novak','Haddad','Meyer','Rossi','Larsen','Cohen','Diaz','Park','Wallace'];
const COMMENT_TEMPLATES = [
  'omg I\'ve been waiting for this all week!! 😭',
  'lol you never disappoint',
  'this is EVERYTHING 🔥🔥🔥',
  'no because I screamed when I saw this lol',
  'take my money right now',
  'crying actual tears rn 🥹',
  'I need this on repeat immediately',
  'the way I gasped omg',
  'you really said "let them eat greatness" lol',
  'STOP this is too good',
  'been a fan since day one, so proud of you 💗',
  'lmaooo I can\'t with this',
  'this made my whole week honestly',
  'okay but the effort that went into this?? incredible',
  'not me refreshing the page every 5 minutes lol',
  'we do NOT deserve you',
  'I\'m obsessed, no notes',
  'saving this to watch again later',
  'the talent is unreal, congrats!!',
  'lol I sent this to literally everyone I know',
  'first!! love you so much',
  'this is why you\'re the goat',
  'I was NOT ready for this today',
  'the standard has been set 👏',
  'my heart cannot take this lol',
];

function makeAvatar(seed) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function seedFan() {
  const name = `${pick(FAN_FIRST)} ${pick(FAN_LAST)}`;
  return { name, avatar: makeAvatar(name + rand(1, 99999)) };
}

function run() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM celebrities').get();
  if (existing.c > 0) {
    console.log('Database already seeded (', existing.c, 'celebrities ). Skipping. Delete data/celebconnect.sqlite to reseed.');
    seedAdmin();
    db.close();
    return;
  }

  const insertCeleb = db.prepare(`INSERT INTO celebrities
    (id, name, handle, category, avatar_url, cover_url, bio, verified, followers, created_at)
    VALUES (?,?,?,?,?,?,?,1,?,?)`);
  const insertPost = db.prepare(`INSERT INTO posts
    (id, celebrity_id, content, image_url, created_at, seed_like, seed_love, seed_haha, seed_wow, seed_sad, seed_angry)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insertComment = db.prepare(`INSERT INTO comments
    (id, post_id, author_id, author_name, author_avatar, body, voice_url, voice_duration, created_at)
    VALUES (?,?,?,?,?,?,NULL,NULL,?)`);

  console.log('Seeding', CELEBRITIES.length, 'celebrities...');

  db.exec('BEGIN');
  let totalPosts = 0;
  let totalComments = 0;
  let viralPostsRemaining = 8; // spread a handful of high-volume "thousands of comments" posts

  for (const c of CELEBRITIES) {
    const celebId = uuid();
    insertCeleb.run(
      celebId, c.name, c.handle, c.category,
      makeAvatar(c.handle), '', c.bio, c.followers,
      daysAgoISO(rand(400, 1200))
    );

    const templates = POST_TEMPLATES[c.category];
    const postCount = rand(5, 8);
    const usedDays = new Set();
    for (let i = 0; i < postCount; i++) {
      let daysAgo;
      do { daysAgo = rand(0, 45); } while (usedDays.has(daysAgo));
      usedDays.add(daysAgo);

      const postId = uuid();
      const content = pick(templates);
      const engagementFactor = Math.random() * 0.02 + 0.003; // 0.3%-2.3% of followers react
      const seedLike = Math.round(c.followers * engagementFactor);
      const seedLove = Math.round(seedLike * (0.2 + Math.random() * 0.3));
      const seedHaha = Math.round(seedLike * (0.05 + Math.random() * 0.25));
      const seedWow = Math.round(seedLike * (0.03 + Math.random() * 0.1));
      const seedSad = Math.round(seedLike * Math.random() * 0.03);
      const seedAngry = Math.round(seedLike * Math.random() * 0.02);

      insertPost.run(
        postId, celebId, content, null, daysAgoISO(daysAgo),
        seedLike, seedLove, seedHaha, seedWow, seedSad, seedAngry
      );
      totalPosts++;

      let commentCount;
      if (viralPostsRemaining > 0 && Math.random() < 0.35) {
        commentCount = rand(2500, 6000);
        viralPostsRemaining--;
      } else {
        commentCount = rand(30, 500);
      }

      for (let j = 0; j < commentCount; j++) {
        const fan = seedFan();
        const body = pick(COMMENT_TEMPLATES);
        const commentDaysAgo = Math.max(0, daysAgo - rand(0, Math.min(daysAgo, 3)) / 3);
        insertComment.run(
          uuid(), postId, null, fan.name, fan.avatar, body,
          daysAgoISO(commentDaysAgo)
        );
        totalComments++;
      }
    }
  }
  db.exec('COMMIT');

  console.log(`Seeded ${totalPosts} posts and ${totalComments} comments.`);
  seedAdmin();
  db.close();
}

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@celebconnect.local';
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
  if (existingAdmin) return;
  const password = process.env.ADMIN_PASSWORD || 'change-me-now';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admins (id, email, password_hash, created_at) VALUES (?,?,?,?)')
    .run(uuid(), email, hash, new Date().toISOString());
  console.log(`Admin account ready: ${email} (password from ADMIN_PASSWORD env var)`);
}

run();
