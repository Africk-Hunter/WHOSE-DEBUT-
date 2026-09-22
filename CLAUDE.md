# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Instructions for Claude:
- Do not show your reasoning or thinking process
- If you have a hypothesis, state it in one sentence and implement the fix immediately
- Never list multiple possible causes — pick the most likely one and try it
- For visual/layout/styling changes, ask the user how it looks after making the change instead of launching a browser (e.g. Playwright) and taking screenshots yourself

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint (0 warnings allowed, exits non-zero on any warning)
npm run preview   # Preview the production build locally
```

There are no tests in this project.

## Environment Variables

A `.env` file is required at the project root with the Firebase config values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_AUDIO_UPLOAD_PRESET=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_FAN_NOTE_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

These are consumed in [src/utilities/database/firebaseClient.ts](src/utilities/database/firebaseClient.ts) via `import.meta.env`.

## Architecture

**WHOSE DEBUT?** is a music discovery platform for Reno-area artists to share debut albums. It is a React 18 + TypeScript SPA built with Vite, using Firebase for backend (Firestore database, Storage, Auth) and EmailJS for both the About page's contact form and the Fan Notes submission flow.

### Data Flow

On every page load, `Main` clears `localStorage`, re-fetches all albums from Firestore (sorted locally by `year_released` descending), and also fetches the full `genres` collection into `localStorage` under the `genres` key. All other pages read album and genre data exclusively from `localStorage` — there are no additional Firestore reads outside of that initial load. Writes happen only from the admin dashboard (album add/edit/delete, genre creation, comment moderation).

`/album/:albumId` is **not** a separate page component — `App.tsx` routes both `/` and `/album/:albumId` to `Main`. `Main` always renders the home sections, and additionally renders `AlbumView` (from [src/pages/albumView.tsx](src/pages/albumView.tsx)) as an overlay whenever a route param is present, locking body scroll while it's open. Album navigation itself uses a side-channel: clicking an album writes `selectedID` to `localStorage`, then navigates to `/album/:albumId`. `AlbumView` resolves the album by route param when present, falling back to the `selectedID` localStorage key otherwise — so a direct/shared link to `/album/:id` works even without a prior in-app click.

### Genre System

Genres are a managed Firestore collection, not free text. Each doc in `genres` is keyed by slug (`slugify()` in [src/utilities/genres.ts](src/utilities/genres.ts)) with a `label` field; `albums.genres` stores an array of those slugs. [src/utilities/database/genreInteractions.ts](src/utilities/database/genreInteractions.ts) owns all reads/writes: `fetchAllGenres`, `seedGenresIfEmpty` (seeds from `SEED_GENRES` the first time the collection is empty), and `getOrCreateGenre` (the single dedup point — matches by slug or case-insensitive label before creating a new doc), used both by the admin "+ Add genre" flow and by [src/utilities/database/migrateGenres.ts](src/utilities/database/migrateGenres.ts), a one-off admin-triggered migration (preview + run) that converts legacy comma-separated `genres` strings to slug arrays. `albumGenres()` tolerates both shapes so an unmigrated record never crashes a caller.

Filtering is URL-driven via the `useGenreFilter` hook ([src/hooks/useGenreFilter.ts](src/hooks/useGenreFilter.ts)), which reads/writes a `?genre=slug1,slug2` search param (alphabetical, deduped) so selection is shareable and stays in sync across any component in the route tree. `GenreFilterBar` + `GenreFilterPanel` are the shared UI, driven by `computeAvailableGenres()` for counts/ordering; used on both the "Still Fresh" section and the Archive. Clicking a genre chip on `AlbumView` navigates to `/?genre=slug#archive` with `location.state.fromGenreChip`, which `Archive` reads to decide whether to latch a visible back arrow.

### Fan Notes & Comments

Two separate, non-overlapping mechanisms share the "fan feedback" idea:
- `artist_review` and the legacy `from_a_peer` field are admin-authored/curated text set from the admin dashboard's Add/Manage form. `from_a_peer` is still written but no longer rendered anywhere in the UI.
- The **Fan Notes** UI on `AlbumView` (`FanNoteForm.tsx`) is fan-facing but has no moderation backend: a submission is validated client-side ([src/utilities/fanNotes.ts](src/utilities/fanNotes.ts)) and emailed straight to Hunter via its own EmailJS template (`VITE_EMAILJS_FAN_NOTE_TEMPLATE_ID`) — it never touches Firestore directly. A `wd.fanNoteSent.{albumId}` localStorage flag prevents re-showing the form after a successful send. Hunter reads the email and, if he wants it published, manually adds it as a `FanComment` (`{ id, name, text }`) via the admin dashboard's "Comments" tab, which calls `updateAlbumComments` to write the `comments` array on that album's Firestore doc. `AlbumView` renders `album.comments` (HTML-escaped via `formatReviewText`, which allows a small tag whitelist) as the visible "Fan Notes" list.

