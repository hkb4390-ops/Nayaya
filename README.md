# StudyModsHrry

A mobile-first course browser (React + TypeScript + Vite) that loads courses, images, nested folders, videos and PDFs from a remote course API through a Vercel Function proxy.

> **Status: code complete, NOT yet verified against the live API, NOT yet built or deployed.**
> See [Verification status](#verification-status) and [Known limitations](#known-limitations).

## Stack

React 18, TypeScript, Vite, React Router 6, plain CSS (custom properties), lucide-react, native `fetch`, a Vercel Function (`api/proxy.ts`), Vitest + Testing Library.

## Structure

```
api/proxy.ts                 Vercel Function: fixed-origin, allow-listed proxy
src/utils/fieldMap.ts        ALL guessed API field names live here (unverified)
src/utils/courseImage.ts     the single course-image extractor/resolver
src/utils/normalizeApiResponse.ts  list/detail/video normalizers
src/utils/contentTree.ts     recursive tree builder + stable keys + toggleKey
src/utils/safeUrl.ts         http(s)-only URL validation
src/services/                apiClient (fetch, timeout, errors), course/video services
src/hooks/                   useAsync (cancellation), useCourses, useCourseDetails, useSavedCourses
src/components/              CourseImage, CourseCard(Grid), FolderTree, VideoPlayer, States, ...
src/pages/                   Home, AllCourses, CourseDetails, MyCourses, Tests, Developer, Video, Pdf, Inspect
```

## Local setup

Prerequisites: Node 18+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173, /api/proxy is forwarded to the upstream API
npm run typecheck
npm test
npm run build
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/proxy` | Base path for API calls (same-origin proxy). |

Never put secrets in `VITE_*` variables; Vite bundles them into browser code. The project needs no secrets.

## API

Upstream: `https://studyapkmod.free.nf/tbapi/api.php`

| Operation | Upstream | Via proxy |
|---|---|---|
| Course list | `?courses` | `/api/proxy?courses` |
| Course details | `?courseid=<id>` | `/api/proxy?courseid=<id>` |
| Video info | `?video=<id>` | `/api/proxy?video=<id>` |

The proxy only allows those three operations, validates IDs (`[A-Za-z0-9_-]{1,64}`), has a 12 s timeout, never forwards arbitrary URLs, and returns a 502 JSON error (not HTML) when upstream misbehaves.

## Verification status

**Confirmed**
- Pure logic (image extraction, URL safety, list/detail/video normalization, tree building, stable keys, toggle logic) passes 18 assertions run with `tsx`, and those modules type-check under `tsc --strict`.

**Not confirmed (could not be tested)**
- Every upstream response: during development all requests to `studyapkmod.free.nf` were rejected by bot detection, so **no real response was ever seen**. Field names in `src/utils/fieldMap.ts` are *candidates*, not facts. This includes the image field, ID field, folder/child containers, video ID/URL fields and PDF URL fields.
- Whether the upstream host accepts requests from Vercel's servers. Free hosts with bot protection often return an HTML challenge page to server-side clients; the proxy reports that as a 502 with an explanatory message instead of passing it on.
- `npm install`, `npm run build`, `npm test` (Vitest/React component tests) and the dev server: the sandbox's network policy blocked the npm registry, so these have **not been run**. The Vitest suites in `src/**/*.test.ts(x)` are written but unexecuted.
- GitHub push and Vercel deployment: not performed.

## Verifying the field mappings (do this first)

1. Run the app (`npm run dev` or the Vercel deployment) and open **`/inspect`**.
2. Click *Fetch courses*. Check the shape summary and the reported "First record image value".
3. Paste a real course ID into *Fetch course* and check title, image and content-node count; paste a video ID into *Fetch video*.
4. If something is wrong, edit the lists in `src/utils/fieldMap.ts` (and `upstreamBase` if images are served from another origin).
5. If `/inspect` shows "Upstream returned an HTML page instead of JSON", the host is blocking server-side requests and no code change in this repo can fix that; you would need the API owner to allow it or provide an alternative endpoint.

## Behaviour notes

- **Images:** every component uses `getCourseImage()`. It checks the candidate fields (string or nested object), resolves relative paths against `upstreamBase`, rejects non-http(s) schemes, and `CourseImage` falls back (once, no loop) if the file fails to load. If no field matches, the fallback tile is shown; nothing is invented.
- **Folder tree:** nodes are classified by an explicit type field if present, otherwise by video-ID / `.pdf` URL / presence of a child container. Keys are `parentKey/<id or slug(title)>` (suffixed on collisions), so they are deterministic. Expanded state is one `Set<string>` of keys, so siblings are independent, descendants keep their state when a parent is collapsed, and empty folders are disabled with no `aria-expanded`. Unrecognised items render as "Unsupported" rows.
- **Video:** the video ID is resolved through `?video=`; a recognised direct file URL uses `<video>`, `embed*` fields use a sandboxed iframe, anything else shows only an "Open video source" link. HLS may not play inline in every browser.
- **PDF:** route is `/pdf?url=…&title=…` (not `/pdf/:lessonId`, since the API gives a URL, not a lesson ID). The URL must be http(s); embedding may be blocked by the host, so an open-in-new-tab button is always shown.
- **My Courses:** saved IDs in `localStorage` only (no sync); IDs no longer in the API are reported, not shown.
- **Tests page:** honest empty state; the API has no known test endpoint.
- No class/category selector or banner carousel: there is no verified data to back them.

## GitHub

```bash
git init
git add .
git commit -m "Initial StudyModsHrry website"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Vercel

1. Push to GitHub, then *Add New → Project* in Vercel and import the repo.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. Environment variables: none required (optional `VITE_API_BASE_URL`).
4. Deploy, then open `/inspect` on the production URL and follow *Verifying the field mappings*.
5. Refresh a nested route such as `/course/<id>` to confirm the SPA rewrite in `vercel.json` (it excludes `/api/*`).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "The course server could not be reached" / 502 HTML-challenge message | Upstream host blocks server-side requests. |
| Courses load but none appear | Field names differ; check `/inspect` and `fieldMap.ts`. |
| Cards show "Image unavailable" | No matching image field, URL 404/blocked, or http image on an https page (mixed content). |
| Video page says "No playable source found" | Video response field not in `FIELD_MAP.videoUrl`. |

## Known limitations

- Unverified upstream structure (see above); classification heuristics may need tuning once real data is seen.
- `http://` image/media URLs are not upgraded and will be blocked by browsers on https pages.
- No DRM/auth handling; protected media is not bypassed.
