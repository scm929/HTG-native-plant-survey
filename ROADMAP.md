# Roadmap

Work through tasks in order. Each phase builds on the previous. Read `CLAUDE.md` and `MISSION.md` before starting.

---

## Phase 1 — Field Tool

### Task 1: Project scaffold — COMPLETE

- Create the file structure defined in `CLAUDE.md`
- `index.html` — mobile shell with correct viewport meta tag, links to `style.css` and `app.js`
- `manifest.json` — PWA manifest: name "Native Plant Survey", short name "Plant Survey", theme color green (`#2d7a2d`), display mode `standalone`, background color white
- `sw.js` — minimal service worker that satisfies Safari PWA install requirements (no offline caching needed yet)
- `style.css` — mobile-first base styles: system font stack, large tap targets (min 56px), no horizontal scroll, safe area insets for iPhone notch
- Confirm the project opens in Safari on iPhone without errors before moving on

### Task 2: Supabase setup guide — COMPLETE

Write `SUPABASE_SETUP.md` — a plain-English, step-by-step guide for a non-technical user to:
1. Create a free Supabase account at supabase.com
2. Create a new project (note: free tier allows 2 projects)
3. Run the SQL from `CLAUDE.md` to create the `observations` table and enable RLS policies
4. Enable Google as an OAuth provider in Supabase Auth (Authentication → Providers → Google)
5. Disable public sign-ups (Authentication → Settings → toggle off "Enable sign-ups")
6. Find and copy the project URL and publishable key (Settings → API Keys) into the constants in `app.js`

Guide is written and Supabase is fully configured — `observations` table created, RLS enabled, Google OAuth wired up, sign-ups disabled, and `app.js` populated with the live project URL and publishable key.

### Task 3: Google authentication — COMPLETE

In `index.html` and `app.js`:
- Import Supabase JS v2 from CDN (see `CLAUDE.md`)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are already set in `app.js` with live values — do not overwrite them
- On page load: check session state
  - Not logged in → show full-screen login view with "Sign in with Google" button, nursery name, and brief description
  - Logged in → show field tap interface
- Handle OAuth redirect callback correctly so user lands back in the app after Google login
- Show logged-in user's email in small text at top of screen with a "Sign out" link

Implemented and working. Two gotchas encountered and resolved:
- The Supabase CDN UMD bundle declares a global variable named `supabase` — naming our client `const supabase` caused a collision. The client variable is named `client` in `app.js`.
- Sign-ups must be **enabled** when both owners first log in (to create their accounts), then disabled. The setup guide has been updated to reflect this ordering.

### Task 4: GPS and reverse geocoding — COMPLETE

Implemented. Known issue discovered in field testing: Nominatim uses address interpolation for areas where individual houses aren't mapped in OpenStreetMap, producing house numbers that don't exist (e.g. "156 Maple St" when no such house exists). GPS coordinates are accurate — only the address label is unreliable. Fix planned before Task 6: show street name only, drop the house number.

A live coordinate display (`lat, lng` in small text under the address) was added temporarily for debugging. Field-confirmed: coordinates are accurate. Remove this once the address issue is resolved.

### Task 5: Yes / No tap interface — COMPLETE

Implemented. Known issue: a save failure was observed in field testing. The current error message ("Save failed — tap again to retry") does not expose the underlying Supabase error, making it hard to diagnose. Fix needed at start of next session: surface the actual error detail so we can identify the root cause (likely an expired session, RLS policy issue, or network problem).

### Task 6: GitHub Pages deployment

- Add `README.md` with brief human-readable description and link to `SUPABASE_SETUP.md`
- Verify all file paths are relative — GitHub Pages requires this
- Confirm `manifest.json` and `sw.js` are in the repo root
- Add instructions to `README.md` for enabling GitHub Pages: Settings → Pages → Deploy from `main` branch, root folder (`/`)

**Phase 1 complete when:** Both users can install the app on their iPhones via Safari "Add to Home Screen", log in with Google, walk a street, and tap Yes or No for each house. Data appears in the Supabase table. Address (or street name) shows correctly at the top of the screen. Save failure bug resolved.

---

## Phase 2 — Dashboard

### Task 7: Dashboard scaffold

- Create `dashboard.html` and `dashboard.js`
- Add "View Map →" link from `index.html` to `dashboard.html`
- Import Leaflet.js from CDN
- Initialize Leaflet map centered on Lancaster, Pennsylvania (lat: 40.0379, lng: -76.3055), zoom level 13
- Use OpenStreetMap tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with correct attribution
- Require login — if not authenticated, redirect to `index.html`

### Task 8: Load and render observations

In `dashboard.js`:
- Fetch all rows from `observations` table after auth is confirmed
- Render each as a Leaflet circle marker:
  - Green (`#2d7a2d`, opacity 0.85) for `has_natives = true`
  - Red (`#c0392b`, opacity 0.85) for `has_natives = false`
  - Radius: 8px, white border 1.5px
- Popup on each marker: address, Yes/No, date recorded (formatted as "May 10, 2026"), recorded by (user email)
- Show a loading spinner while data fetches
- Show an error message if the fetch fails

### Task 9: Legend and controls

- Map legend (top-right corner): green dot = native plants, red dot = no native plants
- Toggle checkboxes: show/hide Yes markers and No markers independently
- Summary count below legend: "X yes · Y no · Z total"
- Controls must be readable and tappable on iPhone

### Task 10: Unsurveyed area indicator

Simple approach — do not over-engineer:
- Add a note in the legend: "Areas without dots have not been surveyed"
- The absence of markers is the visual cue; no need for overlay polygons at this stage
- Revisit in Phase 3 if a more explicit unsurveyed overlay is needed

**Phase 2 complete when:** Both users can open the dashboard, see all their observations on the map as colored dots, toggle layers, and see total counts.

---

## Phase 3 — Analytics (future — do not build yet)

- Task 11: Coverage percentage by street or neighborhood
- Task 12: Hotspot detection — streets near the 25% native coverage threshold
- Task 13: Target list view — ranked streets sorted by proximity to 25%
- Task 14: CSV export — YES observations only (has_natives = true), for marketing postcard outreach. Columns: address, latitude, longitude, date. Consider re-geocoding coordinates via Google at export time to get accurate addresses, since Nominatim is unreliable for individual house numbers.
- Task 15: Date range filter on dashboard
- Task 16: "Add to Home Screen" prompt — nudge users to install PWA if not already installed
- Task 17: Address management — plan and build before implementing. Two distinct use cases need design thought:
  1. **Manual address entry** — adding known addresses from online orders or other sources without physically walking there. Requires forward geocoding (address → coordinates), the reverse of what the field app does. Need to decide: separate form in the dashboard, or a different flow entirely?
  2. **Annual re-survey** — revisiting previously recorded addresses each year to track whether natives were added or removed over time. Requires thinking through the data model: do we store multiple observations per address over time and show a history, or overwrite the existing record? How does the map show change over time? This has implications for the analytics tasks too.
  Design this task before building it — the decisions here affect the database schema and the dashboard.
