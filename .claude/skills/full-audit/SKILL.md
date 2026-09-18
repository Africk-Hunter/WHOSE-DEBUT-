---
name: full-audit
description: Run a deep, combined quality-and-security audit of this codebase (WHOSE DEBUT?, a React 18 + TypeScript + Vite + Firebase + Cloudinary + EmailJS app). Covers five things in one pass — logic/correctness bugs, inefficient algorithms, cleaner/simpler patterns, general improvement opportunities, and a dedicated security-auditor pass for vulnerabilities (Firestore rules, Cloudinary unsigned upload abuse, localStorage trust boundaries, XSS, auth flow, secrets/env handling). Broader and deeper than a normal diff review by default: it scans the whole repo, not just pending changes, unless told to scope to a diff/branch/PR. Use this whenever the user asks to "audit the codebase," "find bugs," "find vulnerabilities," "review everything," "check for issues," "find improvement opportunities," "clean this up," "find inefficient code," or asks Claude to act as a security auditor — even if they only mention one of the five categories, since this skill is the combined, more-thorough version of the narrower code-review/security-review skills.
---

# Full Audit

A single deep pass over the codebase that reports findings across five categories at once, instead of a narrow diff review. Default scope is the **whole repository**, not just uncommitted changes — only narrow to a diff, branch, or specific path if the user asks for that explicitly.

## Why one pass, not five

The five categories below overlap in practice — a logic bug is often also the inefficient part, and a security hole is often also the "cleaner pattern" fix. Reading each file once with all five lenses active avoids re-reading the same code five times and lets one file's context (e.g. "this reads from localStorage which any other JS on the page could have written") inform more than one finding.

## Step 1 — Orient

Read [CLAUDE.md](../../../CLAUDE.md) if you haven't already this session — it documents the data flow (Firestore → localStorage → all other pages read only from localStorage), the Firebase/Cloudinary/EmailJS integration points, and the auth flow. This project's biggest risk surface is exactly at those integration seams, so know them before scanning.

Determine scope:
- No scope given → audit the whole working tree (respect `.gitignore`; skip `node_modules`, build output, lockfiles).
- User says "the diff" / "my changes" / "branch X" / "PR #N" → scope to that instead, using `git diff`/`git log` as appropriate.
- User names a file/folder → scope to that, but still check how it's *used* elsewhere (e.g. don't review `localStorageHandling.ts` without checking who trusts its output).

## Step 2 — Read, don't guess

Use Grep/Glob to map the surface area (components, pages, `utilities/database/*`, `utilities/*`), then Read full files rather than excerpts for anything under review — partial reads miss the context that turns a plausible-looking line into an actual bug. For anything touching Firebase, also check for Firestore/Storage security rules files if present in the repo; their absence or over-permissiveness is itself a finding.

## Step 3 — Evaluate against all five lenses

For every file in scope, hold these five questions open simultaneously:

**1. Logic / correctness bugs**
Wrong conditionals, off-by-one errors, stale closures over state, race conditions (e.g. between the `Main` page's localStorage clear-and-refetch and any component reading localStorage before it resolves), incorrect null/undefined handling, mismatched types papered over with `any` or `as`, event handlers that fire in the wrong order or reference stale props.

**2. Inefficient algorithms / data handling**
O(n²) where O(n) is available (e.g. repeated `.find()`/`.filter()` inside loops over albums), unnecessary re-renders (missing memoization on expensive derived lists, new object/array literals in render passed as props/deps), re-parsing or re-sorting data already sorted upstream, redundant Firebase/Cloudinary calls where localStorage already has the answer per the project's data-flow contract.

**3. Cleaner / simpler patterns**
Duplicated logic that should be a shared utility (especially across `Archive.tsx`/`ArchiveEntry.tsx`/`albumView.tsx`/`adminDashboard.tsx`, which all touch album data), prop drilling that a hook could replace, inconsistent naming or file organization, dead code, overly broad `useEffect` dependencies, components doing both data-fetching and rendering that could be split.

**4. General improvement opportunities**
Missing loading/error states around Firebase calls, accessibility gaps (image alt text on album covers, keyboard nav on clickable album cards, form labels in the admin dashboard and About-page contact form), TypeScript looseness (the currently-empty `types.ts` is a signal — flag places that should be sharing a type from there but aren't), inconsistent handling of the `selectedID` localStorage side-channel.

**5. Security — act as a dedicated auditor here, not a quick pass**
Think like an attacker who can run arbitrary JS in the page and control everything in localStorage/the URL, since this app trusts both:
- **localStorage as a trust boundary**: `AlbumView` resolves its album via `selectedID` from localStorage rather than the route param — check what happens with a missing, malformed, or attacker-modified value, and whether anything derived from localStorage is rendered unescaped or used to build a Firestore query/URL.
- **Firestore/Storage rules**: are reads/writes to `albums` actually restricted server-side, or does client-side auth-gating on `/admin/dashboard` do all the work? A logged-out user hitting Firestore directly should not be able to write.
- **Cloudinary unsigned upload**: unsigned presets accept uploads from anyone who has the cloud name + preset (both are public `VITE_` env vars, visible in the built bundle). Check for missing upload restrictions (file type/size limits, folder scoping) on the Cloudinary dashboard side, and whether the app validates `secure_url`/file type before trusting Cloudinary's response.
- **XSS**: any `dangerouslySetInnerHTML`, unescaped rendering of artist-submitted text (`artist_review`, `from_a_peer`, `name`, `artist`) that another artist or the public submitted.
- **Auth flow**: does `onAuthStateChanged`-based route guarding have a moment where protected content flashes before redirect? Is there any path that trusts a client-side "isAdmin" flag instead of Firebase's own session?
- **Secrets/env handling**: anything that should be a `VITE_`-prefixed *public* var but isn't, or — more dangerously — any secret that got prefixed `VITE_` and shipped into the client bundle when it should stay server-side (Firebase config keys are expected to be public; anything else public-facing should be scrutinized).
- **EmailJS**: check the contact form for unvalidated input reaching the EmailJS template, and whether public/private keys are exposed appropriately for EmailJS's client-side model.
- Standard web app checks still apply where relevant: injection, SSRF-adjacent issues in any fetch built from user input, open redirects, dependency vulnerabilities (`npm audit` if asked to go that deep).

## Step 4 — Verify before reporting

A finding is only worth reporting if you can point to the concrete input or sequence that breaks it. Before including something, ask: what value, user action, or attacker step actually triggers this? If you can't state that in one sentence, either dig deeper (read the calling code, check how the value is produced) or drop it. This is what separates a real audit from a pattern-matching guess.

## Step 5 — Report

If the `ReportFindings` tool is available, use it — call it once with every verified finding, most severe first (security vulnerabilities with a real exploit path outrank style nits), empty array if nothing survived verification. Use `category` values like `security`, `correctness`, `efficiency`, `simplification`, `improvement` so the categories stay visible in the output.

If `ReportFindings` is not available, print the same structure as plain text, grouped by severity, in this shape per finding:

```
### [SEVERITY] short_summary
**File**: path:line
**Category**: security | correctness | efficiency | simplification | improvement
**Issue**: one-sentence statement of the defect
**Concrete failure**: the specific input/state → wrong output/crash/exploit
```

Do not pad the report with restated context or a summary paragraph — the findings list is the deliverable. If the user asked to also fix issues, wait for their go-ahead on which findings to act on rather than patching everything unprompted, since some "findings" (especially security ones involving Firestore rules or Cloudinary dashboard config) require changes outside the codebase that Claude can't verify are safe to make alone.