### Firebase Structure

**Firestore collection: `albums`**
| Field | Notes |
|---|---|
| `name` | Album title |
| `artist` | |
| `year_released` | Full date string (YYYY-MM-DD) |
| `artist_review` | Text from the artist about their album |
| `from_a_peer` | Legacy admin-curated fan blurb; no longer displayed (see Fan Notes & Comments) |
| `genres` | Array of genre slugs (legacy: comma-separated string, tolerated via `albumGenres()`) |
| `spotify`, `apple`, `bandcamp`, `amazon` | Streaming links |
| `image_url` | Public URL from Cloudinary |
| `preview_audio_url` | Optional. 30-second WAV preview clip, auto-trimmed client-side from admin upload |
| `preview_song_name` | Optional. Display name for the preview track, set alongside `preview_audio_url` |
| `comments` | Optional `FanComment[]` (`{ id, name, text }`), admin-moderated, rendered as "Fan Notes" on `AlbumView` |
| `hidden` | Optional boolean, toggled from the admin dashboard's "Manage Albums" tab. Hidden albums are filtered out of `loadAlbumsFromDatabase`'s localStorage write, so they never appear on the home page, Still Fresh, or Archive, but remain in Firestore and stay editable from Manage Albums |

**Firestore collection: `genres`** — doc ID is the slug; `{ label: string }` is the only field. See Genre System above.

**Image hosting: Cloudinary** — album covers are uploaded via unsigned upload to Cloudinary. `public_id` follows the pattern `Artist_Name-Album_Title-{timestamp}`. The returned `secure_url` is stored as `image_url` in Firestore. Configure via `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` (preset must be set to "unsigned" in the Cloudinary dashboard). [src/utilities/cloudinary.ts](src/utilities/cloudinary.ts)'s `optimizeCloudinaryUrl()` rewrites any Cloudinary URL to add `f_auto,q_auto,w_{width},c_limit` before display.

**Preview audio hosting: Cloudinary** — an optional album preview clip is decoded client-side with the Web Audio API, trimmed to a fixed-length window the admin drags over a waveform, and re-encoded as a WAV blob, then uploaded unsigned to Cloudinary's `/video/upload` endpoint (Cloudinary treats audio under the "video" resource type). Uses a **second, separate** unsigned preset via `VITE_CLOUDINARY_AUDIO_UPLOAD_PRESET` — this preset must be created manually in the Cloudinary dashboard (Settings → Upload → Add upload preset, set to unsigned) before the feature works; it cannot be created from code. The returned `secure_url` is stored as `preview_audio_url` and is only written to Firestore when a preview was actually uploaded. Playback on `AlbumView` goes through `PreviewAudioPlayer.tsx`, which routes volume through a Web Audio `GainNode` because iOS Safari ignores `HTMLMediaElement.volume` directly.

**Auth** — Firebase email/password. Admin user must be created manually in the Firebase Console under Authentication → Users.

**Analytics** — Firebase Analytics (Google Analytics). `analyticsReady` in [src/utilities/database/firebaseClient.ts](src/utilities/database/firebaseClient.ts) is a `Promise<Analytics | null>` that resolves to `null` if `VITE_FIREBASE_MEASUREMENT_ID` isn't set or the browser doesn't support Analytics (e.g. an ad blocker); nothing throws if analytics is unavailable. [src/hooks/usePageTracking.ts](src/hooks/usePageTracking.ts) logs a `page_view` event on every route change and is called once from `App.tsx`. Requires enabling Google Analytics for the Firebase project in the Firebase Console (Project settings → Integrations) to get a Measurement ID.

### Routes

| Path | Component | Notes |
|---|---|---|
| `/` | `Main` | Three scroll-snap sections (top 3, "Still Fresh" 4–13, Archive all) |
| `/album/:albumId` | `Main` | Same component as `/`; renders `AlbumView` as an overlay when the route param is present, falling back to `selectedID` in localStorage |
| `/about` | `About` | Platform description + `Contact` (EmailJS contact form) |
| `/admin` | `AdminPanel` | Firebase email/password login |
| `/admin/dashboard` | `AdminDashboard` | Protected; tabs for adding/editing/deleting albums, genre migration, and comment moderation |

### Scroll Behavior

