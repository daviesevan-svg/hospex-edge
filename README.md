# hospex-edge

Hotel PMS calendar running on **Cloudflare Workers** — an edge-native sibling
of [Hospex](https://github.com/daviesevan-svg/CorePMS).

This is a scaffold to test whether the Workers stack is viable for a property
management system. v0.1 ships **only the calendar grid with in-memory mock
data** so you can deploy it in one command and see how it feels at the edge.

> **Status:** scaffold / proof of concept. No persistence, no auth, no OTA
> sync yet. See "Roadmap" below.

## Stack

| Layer       | Choice                                                |
|-------------|-------------------------------------------------------|
| Runtime     | Cloudflare Workers (V8 isolates)                      |
| Framework   | [Hono](https://hono.dev) (router + JSX)               |
| UI          | Server-rendered JSX + [HTMX](https://htmx.org) for interactivity |
| Styling     | Hand-rolled CSS (dark theme, slim port of Hospex)     |
| Data (v0.1) | In-memory mock                                        |
| Data (v0.2+)| D1 (SQLite)                                           |
| Concurrency (v0.3+) | Durable Object per property — serializes bookings, no race conditions |

No build step on the client. No SPA. The whole thing is a few hundred lines.

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:8787>.

## Deploy to Cloudflare

```bash
# one-time
npx wrangler login

# every release
npm run deploy
```

Wrangler will print the `*.workers.dev` URL.

## Project layout

```
src/
  index.tsx          # Hono app + routes
  lib/dates.ts       # ISO date helpers (UTC throughout)
  data/mock.ts       # Ported MockCalendarData — single source of demo bookings
  views/
    layout.tsx       # HTML shell + HTMX
    calendar.tsx     # Grid, room rows, pills
    drawer.tsx       # Booking detail panel
public/
  calendar.css       # All styles
wrangler.toml        # Worker config (D1/DO bindings commented for v0.2)
```

## Roadmap

- **v0.2 — D1 persistence.** Bookings/stays/rooms live in D1. New/edit/cancel
  via HTMX form posts. Bindings already stubbed in `wrangler.toml`.
- **v0.3 — Durable Object per property.** Each property gets a `PropertyDO`
  that owns its booking writes. Concurrent reservation attempts serialize
  naturally — no overbooking races.
- **v0.4 — Auth (Cloudflare Access or Lucia).**
- **v0.5 — R2 for photos.** Same `PhotoStorage` behavior split as Hospex,
  different adapter.
- **v0.6 — Queue consumer for OTA webhooks** (Booking.com, Airbnb, Expedia).
- **v0.7 — Cron Triggers** for nightly close, rate pushes.

## Why this exists

Hospex (the Phoenix sibling) is a great developer experience but needs a
long-running BEAM node. Cloudflare Workers gives a one-command global deploy
for ~$5/month — a much better fit for the "fork-and-host-your-own-PMS" use
case. This repo explores whether the porting is worth it.

## License

MIT
