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

**WHOSE DEBUT?** is a music discovery platform for Reno-area artists to share debut albums. It is a React 18 + TypeScript SPA built with Vite, using Firebase for backend (Firestore database, Storage, Auth) and EmailJS for the contact form.

### Data Flow

On every page load, `Main` clears `localStorage` and re-fetches all albums from Firestore, stores them locally sorted by `year_released` descending. All other pages read album data exclusively from `localStorage` — there are no additional Firebase calls outside of the initial load and admin submission.

Album navigation uses a side-channel: clicking an album writes `selectedID` to `localStorage`, then navigates to `/album/:albumId`. The `AlbumView` page resolves the album by route param when present, falling back to the `selectedID` localStorage key otherwise — so a direct/shared link to `/album/:id` works even without a prior in-app click.

### Firebase Structure

**Firestore collection: `albums`**
| Field | Notes |
|---|---|
| `name` | Album title |
| `artist` | |
| `year_released` | Full date string (YYYY-MM-DD) |
| `artist_review` | Text from the artist about their album |
| `from_a_peer` | Review from a fan |
| `genres` | |
| `spotify`, `apple`, `bandcamp`, `amazon` | Streaming links |
| `image_url` | Public URL from Firebase Storage |
| `preview_audio_url` | Optional. 30-second WAV preview clip, auto-trimmed client-side from admin upload |

**Image hosting: Cloudinary** — album covers are uploaded via unsigned upload to Cloudinary. `public_id` follows the pattern `Artist_Name-Album_Title-{timestamp}`. The returned `secure_url` is stored as `image_url` in Firestore. Configure via `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` (preset must be set to "unsigned" in the Cloudinary dashboard).

**Preview audio hosting: Cloudinary** — an optional album preview clip is decoded client-side with the Web Audio API, trimmed to the first 30 seconds, re-encoded as a WAV blob, and uploaded unsigned to Cloudinary's `/video/upload` endpoint (Cloudinary treats audio under the "video" resource type). Uses a **second, separate** unsigned preset via `VITE_CLOUDINARY_AUDIO_UPLOAD_PRESET` — this preset must be created manually in the Cloudinary dashboard (Settings → Upload → Add upload preset, set to unsigned) before the feature works; it cannot be created from code. The returned `secure_url` is stored as `preview_audio_url` and is only written to Firestore when a preview was actually uploaded.

**Auth** — Firebase email/password. Admin user must be created manually in the Firebase Console under Authentication → Users.

### Routes

| Path | Component | Notes |
|---|---|---|
| `/` | `Main` | Three scroll-snap sections (top 3, "Still Fresh" 4–13, Archive all) |
| `/album/:albumId` | `AlbumView` | Resolves album by route param, falling back to `selectedID` in localStorage |
| `/about` | `About` | Platform description + EmailJS contact form |
| `/admin` | `AdminPanel` | Firebase email/password login |
| `/admin/dashboard` | `AdminDashboard` | Protected; form to upload cover + submit album to Firebase |

### Scroll Behavior

The main page (`/`) uses CSS `scroll-snap-type: y mandatory` for full-page section snapping. The Archive section is exempt: `Main` uses a scroll listener with `requestAnimationFrame` that dynamically disables `scroll-snap-type` on `<html>` when the archive scrolls into view, and re-enables it when the user scrolls back up.

### Styling

All SCSS is imported through a single entry point: [src/styles/index.scss](src/styles/index.scss). Each page/component has its own `.scss` file in `src/styles/`. Shared SCSS variables (colors, spacing, etc.) live in [src/styles/variables.scss](src/styles/variables.scss). Global font is **"Do Hyeon"** (Google Fonts). Background color is `#FAF5F0`.

### Admin Auth Flow

`/admin` uses Firebase `signInWithEmailAndPassword`. `onAuthStateChanged` listens for a session and redirects to `/admin/dashboard` on login. The dashboard uses `onAuthStateChanged` to guard itself, redirecting to `/admin` if no user is signed in. Logout calls `signOut` and redirects to `/`.

### Key Utility Files

- [src/utilities/database/firebaseClient.ts](src/utilities/database/firebaseClient.ts) — initializes Firebase app, exports `db`, `storage`, `auth`
- [src/utilities/database/firebaseInteractions.ts](src/utilities/database/firebaseInteractions.ts) — `loadAlbumsFromDatabase`, `uploadCoverToCloudinary`, `uploadPreviewAudioToCloudinary`, `submitAlbumToFirebase`
- [src/utilities/audio/trimAudioToWav.ts](src/utilities/audio/trimAudioToWav.ts) — `decodeAudioFile` decodes an uploaded audio file via the Web Audio API; `sliceAudioBufferToWav` slices a decoded buffer from a given start offset for N seconds and re-encodes it as a WAV `Blob`; `computeWaveformPeaks` buckets a decoded buffer into peak amplitudes for waveform drawing; `trimAudioToWav` composes the first two for one-shot use
- [src/components/AudioClipSelector.tsx](src/components/AudioClipSelector.tsx) — admin-only waveform UI (canvas, drawn from `computeWaveformPeaks`) for dragging a fixed-length preview window over an uploaded audio file before it's trimmed and uploaded
- [src/utilities/localStorageHandling.ts](src/utilities/localStorageHandling.ts) — all localStorage read/write helpers
- [src/utilities/types.ts](src/utilities/types.ts) — shared TypeScript types (currently `Album`)
