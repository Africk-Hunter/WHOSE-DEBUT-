# WHOSE DEBUT?

A music discovery platform for Reno-area artists to share their debut albums. React 18 + TypeScript SPA built with Vite, backed by Firebase (Firestore, Auth) with Cloudinary for image/audio hosting and EmailJS for contact and fan-note email.

## Getting started

1. `npm install`
2. Create a `.env` at the project root with the Firebase, Cloudinary and EmailJS values listed in [CLAUDE.md](CLAUDE.md).
3. `npm run dev`

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + production build
- `npm run lint` — ESLint (zero warnings allowed)
- `npm test` — Vitest unit tests
- `npm run preview` — preview the production build

Architecture notes (data flow, genre system, Firebase structure) are in [CLAUDE.md](CLAUDE.md).