The main page (`/`) uses CSS `scroll-snap-type: y mandatory` for full-page section snapping. The Archive section is exempt: `Main` uses a scroll listener with `requestAnimationFrame` that dynamically disables `scroll-snap-type` on `<html>` when the archive scrolls into view, and re-enables it when the user scrolls back up.

### Styling

All SCSS is imported through a single entry point: [src/styles/index.scss](src/styles/index.scss). Each page/component has its own `.scss` file in `src/styles/`. Shared SCSS variables (colors, spacing, etc.) live in [src/styles/variables.scss](src/styles/variables.scss). Global font is **"Do Hyeon"** (Google Fonts). Background color is `#FAF5F0`.

### Admin Auth Flow

`/admin` uses Firebase `signInWithEmailAndPassword`. `onAuthStateChanged` listens for a session and redirects to `/admin/dashboard` on login. The dashboard uses `onAuthStateChanged` to guard itself, redirecting to `/admin` if no user is signed in. Logout calls `signOut` and redirects to `/`.

### Key Utility Files

- [src/utilities/database/firebaseClient.ts](src/utilities/database/firebaseClient.ts) — initializes Firebase app, exports `db`, `storage`, `auth`
- [src/utilities/database/firebaseInteractions.ts](src/utilities/database/firebaseInteractions.ts) — `loadAlbumsFromDatabase`, `uploadCoverToCloudinary`, `uploadPreviewAudioToCloudinary`, `submitAlbumToFirebase`, `updateAlbumInFirebase`, `deleteAlbumFromFirebase`, `updateAlbumComments`, `seedTestAlbums`
- [src/utilities/database/genreInteractions.ts](src/utilities/database/genreInteractions.ts) — `fetchAllGenres`, `seedGenresIfEmpty`, `getOrCreateGenre` (see Genre System)
- [src/utilities/database/migrateGenres.ts](src/utilities/database/migrateGenres.ts) — `previewGenreMigration` (read-only) / `runGenreMigration` (idempotent) for converting legacy comma-separated genre strings to slug arrays
- [src/utilities/genres.ts](src/utilities/genres.ts) — `slugify`, `albumGenres` (tolerates legacy string shape), `computeAvailableGenres` (counts + ordering for filter UI), `SEED_GENRES`
- [src/hooks/useGenreFilter.ts](src/hooks/useGenreFilter.ts) — URL-search-param-backed genre selection shared across components
- [src/utilities/fanNotes.ts](src/utilities/fanNotes.ts) — `validateFanNote` client-side validation for the Fan Notes form
- [src/utilities/textFormatting.ts](src/utilities/textFormatting.ts) — `formatReviewText`: escapes HTML then un-escapes a small allowed-tag whitelist, used for any admin/fan-authored text rendered via `dangerouslySetInnerHTML`
- [src/utilities/cloudinary.ts](src/utilities/cloudinary.ts) — `optimizeCloudinaryUrl` (adds `f_auto,q_auto,w_,c_limit` transform params)
- [src/utilities/audio/trimAudioToWav.ts](src/utilities/audio/trimAudioToWav.ts) — `decodeAudioFile` decodes an uploaded audio file via the Web Audio API; `sliceAudioBufferToWav` slices a decoded buffer from a given start offset for N seconds and re-encodes it as a WAV `Blob`; `computeWaveformPeaks` buckets a decoded buffer into peak amplitudes for waveform drawing; `trimAudioToWav` composes the first two for one-shot use
- [src/components/AudioClipSelector.tsx](src/components/AudioClipSelector.tsx) — admin-only waveform UI (canvas, drawn from `computeWaveformPeaks`) for dragging a fixed-length preview window over an uploaded audio file before it's trimmed and uploaded
- [src/components/PreviewAudioPlayer.tsx](src/components/PreviewAudioPlayer.tsx) — fan-facing preview playback UI; routes volume through a Web Audio `GainNode` for iOS Safari compatibility
- [src/components/FanNoteForm.tsx](src/components/FanNoteForm.tsx) — fan-facing note submission form (EmailJS only, see Fan Notes & Comments)
- [src/components/GenreFilterBar.tsx](src/components/GenreFilterBar.tsx) / [src/components/GenreFilterPanel.tsx](src/components/GenreFilterPanel.tsx) — shared genre filter UI (chips + full panel)
- [src/components/ArchiveEntry.tsx](src/components/ArchiveEntry.tsx) — renders a single year/month row within `Archive`
- [src/utilities/localStorageHandling.ts](src/utilities/localStorageHandling.ts) — all localStorage read/write helpers (albums + genres)
- [src/utilities/types.ts](src/utilities/types.ts) — shared TypeScript types (`Album`, `FanComment`)
