# CelebConnect

A Facebook-style social network where only (fictional) celebrities post. Fans
browse a live feed, react with Facebook-style emoji (including a Haha/LOL
reaction), leave text or **voice-note** comments, follow their favorite stars,
and subscribe to monthly plans. An admin panel manages every celebrity
profile and its posts.

> **Why fictional celebrities?** Populating real people's names/photos and
> posting fabricated "updates" attributed to them would be impersonation,
> regardless of scale. Every celebrity here (Nova Reyes, Jax Calloway, etc.)
> is an invented persona with a generated (DiceBear) avatar. The admin panel
> lets you add, edit, or replace any profile — including swapping in your own
> licensed content — without code changes.

## Features

- **Feed** — reverse-chronological posts from 20 seeded celebrities across
  Music, Film & TV, Sports, Comedy, Internet and Fashion, each verified with
  a blue check and a follower count formatted like Facebook (e.g. `68M`).
- **Thousands of comments** — the seed script generates 70k+ comments across
  137 posts, with several "viral" posts carrying 2,500–6,000 comments each,
  paginated so the UI stays fast.
- **Reactions** — Like, Love, Haha (LOL), Wow, Sad, Angry — toggleable on
  posts and comments, with live aggregate counts.
- **Voice notes** — record a comment with your microphone (MediaRecorder API)
  and post it inline; it plays back as an audio comment.
- **Subscriptions** — Fan (free), Plus ($4.99/mo), VIP ($14.99/mo) plans with
  perks and a subscriber badge shown next to a fan's name/comments. Runs in
  **mock-payment mode** by default (instant simulated success, no external
  calls); flip to real Stripe Checkout by setting `STRIPE_SECRET_KEY` (see
  below) — no other code changes needed.
- **Admin panel** (`/admin`) — separate login; create/edit/delete celebrity
  profiles (name, avatar, bio, followers, verified badge) and publish or
  remove their posts.

## Stack

Plain Node.js/Express + the built-in `node:sqlite` module (zero native
dependencies) on the backend; vanilla HTML/CSS/JS on the frontend. No build
step.

## Getting started

```bash
cd celebconnect
npm install
cp .env.example .env      # edit ADMIN_EMAIL / ADMIN_PASSWORD / JWT secrets
npm run seed               # creates data/celebconnect.sqlite + seed data
npm start                  # http://localhost:4000
```

Visit `http://localhost:4000` for the fan-facing site and
`http://localhost:4000/admin` for the admin panel (login with the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`).

Re-running `npm run seed` is a no-op if celebrities already exist; delete
`data/celebconnect.sqlite` first if you want a fresh dataset.

## Switching subscriptions to real Stripe

1. `npm install stripe`
2. Create Plus/VIP recurring Prices in your Stripe dashboard (test mode is
   fine) and set `STRIPE_PRICE_PLUS` / `STRIPE_PRICE_VIP` in `.env`.
3. Set `STRIPE_SECRET_KEY` in `.env` and restart the server.

`POST /api/subscribe` automatically switches from recording a mock
subscription to creating a real Stripe Checkout Session and redirecting the
fan there. Webhook handling for post-checkout confirmation is not wired up
yet — that's the next piece to add if you go this route (Stripe's
`checkout.session.completed` event should update `fans.plan`).

## Project layout

```
server/
  index.js            Express app wiring
  db.js                node:sqlite schema
  seed.js              fictional celebrities + posts + comments
  plans.js             subscription tier definitions
  middleware/auth.js    JWT auth for fans and admins
  routes/               auth, celebrities, feed, comments, reactions,
                         subscriptions, admin
  utils/                follower-count formatting, post/comment serializers
public/
  index.html, css/, js/app.js     fan-facing SPA
  admin.html, js/admin.js         admin panel
uploads/voice/          uploaded voice-note audio files
data/                    sqlite database file (gitignored)
```

## Notes / limitations

- This is a self-contained demo app, not hardened for production traffic:
  there's no rate limiting, image upload/hosting (post images are just URLs),
  or Stripe webhook handler yet.
- `node:sqlite` is an experimental Node API (stable behavior on Node 22.5+);
  you'll see an `ExperimentalWarning` in the server logs, which is expected.
- Voice notes are capped at 8MB / ~2 minutes per note.
