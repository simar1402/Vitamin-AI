# Vitamin-AI

**Daily AI nutrition for your profession.**

Vitamin-AI curates AI news, tools, launches, and discussions into a calm, editorial feed — personalized by the topics you choose.

## Tech stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** (animations)
- **Radix UI** + shadcn-style components

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Get started** → pick your interests → view your personalized feed.

No login or environment variables required for local development.

## User flow

1. **Landing** (`/`) — product overview
2. **Interests** (`/interests`) — pick 2+ AI topic areas
3. **Home feed** (`/home`) — stories ranked and filtered by your interests
4. **Trending / Explore / Saved / Profile** — browse, save, and update topics

Preferences are stored in `localStorage` on the device.

## Project structure

```
src/
├── app/
│   ├── page.tsx           # Landing
│   ├── interests/         # Topic selection (entry point)
│   └── (app)/             # App shell with nav
│       ├── home/          # Interest-based feed
│       ├── trending/
│       ├── explore/
│       ├── saved/
│       └── profile/
├── components/
├── context/               # Interests + saved posts
├── data/                  # Mock feed
└── lib/feed-filter.ts     # Interest → feed matching
```

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Deploy (no env vars required for the mock feed)

## License

Private — Vitamin-AI
