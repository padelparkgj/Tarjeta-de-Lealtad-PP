# Padel Park Gran Jardín — Tarjeta de Lealtad

Loyalty card PWA for a padel club. Plain React 18 (UMD build) + Babel
standalone loaded via CDN `<script>` tags — no build step, no bundler.
Two separate single-page apps sharing the same Supabase backend:

- `Landing Page.html` + `app.jsx` — member-facing app
- `Admin.html` + `admin.jsx` — reception/admin panel

## Versioning (IMPORTANT — do this on every change)

Both apps have a hidden Easter egg (6 taps on the logo) that shows a
version number:

- `app.jsx` → `EasterEgg` component → `.ee-version` text
- `admin.jsx` → `AdminEasterEgg` component → `.ee-version` text

**Whenever you make ANY change to the web app** (either file, any
feature or fix), bump the version number in both places so it stays in
sync. Use a simple `vX.Y` scheme — bump the minor number for a normal
round of changes, the major number only for a large rewrite. Keep the
version identical in both `app.jsx` and `admin.jsx` (they're one
product, versioned together) even if a change only touched one of the
two apps.

## Other notes

- No build tooling — validate JS changes with `npx esbuild <file> --loader:.jsx=jsx --outfile=/tmp/out.js` before committing, since there's no compiler to catch syntax errors otherwise.
- GitHub Pages deploys directly from the `claude/landing-page-implementation-lonkq` branch (not `main`) — pushes to that branch go live automatically within ~1 minute.
- Supabase schema has no migrations file in this repo; new tables/policies are handed to the user as a SQL block to run manually in the Supabase SQL editor.
- Service worker (`sw.js`) uses network-first + active `registration.update()` checks on focus/visibility so installed PWAs pick up new deploys without a manual reinstall.
