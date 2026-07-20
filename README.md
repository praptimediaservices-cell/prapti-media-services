# Prapti Media Services — ERP

> **One PostgreSQL ledger. Four doors.** A cable-television & fibre-broadband
> billing system in the lineage of [SVS (getsvs.in)](https://www.getsvs.in),
> rebuilt as a single Next.js 16 application where **admin, customer, collector
> and technician** portals all read from — and write to — the same live data.
> Change a balance in the collector's handheld view and the admin dashboard
> re-computes on the next render. No sync jobs, no export/import, no Excel.

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js&logoColor=fff)](https://nextjs.org)
[![Postgres](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=fff)](https://www.postgresql.org)
[![Drizzle](https://img.shields.io/badge/ORM-Drizzle-C5F74F?logo=drizzle&logoColor=000)](https://orm.drizzle.team)
[![Tailwind](https://img.shields.io/badge/CSS-Tailwind_v4-38BDF8?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/Type-Strict_TS-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)

---

## The four doors

Every role gets a workspace tuned to the verbs *they* perform — not a
watered-down slice of the admin screen.

| Portal | Who sits here | What they see | What they *do* |
|---|---|---|---|
| 🛡️ **Admin** | Owner / operator | Full ledger, every zone, cash in transit, STB stock, open tickets | Registers subscribers & tariffs, runs the monthly billing batch, **settles a collector's cash**, dispatches engineers, logs expenses |
| 👤 **Customer** | Subscriber (`PMS###`) | Own outstanding balance, active cable + broadband plans, assigned STB serial, invoice history | **Pays online** (UPI / NetBanking / Cash), raises a support ticket with priority |
| 🤝 **Collector** | Field cash agent (e.g. *Pradip Sah*) | Assigned subscribers + their dues, in-transit cash total | **Logs doorstep collections**, deposits the day's cash to the office |
| 🛠️ **Technician** | Field engineer (e.g. *Amit Sen*) | Dispatched tickets matching their specialty (Cable / Fibre / Both) | Accepts a job, posts resolution notes, **closes the ticket** |

A persistent persona switcher at the top of the screen lets you *demo all four
roles in one tab* — useful for sales demos and for testing the data flow end
to end without juggling logins.

---

## The invariants (read this before you touch the code)

These are the rules the server actions enforce on every write. They are the
reason the four portals never disagree.

> **One payment, four writes.** `payBill` inserts a `collections` row, marks the
> matching `bills` paid (handling partial payments across multiple invoices),
> decrements the customer's outstanding `balance`, and credits the collector's
> in-transit `balance` — inside a single server action.

> **Collector balance = cash not yet handed to the office.** `settleCollector`
> zeroes that balance and timestamps every still-`Pending` collection row for
> that collector in one pass.

> **Complaints carry type + priority + assigned technician.** Closing a ticket
> stamps `closedDate` and stores the engineer's resolution comment; the admin
> desk and the customer's history both reflect it immediately.

> **Empty database? The homepage seeds itself.** On first load, if the `areas`
> table is empty, `seedDatabase()` populates realistic zones, collectors,
> engineers, tariffs, subscribers, invoices, collections, complaints, STB stock
> and expenses. A brand-new deploy is never a blank screen.

---

## Data model at a glance

Ten relational tables, all under `src/db/schema.ts`, pushed to Postgres with
`drizzle-kit push` (no migration ceremony for a demo-class system):

| Table | Purpose |
|---|---|
| `areas` | Billing zones / distribution territories |
| `collectors` | Door-to-door cash agents; `balance` = unsent cash |
| `technicians` | Field engineers with a `specialization` tag |
| `service_plans` | Cable & broadband tariffs (monthly charge + tax) |
| `customers` | Subscribers; `balance` = outstanding ledger debt |
| `bills` | Invoices; status flips `Unpaid → Paid` on payment |
| `collections` | Cash/UPI/Card receipts; `settlement_status` tracks office handover |
| `complaints` | Support tickets with priority + assignment + resolution |
| `stb_inventory` | Set-top boxes by serial — `New` / `Used` / `Faulty` |
| `expenses` | Operational outgo: cable, internet, overheads |

---

## Why it feels fast (the *getsvs.in* requirement)

- **Server Actions, not a REST layer.** Writes go straight from the form to a
  typed Postgres query — no client-side fetch, no JSON serialization of a
  second API.
- **System-font stack.** Zero webfont download, zero FOUC, zero layout shift
  on slow 2G collector connections. The crimson `#881b4c` brand and slate
  panels do the visual work, not a 300 KB font file.
- **`force-dynamic` only on the dashboard.** The data page always reads fresh;
  everything else lets Next cache aggressively.
- **Secrets stay server-side.** `DATABASE_URL` is read only inside route
  handlers and server components — it never reaches the browser bundle.

---

## Run it locally (≈ 60 seconds)

```bash
# 1. Unpack and enter
unzip prapti-erp.zip -d prapti-erp && cd prapti-erp

# 2. Install
npm install

# 3. Give it a database connection string
cp .env.example .env
#    edit .env → set DATABASE_URL to your local Postgres

# 4. Create the tables (idempotent)
npx drizzle-kit push

# 5. Go
npm run dev        # open http://localhost:3000
```

First visit auto-seeds the demo data. To **reset** at any time, hit the
*Reset & Seed* button in the top bar, or `curl localhost:3000/api/seed`.

---

## Take it live (make it public, like getsvs.in)

The fastest credible stack for a Next.js + Postgres app is **Vercel + Neon**:

```bash
# 1. Provision a free Postgres at neon.tech → copy the connection string.

# 2. Deploy
npm i -g vercel
vercel login
vercel link

# 3. Hand the secret to the host (never paste it into code)
vercel env add DATABASE_URL production     # paste the Neon string

# 4. In the Vercel dashboard → Settings → General → Build Command, set:
#       npx drizzle-kit push && next build
#    (this creates the tables on every deploy, then builds.)

vercel --prod
```

Open the URL Vercel prints. The homepage sees an empty `areas` table and seeds
itself. You now have a public, data-safe, multi-portal ERP. Every subsequent
`git push` to GitHub redeploys automatically.

> ⚠️ **Harden before you share the URL.** `/api/seed` is intentionally open so
> demos can self-heal. For a real deployment, either delete
> `src/app/api/seed/route.ts` or guard it with an env-based token — otherwise
> anyone can wipe and reseed your production data with one GET request.

---

## Repo layout

```
src/
├── app/
│   ├── page.tsx              # server component — queries all 10 tables, seeds if empty
│   ├── dashboard-client.tsx  # the 4-portal UI (client component)
│   ├── actions.ts            # every write: payBill, settleCollector, updateComplaint, …
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── health/route.ts   # liveness probe
│       └── seed/route.ts     # demo reset endpoint
└── db/
    ├── index.ts              # drizzle client
    ├── schema.ts             # 10 tables
    └── seed.ts               # realistic seed data
drizzle.config.json
next.config.ts
```

---

## Status

Built as a single-session, full-stack reference implementation. Schema, server
actions, seed, and all four portals are wired and type-checked under
`typescript --strict`. Treat it as a starting point: add authentication,
per-portal route protection, PDF invoice generation, and SMS/WhatsApp bill
reminders when you take it to real subscribers.

*Prapti Media Services ERP — Next.js 16 · PostgreSQL · Drizzle · Tailwind v4.*
