/**
 * Seeds Firebase Firestore with all celebrity data + admin user.
 *
 * Run once after setting up your Firebase project:
 *   npx ts-node --project tsconfig.seed.json scripts/firebase-seed.ts
 *
 * Requires these env vars in .env:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { hash } from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
})

const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Celebrity data (same as prisma/seed.ts) ────────────────────────────
const celebrities = [
  { name: 'Taylor Swift', category: 'Music', subcategory: 'Pop', nationality: 'American', birthYear: 1989, meetPrice: 250000, virtualPrice: 75000, signingPrice: 50000, fanCardPrice: 49.99, rating: 4.9, reviewCount: 18420, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png/440px-191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png', bio: 'Global pop superstar with multiple Grammy Awards and record-breaking albums including Midnights and The Eras Tour.', tags: 'pop,country,singer-songwriter,grammy' },
  { name: 'Beyoncé', category: 'Music', subcategory: 'R&B', nationality: 'American', birthYear: 1981, meetPrice: 500000, virtualPrice: 150000, signingPrice: 100000, fanCardPrice: 59.99, rating: 4.9, reviewCount: 22100, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png/440px-Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png', bio: 'Iconic Grammy-winning artist, performer, and cultural icon. Queen Bey has redefined modern music and performance.', tags: 'r&b,pop,queen-bey,grammy' },
  { name: 'Drake', category: 'Music', subcategory: 'Hip-Hop', nationality: 'Canadian', birthYear: 1986, meetPrice: 300000, virtualPrice: 100000, signingPrice: 75000, fanCardPrice: 44.99, rating: 4.8, reviewCount: 15300, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Drake_July_2016.jpg/440px-Drake_July_2016.jpg', bio: 'Multi-platinum rapper and songwriter from Toronto. Known for chart-topping hits and his OVO Sound label.', tags: 'hip-hop,rap,ovo,toronto' },
  { name: 'Adele', category: 'Music', subcategory: 'Soul/Pop', nationality: 'British', birthYear: 1988, meetPrice: 400000, virtualPrice: 120000, signingPrice: 80000, fanCardPrice: 49.99, rating: 4.9, reviewCount: 12800, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Adele_2016.jpg/440px-Adele_2016.jpg', bio: 'British soul powerhouse with multiple Grammy and Oscar wins. Known for Hello, Rolling in the Deep, and Someone Like You.', tags: 'soul,pop,british,grammy,oscar' },
  { name: 'Ed Sheeran', category: 'Music', subcategory: 'Pop', nationality: 'British', birthYear: 1991, meetPrice: 200000, virtualPrice: 60000, signingPrice: 40000, fanCardPrice: 39.99, rating: 4.8, reviewCount: 11200, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/440px-Ed_Sheeran-6886_%28cropped%29.jpg', bio: 'British singer-songwriter behind Shape of You, Thinking Out Loud, and countless platinum albums.', tags: 'pop,acoustic,singer-songwriter,british' },
  { name: 'Billie Eilish', category: 'Music', subcategory: 'Alt Pop', nationality: 'American', birthYear: 2001, meetPrice: 175000, virtualPrice: 55000, signingPrice: 35000, fanCardPrice: 39.99, rating: 4.8, reviewCount: 14500, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Billie_Eilish_wearing_a_black_hoodie_%28cropped%29.jpg/440px-Billie_Eilish_wearing_a_black_hoodie_%28cropped%29.jpg', bio: 'Grammy-winning Gen-Z icon and Oscar winner for No Time to Die.', tags: 'alt-pop,indie,grammy,gen-z' },
  { name: 'The Weeknd', category: 'Music', subcategory: 'R&B', nationality: 'Canadian', birthYear: 1990, meetPrice: 275000, virtualPrice: 85000, signingPrice: 55000, fanCardPrice: 44.99, rating: 4.8, reviewCount: 13100, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/The_Weeknd_in_2018.png/440px-The_Weeknd_in_2018.png', bio: 'R&B superstar known for Blinding Lights, Starboy, and his cinematic musical aesthetic.', tags: 'r&b,pop,toronto,grammy' },
  { name: 'Ariana Grande', category: 'Music', subcategory: 'Pop', nationality: 'American', birthYear: 1993, meetPrice: 225000, virtualPrice: 70000, signingPrice: 45000, fanCardPrice: 44.99, rating: 4.8, reviewCount: 17600, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ariana_Grande_2018.png/440px-Ariana_Grande_2018.png', bio: 'Pop sensation with a 4-octave vocal range. Known for thank u next and 7 rings.', tags: 'pop,r&b,actress,grammy' },
  { name: 'Rihanna', category: 'Music', subcategory: 'R&B', nationality: 'Barbadian', birthYear: 1988, meetPrice: 450000, virtualPrice: 140000, signingPrice: 90000, fanCardPrice: 54.99, rating: 4.9, reviewCount: 19200, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_Fenty_2018.png/440px-Rihanna_Fenty_2018.png', bio: 'Music icon, entrepreneur, and founder of Fenty Beauty.', tags: 'r&b,pop,fenty,entrepreneur' },
  { name: 'Bad Bunny', category: 'Music', subcategory: 'Latin/Reggaeton', nationality: 'Puerto Rican', birthYear: 1994, meetPrice: 300000, virtualPrice: 95000, signingPrice: 60000, fanCardPrice: 44.99, rating: 4.9, reviewCount: 14800, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Bad_Bunny_2020.jpg/440px-Bad_Bunny_2020.jpg', bio: 'Latin music superstar and most-streamed artist globally.', tags: 'latin,reggaeton,trap,spanish' },
  { name: 'Dwayne Johnson', category: 'Film & TV', subcategory: 'Action', nationality: 'American', birthYear: 1972, meetPrice: 500000, virtualPrice: 150000, signingPrice: 100000, fanCardPrice: 59.99, rating: 4.9, reviewCount: 19800, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Dwayne_Johnson_2014_%28cropped%29.jpg/440px-Dwayne_Johnson_2014_%28cropped%29.jpg', bio: 'The Rock — Hollywood\'s highest-paid actor, former WWE champion, and global superstar.', tags: 'action,wrestler,hollywood,fast-furious' },
  { name: 'Ryan Reynolds', category: 'Film & TV', subcategory: 'Comedy/Action', nationality: 'Canadian', birthYear: 1976, meetPrice: 350000, virtualPrice: 110000, signingPrice: 72000, fanCardPrice: 49.99, rating: 4.9, reviewCount: 16100, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Ryan_Reynolds_2016.jpg/440px-Ryan_Reynolds_2016.jpg', bio: 'Deadpool star, Aviation Gin owner, and Wrexham AFC co-owner.', tags: 'comedy,action,deadpool,entrepreneur' },
  { name: 'Zendaya', category: 'Film & TV', subcategory: 'Drama', nationality: 'American', birthYear: 1996, meetPrice: 225000, virtualPrice: 70000, signingPrice: 47000, fanCardPrice: 44.99, rating: 4.9, reviewCount: 14900, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Zendaya_2019.jpg/440px-Zendaya_2019.jpg', bio: 'Emmy-winning actress known for Euphoria and Spider-Man. Fashion icon and cultural trailblazer.', tags: 'drama,emmy,spiderman,euphoria,fashion' },
  { name: 'Margot Robbie', category: 'Film & TV', subcategory: 'Drama', nationality: 'Australian', birthYear: 1990, meetPrice: 300000, virtualPrice: 95000, signingPrice: 60000, fanCardPrice: 44.99, rating: 4.8, reviewCount: 13600, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Margot_Robbie_2023.jpg/440px-Margot_Robbie_2023.jpg', bio: 'Oscar-nominated actress and producer known for Barbie and I, Tonya.', tags: 'drama,comedy,producer,australian' },
  { name: 'Pedro Pascal', category: 'Film & TV', subcategory: 'Action/Drama', nationality: 'Chilean-American', birthYear: 1975, meetPrice: 200000, virtualPrice: 65000, signingPrice: 42000, fanCardPrice: 39.99, rating: 4.9, reviewCount: 14300, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Pedro_Pascal_%2848487290492%29_%28cropped%29.jpg/440px-Pedro_Pascal_%2848487290492%29_%28cropped%29.jpg', bio: 'The Mandalorian and Joel from The Last of Us.', tags: 'action,drama,mandalorian,last-of-us' },
  { name: 'LeBron James', category: 'Sports', subcategory: 'Basketball', nationality: 'American', birthYear: 1984, meetPrice: 500000, virtualPrice: 150000, signingPrice: 100000, fanCardPrice: 59.99, rating: 4.9, reviewCount: 22700, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/LeBron_James_crop.jpg/440px-LeBron_James_crop.jpg', bio: '4x NBA Champion and GOAT candidate. Also a film star and entrepreneur.', tags: 'basketball,nba,lakers,goat,entrepreneur' },
  { name: 'Cristiano Ronaldo', category: 'Sports', subcategory: 'Soccer', nationality: 'Portuguese', birthYear: 1985, meetPrice: 600000, virtualPrice: 180000, signingPrice: 120000, fanCardPrice: 69.99, rating: 4.9, reviewCount: 24500, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg', bio: 'CR7 — five-time Ballon d\'Or winner and one of the greatest footballers in history.', tags: 'soccer,football,cr7,portugal,goat' },
  { name: 'Lionel Messi', category: 'Sports', subcategory: 'Soccer', nationality: 'Argentine', birthYear: 1987, meetPrice: 600000, virtualPrice: 180000, signingPrice: 120000, fanCardPrice: 69.99, rating: 5.0, reviewCount: 25100, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/440px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg', bio: 'The GOAT. Eight-time Ballon d\'Or winner and 2022 World Cup champion.', tags: 'soccer,football,argentina,world-cup,goat,ballon-dor' },
  { name: 'Serena Williams', category: 'Sports', subcategory: 'Tennis', nationality: 'American', birthYear: 1981, meetPrice: 400000, virtualPrice: 120000, signingPrice: 80000, fanCardPrice: 54.99, rating: 4.9, reviewCount: 17600, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Serena_Williams_at_2013_US_Open.jpg/440px-Serena_Williams_at_2013_US_Open.jpg', bio: '23 Grand Slam titles. The greatest female athlete of all time.', tags: 'tennis,grand-slam,goat,entrepreneur' },
  { name: 'Simone Biles', category: 'Sports', subcategory: 'Gymnastics', nationality: 'American', birthYear: 1997, meetPrice: 250000, virtualPrice: 80000, signingPrice: 52000, fanCardPrice: 44.99, rating: 4.9, reviewCount: 13900, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Simone_Biles_2016.jpg/440px-Simone_Biles_2016.jpg', bio: 'The greatest gymnast of all time with 37 Olympic and World Championship medals.', tags: 'gymnastics,olympics,goat,mental-health' },
  { name: 'MrBeast', category: 'Social Media', subcategory: 'YouTube', nationality: 'American', birthYear: 1998, meetPrice: 200000, virtualPrice: 65000, signingPrice: 42000, fanCardPrice: 39.99, rating: 4.9, reviewCount: 18900, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/MrBeast_November_2022.jpg/440px-MrBeast_November_2022.jpg', bio: 'World\'s most subscribed YouTuber known for insane challenges and philanthropic stunts.', tags: 'youtube,philanthropy,challenges,entrepreneur' },
  { name: 'Elon Musk', category: 'Business & Tech', subcategory: 'Entrepreneur', nationality: 'South African-American', birthYear: 1971, meetPrice: 1000000, virtualPrice: 300000, signingPrice: 200000, fanCardPrice: 99.99, rating: 4.3, reviewCount: 21000, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/440px-Elon_Musk_Royal_Society_%28crop2%29.jpg', bio: 'CEO of Tesla, SpaceX, and X. Visionary behind electric vehicles and space travel.', tags: 'entrepreneur,tesla,spacex,x,billionaire' },
  { name: 'Oprah Winfrey', category: 'Business & Tech', subcategory: 'Media', nationality: 'American', birthYear: 1954, meetPrice: 750000, virtualPrice: 225000, signingPrice: 150000, fanCardPrice: 79.99, rating: 5.0, reviewCount: 17300, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Oprah_in_2014.jpg/440px-Oprah_in_2014.jpg', bio: 'Media mogul, billionaire, and cultural icon. Changed daytime TV forever.', tags: 'media,entrepreneur,philanthropist,book-club,oscar' },
  { name: 'Kim Kardashian', category: 'Business & Tech', subcategory: 'Media/Business', nationality: 'American', birthYear: 1980, meetPrice: 500000, virtualPrice: 150000, signingPrice: 100000, fanCardPrice: 59.99, rating: 4.6, reviewCount: 19800, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Kim_Kardashian_2019_cropped.jpg/440px-Kim_Kardashian_2019_cropped.jpg', bio: 'Business mogul, reality TV star, and founder of SKIMS and KKW Beauty.', tags: 'entrepreneur,reality-tv,skims,billionaire,fashion' },
  { name: 'Kevin Hart', category: 'Comedy', subcategory: 'Stand-up', nationality: 'American', birthYear: 1979, meetPrice: 300000, virtualPrice: 95000, signingPrice: 60000, fanCardPrice: 44.99, rating: 4.8, reviewCount: 14500, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Kevin_Hart_2014_%28cropped%29.jpg/440px-Kevin_Hart_2014_%28cropped%29.jpg', bio: 'One of the highest-grossing comedians of all time.', tags: 'comedy,stand-up,actor,entrepreneur' },
  { name: 'Shah Rukh Khan', category: 'Film & TV', subcategory: 'Bollywood', nationality: 'Indian', birthYear: 1965, meetPrice: 500000, virtualPrice: 150000, signingPrice: 100000, fanCardPrice: 59.99, rating: 4.9, reviewCount: 23100, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg/440px-Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg', bio: 'King Khan — the world\'s biggest movie star by box office.', tags: 'bollywood,indian,king-khan,romantic' },
  { name: 'BTS - Jin', category: 'Music', subcategory: 'K-Pop', nationality: 'South Korean', birthYear: 1992, meetPrice: 300000, virtualPrice: 95000, signingPrice: 60000, fanCardPrice: 44.99, rating: 4.9, reviewCount: 28400, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/BTS_at_the_2019_Melon_Music_Awards_%28cropped_Jin%29.jpg/440px-BTS_at_the_2019_Melon_Music_Awards_%28cropped_Jin%29.jpg', bio: 'BTS member Jin (Kim Seokjin) — eldest member of the world\'s biggest K-pop group.', tags: 'k-pop,bts,korean,worldwide-handsome' },
  { name: 'BLACKPINK - Lisa', category: 'Music', subcategory: 'K-Pop', nationality: 'Thai', birthYear: 1997, meetPrice: 250000, virtualPrice: 80000, signingPrice: 52000, fanCardPrice: 44.99, rating: 4.9, reviewCount: 24600, featured: true, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/BLACKPINK_Lisa_at_the_2019_Korean_Music_Awards_%28cropped%29.jpg/440px-BLACKPINK_Lisa_at_the_2019_Korean_Music_Awards_%28cropped%29.jpg', bio: 'BLACKPINK rapper, dancer, and solo artist. Most followed K-pop artist on Instagram.', tags: 'k-pop,blackpink,thai,dance,model' },
  { name: 'Kendall Jenner', category: 'Fashion', subcategory: 'Modeling', nationality: 'American', birthYear: 1995, meetPrice: 350000, virtualPrice: 110000, signingPrice: 72000, fanCardPrice: 49.99, rating: 4.7, reviewCount: 14200, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kendall_Jenner_2019.jpg/440px-Kendall_Jenner_2019.jpg', bio: 'World\'s highest-paid supermodel and founder of 818 Tequila.', tags: 'model,fashion,818-tequila,entrepreneur' },
  { name: 'Malala Yousafzai', category: 'Science & Academia', subcategory: 'Activism', nationality: 'Pakistani', birthYear: 1997, meetPrice: 200000, virtualPrice: 65000, signingPrice: 42000, fanCardPrice: 39.99, rating: 5.0, reviewCount: 11400, featured: false, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Malala_Yousafzai_-_World_Economic_Forum_Annual_Meeting_2014.jpg/440px-Malala_Yousafzai_-_World_Economic_Forum_Annual_Meeting_2014.jpg', bio: 'Youngest Nobel Peace Prize laureate and girls\' education activist.', tags: 'activism,education,nobel,pakistan' },
]

async function main() {
  console.log('🔥 Seeding Firebase Firestore...\n')

  // Seed celebrities
  const celBatch = db.batch()
  let count = 0
  for (const cel of celebrities) {
    const slug = slugify(cel.name)
    const id = slug + '-' + Date.now() + count
    celBatch.set(db.collection('celebrities').doc(slug), {
      ...cel,
      slug,
      available: true,
      verified: true,
      totalBookings: rand(10, 500),
      longBio: cel.bio + ' Their unique journey has inspired millions worldwide.',
      galleryUrls: null,
      instagram: null,
      twitter: null,
      youtube: null,
      website: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    count++
  }
  await celBatch.commit()
  console.log(`✅ Seeded ${count} celebrities`)

  // Seed admin user
  const adminPass = await hash('Admin@StarConnect2024!', 12)
  const existing = await db.collection('users').where('email', '==', 'management.team@mail.com').limit(1).get()
  if (existing.empty) {
    await db.collection('users').add({
      name: 'StarConnect Admin',
      email: 'management.team@mail.com',
      password: adminPass,
      role: 'admin',
      image: 'https://ui-avatars.com/api/?name=Admin&background=f59e0b&color=fff&size=200',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log('✅ Admin user created: management.team@mail.com')
  } else {
    console.log('ℹ️  Admin user already exists')
  }

  // Seed demo fan
  const fanPass = await hash('Fan@Demo2024!', 12)
  const existingFan = await db.collection('users').where('email', '==', 'demo@starconnect.pro').limit(1).get()
  if (existingFan.empty) {
    await db.collection('users').add({
      name: 'Demo Fan',
      email: 'demo@starconnect.pro',
      password: fanPass,
      role: 'fan',
      image: 'https://ui-avatars.com/api/?name=Demo+Fan&background=7c3aed&color=fff&size=200',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log('✅ Demo fan created: demo@starconnect.pro')
  }

  console.log('\n🎉 Firebase Firestore seeded successfully!')
  console.log('\n📋 Admin Login: management.team@mail.com / Admin@StarConnect2024!')
  console.log('👤 Demo Fan:    demo@starconnect.pro / Fan@Demo2024!')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
