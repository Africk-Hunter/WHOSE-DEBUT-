---
name: handoff-review
description: Scrutinize a hand-off — a note, doc, chat summary, or "here's where I left off" from a previous session or another dev — against the actual current state of this codebase (WHOSE DEBUT?, React 18 + TypeScript + Vite + Firebase + Cloudinary + EmailJS), then produce a dependency-ordered implementation plan to finish the work correctly. Use this whenever the user pastes or points to a handoff/transition note, says they're "picking up where someone left off," asks to "sanity-check this plan against the code," resumes a previous session's described progress, or hands you a spec/ticket and asks whether it's still accurate before you implement it. Do not just take the handoff's claims at face value — this skill exists specifically to catch places where the handoff is wrong, stale, or silent about something that matters.
---

# Handoff Review

A handoff document is a claim about the codebase made at a point in time — by a person or a previous session — and code drifts out from under claims constantly. The job here is not to summarize the handoff or politely implement whatever it says; it's to verify every checkable claim against what's actually in the repo right now, surface what it left out, and only then plan the work. Treat the handoff the way you'd treat an unverified bug report: useful signal, not ground truth.

## Step 1 — Get the handoff and pin down scope

The handoff might be pasted text, a file the user names, or something informal like "pick up where I left off on the genre filter" pointing at conversation context rather than a document. If it's the latter, use `git status` / `git diff` / `git log` to reconstruct what "where I left off" actually refers to — uncommitted changes and recent commits are the real handoff in that case, and the user's sentence is just a pointer to them.

If the handoff references a specific feature, file, or area, scope your verification there but don't stop at the boundary the handoff drew — a handoff that only mentions `Archive.tsx` but whose claims actually depend on `localStorageHandling.ts` or Firestore field names needs those checked too.

## Step 2 — Break the handoff into atomic, checkable claims

Read through the handoff once and pull out every discrete factual claim, not just the "next steps" section. Each of these is a separate thing to verify:

- **File/component/function/route references** — does the named thing exist, and does it still do what the handoff says it does?
- **"Already done" statements** — anything phrased as complete or working. These are the highest-value claims to check because if wrong, they cause duplicate or conflicting work.
- **Data-shape assumptions** — Firestore field names, `localStorage` keys, prop shapes, types. Check them against [src/utilities/types.ts](../../../src/utilities/types.ts), [src/utilities/database/firebaseInteractions.ts](../../../src/utilities/database/firebaseInteractions.ts), and [src/utilities/localStorageHandling.ts](../../../src/utilities/localStorageHandling.ts) rather than trusting the handoff's paraphrase.
- **Architecture/flow assumptions** — e.g. claims about when Firebase is called vs. when localStorage is read. Cross-check against [CLAUDE.md](../../../CLAUDE.md)'s "Data Flow" section — but don't trust CLAUDE.md blindly either if the handoff is more recent than the last time CLAUDE.md was updated; a stale doc citing a stale doc is still stale.
- **Environment/config assumptions** — env var names, Cloudinary preset behavior, EmailJS IDs. Check against `.env` keys actually consumed in [firebaseClient.ts](../../../src/utilities/database/firebaseClient.ts) and wherever Cloudinary/EmailJS are called.
- **Next-step instructions** — treat these as claims too: does the described next step still make sense given what you find in steps above, or has the prerequisite it assumes already changed underneath it?

## Step 3 — Verify, don't infer

For every claim, actually open the file and read it — grep for the named function/field/route and confirm both that it exists and that its current behavior matches the description, not just that a similarly-named thing exists somewhere. If the handoff describes behavior (e.g. "clicking an album saves it to localStorage and navigates"), trace that path in the code rather than assuming the description is accurate because it sounds plausible and matches the general architecture.

If the handoff is about work in progress, check `git diff` and `git status` for uncommitted changes — the real state of "what's done" often lives there, not in the prose description of it.

Classify each claim as one of:
- **Confirmed** — matches current code, cite the file:line that proves it.
- **Outdated / wrong** — code has moved on, or the claim was never accurate. Cite the file:line that contradicts it and explain the delta.
- **Unverifiable** — references something (an external dashboard config, a manual Firebase Console step, a conversation not in the repo) that can't be checked from the codebase alone. Say so explicitly rather than silently dropping it.

## Step 4 — Find what the handoff didn't say

A correct-as-far-as-it-goes handoff can still be incomplete. After verifying the explicit claims, look for what's missing given this repo's known trouble spots:
- Loading/error states around the Firebase/Cloudinary calls the handoff touches
- Edge cases in the `selectedID` localStorage side-channel (missing/stale value, direct link to `/album/:albumId` with nothing in localStorage yet)
- Whether new fields were added to Firestore usage but not to [types.ts](../../../src/utilities/types.ts)
- Mobile/responsive coverage if the change touches styling (check [mobile.scss](../../../src/styles/mobile.scss) and whichever component-specific `.scss` file is relevant)
- Whether a UI change interacts with the scroll-snap behavior on `/` (anything added to `Main` or its sections needs to account for the archive's scroll-snap-disabling listener)
- Auth-guard consistency if the change touches `/admin` or `/admin/dashboard`
- Anything the handoff's own "next steps" implies is needed but doesn't actually list (e.g. it says "wire the filter to state" but never mentions how filtered results interact with the existing sort-by-`year_released` order)

## Step 5 — Build the implementation plan

Order steps by dependency, not by the order the handoff mentioned them in. Fix incorrect foundations before building on them — if a claim in Step 3 was "outdated/wrong" and later steps depend on the wrong version, the plan needs to correct that first or explicitly account for it. For each step give: what changes, which files, why (tie it back to the specific discrepancy or gap it addresses), and anything that needs a decision only the user can make (e.g. a Firestore field rename touching existing documents, a Cloudinary/Firebase Console change outside the codebase).

Don't start implementing unless the user asks you to after seeing the plan — this skill's deliverable is the report and plan, not the code.

## Report format

Use this structure, in this order. Skip a section only if it's genuinely empty (say so in one line rather than omitting silently).

```
## Handoff source
[what was reviewed — pasted text, file, or reconstructed from git state — in one line]

## Discrepancies found
[One entry per outdated/wrong claim. Skip confirmed claims unless the user asked for full verification — the point of this report is what's wrong, not restating what's right.]

- **Claim**: [what the handoff said]
  **Reality**: [file:line and what's actually there]
  **Impact**: [what breaks or gets duplicated if this is trusted as-is]

## Gaps / missing pieces
[Things the handoff should have addressed but didn't, from Step 4]

## Implementation plan
1. [Step — files touched — why, referencing the discrepancy/gap it resolves]
2. ...
[Call out any step that needs a decision from the user before proceeding]
```

If every claim checks out and there are no gaps, say that plainly and give the plan for the remaining/next-step work only — don't manufacture discrepancies to fill the section.
