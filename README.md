# xsia_xarx

[![Rust](https://img.shields.io/badge/Rust-2024_Edition-orange?logo=rust)](https://www.rust-lang.org/)
[![Salvo](https://img.shields.io/badge/Salvo-v0.95-blue)](https://salvo.rs/)
[![SeaORM](https://img.shields.io/badge/SeaORM-v2.0-teal)](https://www.sea-ql.org/SeaORM/)
[![SolidJS](https://img.shields.io/badge/SolidJS-v1.9-blueviolet?logo=solid)](https://www.solidjs.com/)
[![SolidStart](https://img.shields.io/badge/SolidStart-v2.0-4488ee)](https://start.solidjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`xsia_xarx` is an enterprise-grade, high-performance academic and institutional information management platform. Built as a unified full-stack monorepo, it pairs an asynchronous, multi-threaded **Rust** backend engine with a high-speed, reactive **SolidJS (SolidStart)** frontend.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Monorepo Structure](#-architecture--monorepo-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Environment Configuration](#-environment-configuration)
  - [Server Environment (`server/.env`)](#server-environment-serverenv)
  - [Settings Stored in the Database](#settings-stored-in-the-database)
  - [Client Environment (`client/.env`)](#client-environment-clientenv)
- [Quick Start](#-quick-start)
  - [1. Backend Setup (`server/`)](#1-backend-setup-server)
  - [2. Frontend Setup (`client/`)](#2-frontend-setup-client)
- [API Documentation & Swagger UI](#-api-documentation--swagger-ui)
- [Real-time Communication & WebSockets](#-real-time-communication--websockets)
- [Inbound Webhooks](#-inbound-webhooks)
- [Database Migrations & Entity Generation](#-database-migrations--entity-generation)
- [Background Workers & Task Runner](#-background-workers--task-runner)
  - [PDDikti Feeder Synchronization Hierarchy](#3-pddikti-feeder-downstream-master-synchronization-hierarchy)
- [Testing & Quality Assurance](#-testing--quality-assurance)
  - [1. Backend Testing (`server/`)](#1-backend-testing-server)
  - [2. Frontend Testing (`client/`)](#2-frontend-testing-client)
  - [3. Frontend Production Build (`client/`)](#3-frontend-production-build-client)
- [Python Tools (autocrop & docling)](#-python-tools-autocrop--docling)
- [Production Deployment (Rocky Linux 10)](DEPLOYMENT.md)
- [License](#-license)

---

## ✨ Key Features

- 🎓 **Academic & Campaign Management**: Student admissions, curricula, academic periods, courses, class scheduling, study plans, and grading.
- 🔄 **PDDikti Feeder Integration**: Synchronization modules for national feeder databases (accounts, references, accumulations, recapitulations).
- 🛡️ **Robust Auth & RBAC**: JWT-based authentication, session authentication, Argon2/bcrypt password hashing, multi-tenant role-based access control, and token verification.
- 🌐 **Full-Duplex Real-Time Communication**: Native WebSocket (`/api/v1/realtime/ws`), Server-Sent Events (`/api/v1/realtime/sse`), and WebTransport handlers.
- 👤 **Person & Identity Registry**: Biodata management, marital status, religion, citizenship, and identity document management.
- 🏛️ **Institutional Architecture**: Multi-level institutional structure, faculties, study programs, campus buildings, and room allocation.
- 📍 **Standardized Master Data**: Hierarchical location catalog (provinces, regencies, districts, villages, postal codes) and contact channels.
- 🤖 **AI & Vector Embeddings**: `pgvector` vector store integration, Rig-core, Candle (Hugging Face), Burn, and Markdown text splitter for semantic search and retrieval.
- ⚡ **Asynchronous Background Processing**: Queue-backed task execution via [PGMQ](https://github.com/pgmq/pgmq) on PostgreSQL (e.g. SMTP email delivery, periodic workers).
- 📄 **Reporting & Utilities**: Headless Chrome PDF generation, `rust_xlsxwriter` Excel spreadsheets, QR code generation, Tera templates, and Fluent i18n localization.

---

## 🏗 Architecture & Monorepo Structure

```text
xsia_xarx/
├── server/                       # High-performance Rust backend service
│   ├── migration/                # Modular SeaORM database migrations
│   │   └── src/
│   │       ├── academic/         # Academic schemas & tables
│   │       ├── auth/             # Authentication & permission tables
│   │       ├── building/         # Infrastructure & building tables
│   │       ├── contact/          # Contact & communication tables
│   │       ├── document/         # Document archive tables
│   │       ├── feeder/           # PDDikti feeder sync tables
│   │       ├── institution/      # Institution & faculty tables
│   │       ├── literate/         # Publication & literacy tables
│   │       ├── location/         # Geo/location tables
│   │       └── person/           # Person, student, staff biodata
│   ├── src/
│   │   ├── config/               # Environment & service configurations
│   │   ├── controllers/          # Salvo HTTP route handlers & OpenAPI specs
│   │   ├── dtos/                 # Request & response data transfer objects
│   │   ├── jobs/                 # PGMQ queue job workers (e.g. email)
│   │   ├── mailers/              # Transactional email composers
│   │   ├── middleware/           # Auth guards & request context injectors
│   │   ├── models/               # SeaORM entity models by domain
│   │   ├── services/             # Business logic layer
│   │   └── tasks/                # CLI task runner commands
│   ├── tests/                    # Integration and unit test suites
│   └── Cargo.toml                # Rust dependencies and profiles
│
└── client/                       # Reactive SolidJS modern frontend
    ├── src/
    │   ├── components/           # Reusable UI component library
    │   ├── config/               # Client configuration constants
    │   ├── routes/               # File-based routing (SolidStart)
    │   │   ├── authentification/ # Auth views (Login, register, reset)
    │   │   ├── dashboard/        # Administrative dashboards & workflows
    │   │   └── index.tsx         # Main landing view
    │   ├── app.tsx               # Root application shell
    │   └── app.css               # Global Tailwind CSS v4 styling
    ├── package.json              # Client scripts and dependencies
    └── vite.config.ts            # Vite+ (Vite 8) & SolidStart build configuration
```

---

## 🚀 Tech Stack

### Backend (`server/`)

| Layer / Purpose | Technology | Details |
| :--- | :--- | :--- |
| **Language & Runtime** | [Rust](https://www.rust-lang.org/) (2024 Edition) | Multi-threaded async engine on [Tokio](https://tokio.rs/) v1.45 |
| **Web Framework** | [Salvo](https://salvo.rs/) (v0.95) | HTTP/HTTPS server with OpenAPI & Swagger UI generation |
| **Database & ORM** | [SeaORM](https://www.sea-ql.org/SeaORM/) (v2.0) | PostgreSQL 18, RBAC, Schema Sync, `pgvector`, [Apache AGE](https://github.com/apache/age) |
| **Task Queue & Scheduler** | [PGMQ](https://github.com/pgmq/pgmq) | Native PostgreSQL-backed background job queue & workers |
| **Security & Auth** | JWT, Argon2, Bcrypt | Token signing, verification, secure password hashing |
| **AI / Machine Learning** | Rig-core, Candle, Burn, `text-splitter` | Vector search, embeddings, model inferencing |
| **Reporting & Media** | Headless Chrome, `rust_xlsxwriter`, Lettre, QR Code | Dynamic PDF generation, Excel reports, SMTP email, QR codes |
| **Testing** | `cargo-nextest`, `rstest`, `insta` | Fast parallel test execution and snapshot testing |

### Frontend (`client/`)

| Layer / Purpose | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [SolidJS](https://www.solidjs.com/) (v1.9) + [SolidStart](https://start.solidjs.com/) (v2.0) | Fine-grained reactivity, SSR/CSR, Nitro engine |
| **Build Tool** | [Vite+](https://github.com/voidzero-dev/vite-plus) (v1.1) | Unified `vp` toolchain on [Vite](https://vitejs.dev/) 8: dev server, build, lint & Vitest |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS engine via `@tailwindcss/vite` |
| **Data & State Management** | TanStack Solid Form & Table | Robust form handling and virtualized data grids |
| **Visualizations & Maps** | TanStack Charts, OpenLayers (`ol`) | Interactive charts and GIS mapping capabilities |
| **UI Components & Rich Text** | Slim Select, Quill, Toastify JS, Floating UI | Rich text editing, toast notifications, popovers |

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Rust**: Version `1.97.1+` (or latest stable supporting edition 2024)
- **Bun**: [`v1.4.3+`](https://github.com/oven-sh/bun) — package manager, script runner, and runtime for the client (replaces Node.js)
- **Vite+**: [voidzero-dev/vite-plus](https://github.com/voidzero-dev/vite-plus) — installed as a `client/` dev dependency; all frontend scripts run through its `vp` CLI
- **PostgreSQL**: `v18` with [pg_uuidv7](https://github.com/fboulnois/pg_uuidv7), [pgvector](https://github.com/pgvector/pgvector), [pgmq](https://github.com/pgmq/pgmq), and [Apache AGE](https://github.com/apache/age) extensions (see [Database Requirement](#4-database-requirement))
- **SeaORM CLI**: Installed via Cargo:

  ```bash
  cargo install sea-orm-cli
  ```

- *(Optional)* **cargo-nextest**: For ultra-fast test execution:

  ```bash
  cargo install cargo-nextest --locked
  ```

- **uv** + **autocrop** + **docling**: Python CLI tools for face-cropping photos and converting documents (see [Python Tools](#-python-tools-autocrop--docling))

---

## ⚙ Environment Configuration

### Server Environment (`server/.env`)

Create a `.env` file in the `server/` directory (refer to `.env.production.example` or `.env.dev.*` files):

```env
# Application Mode
ENV=development
SERVER_DOMAIN="127.0.0.1:5800"
SERVER_PORT=5800

# Database Configuration
DATABASE_URL="postgres://postgres:password@localhost:5432/xsia_xarx"
DATABASE_URL_TEST="postgres://postgres:password@localhost:5432/xsia_xarx_test"
DB_CONNECT_TIMEOUT=5000
DB_IDLE_TIMEOUT=5000
DB_MIN_CONNECTIONS=5
DB_MAX_CONNECTIONS=50

# Authentication & Security
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION_HOURS=24
# AES-256-GCM key for secrets stored in the database (Feeder, mail server, OpenWA).
# Base64 of 32 bytes; generate with `openssl rand -base64 32`. Changing it makes
# existing encrypted values unreadable.
APP_ENCRYPTION_KEY="generate-with-openssl-rand-base64-32"

# Institution & Academic Context
# The institution comes from the stored Feeder credential (task utility:feeder-add-credential)

# SMTP Mailer Settings
SMTP_HOST="mail.xsia.app"
SMTP_PORT=587
SMTP_USER="no-reply@xsia.app"
SMTP_PASSWORD="your-smtp-password"

# External Integrations (PDDikti Feeder / Payment)
# FEEDER_* and SMTP_* are fallbacks: a stored Feeder credential / mail server wins (see below)
FEEDER_USERNAME="feeder_username"
FEEDER_PASSWORD="feeder_password"
FEEDER_URL="http://feeder.example.ac.id/ws/live2.php"
IS_PRODUCTION_MIDTRANS_PAYMENT=false

# Inbound Webhooks (fallback; the active OpenWA settings in the database win)
# Generate with: cargo run -- task utility:preference-generate-webhook-secret (or openssl rand -hex 32)
MIAB_WEBHOOK_SECRET="generate-with-openssl-rand-hex-32"   # POST /api/v1/webhook/mail-in-a-box
OPENWA_WEBHOOK_SECRET="generate-with-openssl-rand-hex-32" # POST /api/v1/webhook/openwa
```

### Settings Stored in the Database

Integration settings live in the database, with secrets encrypted by `APP_ENCRYPTION_KEY`. Store them with the CLI tasks below. The server reads them whenever it needs them, so a change applies without a restart. The matching `.env` keys are only a fallback, used when nothing is stored:

| Setting | Stored by | Table | `.env` fallback |
| :--- | :--- | :--- | :--- |
| Mail server (SMTP host, port, TLS, sender, login) | `utility:preference-add-mail-server` | `preference.mail_servers` (active row) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` |
| OpenWA connection (URL, session ID, operator key) | `utility:preference-add-openwa` | `preference.what_apps` (active row) | `OPENWA_URL`, `OPENWA_API_KEY_SESSION_ID`, `OPENWA_API_KEY_OPERATOR` |
| Webhook secrets | `utility:preference-add-openwa` or `utility:preference-generate-webhook-secret` | `preference.what_apps` (active row) | `MIAB_WEBHOOK_SECRET`, `OPENWA_WEBHOOK_SECRET` |
| PDDikti Feeder login | `utility:feeder-add-credential` | `feeder_akun.kredential` | `FEEDER_URL`, `FEEDER_USERNAME`, `FEEDER_PASSWORD` |
| Current institution | `utility:feeder-add-credential` | `feeder_akun.kredential` → `institution_master.institutions` | none |

**Current institution.** The server serves one institution: the one the stored Feeder credential belongs to. The Feeder estimation and sync tasks need it. There is no `.env` key for it. `CURRENT_INSTITUTION_ID` and `CURRENT_INSTITUTION_CODE` in `server/.env` are no longer read; the client still reads its own copies from `client/.env`. If no credential is stored, Feeder tasks stop with *"No Feeder credential is stored…"*. If credentials exist for more than one institution, they stop with *"…more than one institution…"*; delete the credentials that don't belong to this installation.

A stored row wins over `.env` as a whole: for example, with an active OpenWA row, all OpenWA values come from it and none from `.env`. If the row can't be decrypted (wrong `APP_ENCRYPTION_KEY`), the webhooks answer `500` and the error is logged.

### Client Environment (`client/.env`)

Create a `.env` file in the `client/` directory:

```env
CURRENT_INSTITUTION_ID="ed7e8c02-451b-4548-aa81-26b8d0b7fdec"
CURRENT_INSTITUTION_CODE="092010"
```

---

## 💻 Quick Start

### 1. Backend Setup (`server/`)

1. **Navigate to the server directory**:

   ```bash
   cd server
   ```

2. **Generate the encryption key** (once per environment) and add it to `.env`:

   ```bash
   echo "APP_ENCRYPTION_KEY=\"$(openssl rand -base64 32)\"" >> .env
   ```

   Keep this key safe and don't change it later: secrets already encrypted with it (Feeder, mail server, OpenWA) can't be read with a different key.

3. **Run database migrations**:

   ```bash
   sea-orm-cli migrate up
   ```

4. **Start the server with background email worker**:

   ```bash
   cargo run
   ```

   The backend API will start on `http://127.0.0.1:5800`.

---

### 2. Frontend Setup (`client/`)

1. **Navigate to the client directory**:

   ```bash
   cd client
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Start the development server**:

   ```bash
   bun run dev
   ```

   Open your browser at `http://localhost:3000` (or the port indicated in terminal).

   > ℹ️ The `client/` scripts (`dev`, `build`, `preview`, `lint`, `test:*`) run through the [Vite+](https://github.com/voidzero-dev/vite-plus) `vp` CLI, and `vite` is aliased to `@voidzero-dev/vite-plus-core`. Installing dependencies is enough; you don't need a global `vp`. `vp`'s shebang asks for `node`; with only Bun installed, run scripts as `bun --bun run <script>` so Bun executes it.

---

## 📖 API Documentation & Swagger UI

The backend provides interactive OpenAPI documentation out of the box:

- **Swagger UI**: [http://127.0.0.1:5800/api/v1/swagger-ui/](http://127.0.0.1:5800/api/v1/swagger-ui/)
- **OpenAPI JSON Spec**: [http://127.0.0.1:5800/api/v1/api-docs/openapi.json](http://127.0.0.1:5800/api/v1/api-docs/openapi.json)

### Primary API Routes (`/api/v1/...`)

- `/api/v1/auth` — Authentication, sessions (`/login-with-session`), password reset, token validation
- `/api/v1/realtime` — Full-duplex WebSocket (`/ws`), Server-Sent Events (`/sse`), and WebTransport (`/webtransport`)
- `/api/v1/academic` — Academic years, courses, curricula, student classes, grading
- `/api/v1/person` — Master person records, student biodatas, staff profiles, reference data
- `/api/v1/institution` — Institutional profiles, departments, faculties, programs
- `/api/v1/feeder` — PDDikti feeder synchronization and exchange
- `/api/v1/location` — Geographic master data (provinces, regencies, postal codes)
- `/api/v1/building` — Campus infrastructure and room management
- `/api/v1/contact` — Addresses, telephone, email, and social networks
- `/api/v1/document` — Document archives and attachments
- `/api/v1/literate` — Library and literary catalogs
- `/api/v1/webhook` — Inbound webhooks from other servers ([Mail-in-a-Box and OpenWA](#-inbound-webhooks)), authenticated by shared secret instead of JWT

---

## 🌐 Real-time Communication & WebSockets

When you start the backend using `cargo run`, the server automatically initializes **all real-time communication protocols and background job workers**:

### 1. Active Real-time Protocols & Endpoints

| Protocol | Endpoint | Description |
| :--- | :--- | :--- |
| **WebSocket** | `ws://127.0.0.1:5800/api/v1/realtime/ws` | Full-duplex bidirectional communication with ping-pong latency tracking and JSON/text echo |
| **Server-Sent Events (SSE)** | `http://127.0.0.1:5800/api/v1/realtime/sse` | Continuous server-to-client event stream (heartbeats, status updates, notifications) |
| **WebTransport** | `http://127.0.0.1:5800/api/v1/realtime/webtransport` | Low-latency HTTP/3 transport channels |

### 2. Interactive WebSocket & Real-time Studio

The frontend includes a built-in debugging and interactive real-time studio:

- **Route**: [`/example/websocket`](client/src/routes/example/websocket.tsx)
- **Features**: Live connection lifecycle manager, auto-reconnect, 5s automated heartbeat ping-pong with RTT latency measurement in ms, dual-mode text/JSON payload composer, and SSE event streaming listener.

### 3. Background Job Execution (PGMQ Workers)

In addition to the HTTP and WebSocket endpoints, `cargo run` starts background workers inside the same process. Their queues are stored in PostgreSQL with the [pgmq](https://github.com/pgmq/pgmq) extension, so no Redis or separate worker service is needed:

- **Worker Runtime**: Tokio background tasks started in `main.rs` (`start_email_worker`, `start_pdf_embedding_worker`)
- **Queue Storage**: PostgreSQL / PGMQ (same `DATABASE_URL`)
- **Responsibilities**: Sending transactional emails and embedding uploaded PDFs, without blocking HTTP requests. See [Background Workers](#-background-workers--task-runner) for the queues.

---

## 🪝 Inbound Webhooks

### Mail-in-a-Box

`POST /api/v1/webhook/mail-in-a-box` receives events from a Mail-in-a-Box server and stores each one in `webhook.mail_in_a_box_events` (migration `m20261014_130000_schema_webhook_table_mail_in_a_box_events`). Mail-in-a-Box has no built-in webhook sender, so events are posted by a script on the box (a cron job, a Postfix/Dovecot hook, or a wrapper around the status checks).

**Authentication.** Store the secret in the active OpenWA settings (`utility:preference-add-openwa`) or set `MIAB_WEBHOOK_SECRET` in `server/.env` (see [Settings Stored in the Database](#settings-stored-in-the-database)); while neither is set the endpoint answers `503`. Each request must carry one of:

| Header | Value |
| :--- | :--- |
| `X-Webhook-Signature` (preferred) | `sha256=` + hex HMAC-SHA256 of the raw request body, keyed with the secret |
| `X-Webhook-Secret` | the secret itself (only over HTTPS) |

If a signature header is present it is the one checked. A missing or wrong secret returns `401`.

**Payload.**

```json
{
  "event": "mail.bounced",
  "id": "box-1697289600-42",
  "occurred_at": "2026-10-14T12:00:00Z",
  "hostname": "box.example.com",
  "data": { "from": "noreply@example.com", "to": "user@example.org", "reason": "550 5.1.1 user unknown" }
}
```

| Field | Required | Notes |
| :--- | :--- | :--- |
| `event` | yes | Dotted lowercase name, e.g. `mail.received`, `mail.sent`, `mail.bounced`, `mailbox.created`, `mailbox.deleted`, `alias.created`, `status_check.failed` |
| `id` | no | Unique id from the sender. A repeated `id` returns `200` with `"duplicate": true` and is not stored again |
| `occurred_at` | no | RFC 3339 timestamp, stored as UTC |
| `hostname` | no | The box that sent the event |
| `data` | no | Any JSON object; the whole request body is stored in the `payload` column |

**Responses.** `200 {"id": "<uuid>", "duplicate": false}` on success, `400` for invalid JSON or fields, `401` for a bad secret, `503` when no secret is configured.

**Setting it up.** Store the secret on the box, install a signing script, send a test event, then call the script from cron or Postfix/Dovecot hooks. The step-by-step procedure is in [DEPLOYMENT.md §12.B](DEPLOYMENT.md#b-mail-in-a-box--xsia). A minimal signed request looks like this:

**Sending from the box.**

```bash
SECRET="..."   # same value as MIAB_WEBHOOK_SECRET
BODY='{"event":"status_check.failed","id":"'"$(hostname)-$(date +%s)"'","hostname":"'"$(hostname -f)"'","data":{"check":"dns"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)
curl -fsS -X POST https://your-xsia-host/api/v1/webhook/mail-in-a-box \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  --data-raw "$BODY"
```

### OpenWA

`POST /api/v1/webhook/openwa` receives events from the [OpenWA](https://github.com/rmyndharis/OpenWA) WhatsApp gateway and stores each one in `webhook.open_wa_events` (migration `m20261014_140000_schema_webhook_table_open_wa_events`).

**Authentication.** Store the secret in the active OpenWA settings (`utility:preference-add-openwa`) or set `OPENWA_WEBHOOK_SECRET` in `server/.env`; it must be at least 16 characters, which OpenWA requires. While neither is set the endpoint answers `503`. Register the webhook in OpenWA with the same value as its `secret`. OpenWA then signs every delivery with `X-OpenWA-Signature: sha256=<hex HMAC-SHA256 of the raw body>`, and a missing or wrong signature returns `401`. A webhook registered in OpenWA without a secret is unsigned and is always rejected.

**Payload.** OpenWA's standard envelope:

```json
{
  "event": "message.received",
  "timestamp": "2026-02-02T10:00:00.000Z",
  "sessionId": "my-session",
  "idempotencyKey": "msg_my-session_3EB0ABC123_f1e2d3c4-...",
  "deliveryId": "dlv_550e8400-e29b-41d4-a716-446655440000",
  "data": {}
}
```

`event`, `sessionId` and `idempotencyKey` are required. OpenWA keeps the `idempotencyKey` the same across retries, so a repeated key returns `200` with `"duplicate": true` and is not stored again. The whole request body is stored in the `payload` column. `timestamp` is stored as `occurred_at` (UTC).

**Responses.** `200 {"id": "<uuid>", "duplicate": false}` on success, `400` for invalid JSON or fields, `401` for a bad signature, `503` when no secret is configured. OpenWA retries any non-2xx response with exponential backoff (3 attempts by default).

**Registering the webhook.** In the OpenWA dashboard, or through its API with the operator key:

```bash
curl -fsS -X POST "$OPENWA_URL/api/sessions/$OPENWA_API_KEY_SESSION_ID/webhooks" \
  -H "X-API-Key: $OPENWA_API_KEY_OPERATOR" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-xsia-host/api/v1/webhook/openwa","events":["message.received","message.ack","session.status"],"secret":"'"$OPENWA_WEBHOOK_SECRET"'"}'
```

`OpenWaSender::register_webhook` in `server/src/services/messenger/openwa.rs` makes the same call from Rust. Note the `id` in the response, then send a test delivery (or use the **Test** button in the OpenWA dashboard). It sends a signed `test` event, which is stored like any other:

```bash
curl -fsS -X POST "$OPENWA_URL/api/sessions/$OPENWA_API_KEY_SESSION_ID/webhooks/<webhook-id>/test" \
  -H "X-API-Key: $OPENWA_API_KEY_OPERATOR"
```

The full procedure (prerequisites, dashboard steps, listing, updating and deleting webhooks, rotating the secret) is in [DEPLOYMENT.md §12.C](DEPLOYMENT.md#c-openwa--xsia).

---

## 🗄 Database Migrations & Entity Generation

Migrations are modularized by schema and domain under `server/migration/src/`.

### Common Migration Commands

```bash
cd server

# Apply all pending migrations
sea-orm-cli migrate up

# Rollback last migration batch
sea-orm-cli migrate down

# Reset and re-apply all migrations
sea-orm-cli migrate refresh

# Generate a new migration file for a specific schema
sea-orm-cli migrate generate -d ./migration/src/auth -s auth schema_auth_table_verifications
```

### Entity Model Generation

To generate SeaORM entity models directly from your PostgreSQL schema:

```bash
sea-orm-cli generate entity \
  --database-url "postgres://postgres:password@localhost:5432/xsia_xarx" \
  --database-schema "academic_campaign_reference" \
  --output-dir "./src/models/academic/reference"
```

---

## ⚡ Background Workers & Task Runner

### PGMQ Background Workers

On startup the server creates its [PGMQ](https://github.com/pgmq/pgmq) queues (if missing) and starts one worker per queue. The queues are tables in PostgreSQL, so a job survives an API restart:

| Queue | Job | Code | Retries |
| :--- | :--- | :--- | :--- |
| `email` | `EmailJob { to, subject, body, html_body }` | `server/src/jobs/email.rs` | Up to 5 reads, then archived |
| `pdf_embedding` | `PdfEmbeddingJob` | `server/src/jobs/embedding/embed.rs` | Up to 3 attempts, then archived |

Workers poll for up to 5 s at a time. A job that fails becomes visible again after its visibility timeout and is retried. Finished and given-up jobs move to PGMQ's archive table (`pgmq.a_<queue>`). The email worker uses the stored mail server (see [Settings Stored in the Database](#settings-stored-in-the-database)).

### CLI Task Runner

Custom CLI tasks, utilities, and one-off maintenance scripts can be executed using the integrated task runner located in `server/src/tasks/`.

Both colon (`:`) and underscore (`_`) task name formats are supported interchangeably (e.g. `utility:hash-password` or `hash_password`).

#### 1. List Available Tasks

To view all registered tasks and their descriptions:

```bash
cd server
cargo run -- task
```

#### 2. Built-in Tasks & Usage Examples

| Task Name | Description | Example Command |
| :--- | :--- | :--- |
| `EstimateAktifitasMengajarDosen` | Fetch and process GetAktivitasMengajarDosen data from Feeder Dikti | `cargo run -- task EstimateAktifitasMengajarDosen` |
| `EstimateBiodataDosen` | Fetch and process DetailBiodataDosen data from Feeder Dikti | `cargo run -- task EstimateBiodataDosen` |
| `EstimateBiodataMahasiswa` | Fetch and process GetBiodataMahasiswa data from Feeder Dikti | `cargo run -- task EstimateBiodataMahasiswa` |
| `EstimateDetailKelasKuliah` | Fetch and process GetDetailKelasKuliah data from Feeder Dikti | `cargo run -- task EstimateDetailKelasKuliah` |
| `EstimateDetailKurikulum` | Fetch and process GetDetailKurikulum data from Feeder Dikti | `cargo run -- task EstimateDetailKurikulum` |
| `EstimateDetailMahasiswaLulusDO` | Fetch and process GetDetailMahasiswaLulusDO data from Feeder Dikti | `cargo run -- task EstimateDetailMahasiswaLulusDO` |
| `EstimateDetailMatakuliah` | Fetch and process GetDetailMataKuliah data from Feeder Dikti | `cargo run -- task EstimateDetailMatakuliah` |
| `EstimateDetailNilaiPerkuliahanKelas` | Fetch and process GetDetailNilaiPerkuliahanKelas data from Feeder Dikti | `cargo run -- task EstimateDetailNilaiPerkuliahanKelas` |
| `EstimateDetailPenugasanDosen` | Fetch and process GetDetailPenugasanDosen data from Feeder Dikti | `cargo run -- task EstimateDetailPenugasanDosen` |
| `EstimateDetailPeriodePerkuliahan` | Fetch and process GetDetailPeriodePerkuliahan data from Feeder Dikti | `cargo run -- task EstimateDetailPeriodePerkuliahan` |
| `EstimateDetailPerkuliahanMahasiswa` | Fetch and process GetDetailPerkuliahanMahasiswa data from Feeder Dikti | `cargo run -- task EstimateDetailPerkuliahanMahasiswa` |
| `EstimateGetAgama` | Fetch and process GetAgama data from Feeder Dikti | `cargo run -- task EstimateGetAgama` |
| `EstimateGetAlatTransportasi` | Fetch and process GetAlatTransportasi data from Feeder Dikti | `cargo run -- task EstimateGetAlatTransportasi` |
| `EstimateGetAllMasterData` | Sequentially run all master estimasi tasks (except GetAllPT & GetAllProdi). Continues on failure and reports a summary; pass `--fail-fast` to abort on the first error | `cargo run -- task EstimateGetAllMasterData` or `cargo run -- task EstimateGetAllMasterData --fail-fast` |
| `EstimateGetAllProdi` | Fetch and process GetAllProdi data from Feeder Dikti | `cargo run -- task EstimateGetAllProdi` |
| `EstimateGetAllPT` | Fetch and process GetAllPT data from Feeder Dikti | `cargo run -- task EstimateGetAllPT` |
| `EstimateGetDosenPengajarKelasKuliah` | Fetch and process GetDosenPengajarKelasKuliah data from Feeder Dikti | `cargo run -- task EstimateGetDosenPengajarKelasKuliah` |
| `EstimateGetIkatanKerjaSdm` | Fetch and process GetIkatanKerjaSdm data from Feeder Dikti | `cargo run -- task EstimateGetIkatanKerjaSdm` |
| `EstimateGetJabfung` | Fetch and process GetJabatanFungsional data from Feeder Dikti | `cargo run -- task EstimateGetJabfung` |
| `EstimateGetJalurMasuk` | Fetch and process GetJalurMasuk data from Feeder Dikti | `cargo run -- task EstimateGetJalurMasuk` |
| `EstimateGetJenisAktifitasMahasiswa` | Fetch and process GetJenisAktivitasMahasiswa data from Feeder Dikti | `cargo run -- task EstimateGetJenisAktifitasMahasiswa` |
| `EstimateGetJenisEvaluasi` | Fetch and process GetJenisEvaluasi data from Feeder Dikti | `cargo run -- task EstimateGetJenisEvaluasi` |
| `EstimateGetJenisKeluar` | Fetch and process GetJenisKeluar data from Feeder Dikti | `cargo run -- task EstimateGetJenisKeluar` |
| `EstimateGetJenisPendaftaran` | Fetch and process GetJenisPendaftaran data from Feeder Dikti | `cargo run -- task EstimateGetJenisPendaftaran` |
| `EstimateGetJenisPrestasi` | Fetch and process GetJenisPrestasi data from Feeder Dikti | `cargo run -- task EstimateGetJenisPrestasi` |
| `EstimateGetJenisSertifikasi` | Fetch and process GetJenisSertifikasi data from Feeder Dikti | `cargo run -- task EstimateGetJenisSertifikasi` |
| `EstimateGetJenisSMS` | Fetch and process GetJenisSMS data from Feeder Dikti | `cargo run -- task EstimateGetJenisSMS` |
| `EstimateGetJenisSubstansi` | Fetch and process GetJenisSubstansi data from Feeder Dikti | `cargo run -- task EstimateGetJenisSubstansi` |
| `EstimateGetJenisTinggal` | Fetch and process GetJenisTinggal data from Feeder Dikti | `cargo run -- task EstimateGetJenisTinggal` |
| `EstimateGetJenjangPendidikan` | Fetch and process GetJenjangPendidikan data from Feeder Dikti | `cargo run -- task EstimateGetJenjangPendidikan` |
| `EstimateGetKategoriKegiatan` | Fetch and process GetKategoriKegiatan data from Feeder Dikti | `cargo run -- task EstimateGetKategoriKegiatan` |
| `EstimateGetLembagaPengangkat` | Fetch and process GetLembagaPengangkat data from Feeder Dikti | `cargo run -- task EstimateGetLembagaPengangkat` |
| `EstimateGetLevelWilayah` | Fetch and process GetLevelWilayah data from Feeder Dikti | `cargo run -- task EstimateGetLevelWilayah` |
| `EstimateGetNegara` | Fetch and process GetNegara data from Feeder Dikti | `cargo run -- task EstimateGetNegara` |
| `EstimateGetPangkatGolongan` | Fetch and process GetPangkatGolongan data from Feeder Dikti | `cargo run -- task EstimateGetPangkatGolongan` |
| `EstimateGetPekerjaan` | Fetch and process GetPekerjaan data from Feeder Dikti | `cargo run -- task EstimateGetPekerjaan` |
| `EstimateGetPembiayaan` | Fetch and process GetPembiayaan data from Feeder Dikti | `cargo run -- task EstimateGetPembiayaan` |
| `EstimateGetPenghasilan` | Fetch and process GetPenghasilan data from Feeder Dikti | `cargo run -- task EstimateGetPenghasilan` |
| `EstimateGetProdi` | Fetch and process GetProdi data from Feeder Dikti | `cargo run -- task EstimateGetProdi` |
| `EstimateGetProfilPT` | Fetch and process GetProfilPT data from Feeder Dikti | `cargo run -- task EstimateGetProfilPT` |
| `EstimateGetSemester` | Fetch and process GetSemester data from Feeder Dikti | `cargo run -- task EstimateGetSemester` |
| `EstimateGetStatusKeaktifanPegawai` | Fetch and process GetStatusKeaktifanPegawai data from Feeder Dikti | `cargo run -- task EstimateGetStatusKeaktifanPegawai` |
| `EstimateGetStatusKepegawaian` | Fetch and process GetStatusKepegawaian data from Feeder Dikti | `cargo run -- task EstimateGetStatusKepegawaian` |
| `EstimateGetStatusMahasiswa` | Fetch and process GetStatusMahasiswa data from Feeder Dikti | `cargo run -- task EstimateGetStatusMahasiswa` |
| `EstimateGetTahunAjaran` | Fetch and process GetTahunAjaran data from Feeder Dikti | `cargo run -- task EstimateGetTahunAjaran` |
| `EstimateGetTingkatPrestasi` | Fetch and process GetTingkatPrestasi data from Feeder Dikti | `cargo run -- task EstimateGetTingkatPrestasi` |
| `EstimateGetWilayah` | Fetch and process GetWilayah data from Feeder Dikti | `cargo run -- task EstimateGetWilayah` |
| `EstimateKRSMahasiswa` | Fetch and process GetKRSMahasiswa data from Feeder Dikti | `cargo run -- task EstimateKRSMahasiswa` |
| `EstimateListDosen` | Fetch and process GetListDosen data from Feeder Dikti | `cargo run -- task EstimateListDosen` |
| `EstimateListKelasKuliah` | Fetch and process GetListKelasKuliah data from Feeder Dikti | `cargo run -- task EstimateListKelasKuliah` |
| `EstimateListKomponenEvaluasiKelas` | Fetch and process GetListKomponenEvaluasiKelas data from Feeder Dikti | `cargo run -- task EstimateListKomponenEvaluasiKelas` |
| `EstimateListKurikulum` | Fetch and process GetListKurikulum data from Feeder Dikti | `cargo run -- task EstimateListKurikulum` |
| `EstimateListMahasiswa` | Fetch and process GetListMahasiswa data from Feeder Dikti | `cargo run -- task EstimateListMahasiswa` |
| `EstimateListMahasiswaLulusDO` | Fetch and process GetListMahasiswaLulusDO data from Feeder Dikti | `cargo run -- task EstimateListMahasiswaLulusDO` |
| `EstimateListMatakuliah` | Fetch and process GetListMataKuliah data from Feeder Dikti | `cargo run -- task EstimateListMatakuliah` |
| `EstimateListNilaiPerkuliahanKelas` | Fetch and process GetListNilaiPerkuliahanKelas data from Feeder Dikti | `cargo run -- task EstimateListNilaiPerkuliahanKelas` |
| `EstimateListNilaiTransferPendidikanMahasiswa` | Fetch and process GetNilaiTransferPendidikanMahasiswa data from Feeder Dikti | `cargo run -- task EstimateListNilaiTransferPendidikanMahasiswa` |
| `EstimateListPenugasanDosen` | Fetch and process GetListPenugasanDosen data from Feeder Dikti | `cargo run -- task EstimateListPenugasanDosen` |
| `EstimateListPenugasanSemuaDosen` | Fetch and process GetListPenugasanSemuaDosen data from Feeder Dikti | `cargo run -- task EstimateListPenugasanSemuaDosen` |
| `EstimateListPeriodePerkuliahan` | Fetch and process GetListPeriodePerkuliahan data from Feeder Dikti | `cargo run -- task EstimateListPeriodePerkuliahan` |
| `EstimateListPerkuliahanMahasiswa` | Fetch and process GetListPerkuliahanMahasiswa data from Feeder Dikti | `cargo run -- task EstimateListPerkuliahanMahasiswa` |
| `EstimateListRencanaEvaluasi` | Fetch and process GetListRencanaEvaluasi data from Feeder Dikti | `cargo run -- task EstimateListRencanaEvaluasi` |
| `EstimateListRencanaPembelajaran` | Fetch and process GetListRencanaPembelajaran data from Feeder Dikti | `cargo run -- task EstimateListRencanaPembelajaran` |
| `EstimateListRiwayatPendidikanMahasiswa` | Fetch and process GetListRiwayatPendidikanMahasiswa data from Feeder Dikti | `cargo run -- task EstimateListRiwayatPendidikanMahasiswa` |
| `EstimateListSkalaNilaiProdi` | Fetch and process GetListSkalaNilaiProdi data from Feeder Dikti | `cargo run -- task EstimateListSkalaNilaiProdi` |
| `EstimateMatkulKurikulum` | Fetch and process GetMatkulKurikulum data from Feeder Dikti | `cargo run -- task EstimateMatkulKurikulum` |
| `EstimatePesertaKelasKuliah` | Fetch and process GetPesertaKelasKuliah data from Feeder Dikti | `cargo run -- task EstimatePesertaKelasKuliah` |
| `EstimateRiwayatFungsionalDosen` | Fetch and process GetRiwayatFungsionalDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatFungsionalDosen` |
| `EstimateRiwayatNilaiMahasiswa` | Fetch and process GetRiwayatNilaiMahasiswa data from Feeder Dikti | `cargo run -- task EstimateRiwayatNilaiMahasiswa` |
| `EstimateRiwayatPangkatDosen` | Fetch and process GetRiwayatPangkatDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatPangkatDosen` |
| `EstimateRiwayatPendidikanDosen` | Fetch and process GetRiwayatPendidikanDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatPendidikanDosen` |
| `EstimateRiwayatPenelitianDosen` | Fetch and process GetRiwayatPenelitianDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatPenelitianDosen` |
| `EstimateRiwayatSertifikasiDosen` | Fetch and process GetRiwayatSertifikasiDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatSertifikasiDosen` |
| `EstimateTranskripMahasiswa` | Fetch and process GetTranskripMahasiswa data from Feeder Dikti | `cargo run -- task EstimateTranskripMahasiswa` |
| `example` | An example task that prints a message | `cargo run -- task example arg1 arg2` |
| `SyncAllMasterData` | Sequentially run all 22 downstream master synchronization tasks (01 to 22) in topological DAG dependency order | `cargo run -- task SyncAllMasterData` or `cargo run -- task SyncAllMasterData --fail-fast` |
| `SyncBiodataMahasiswaToAcademicStudentMasterStudent` | Upsert biodata_mahasiswa and mahasiswa to person_master.individuals and academic_student_master.students (Step 01) | `cargo run -- task SyncBiodataMahasiswaToAcademicStudentMasterStudent` |
| `SyncBiodataDosenToAcademicLecturerMasterLecturer` | Upsert biodata_dosen and dosen to person_master.individuals and academic_lecturer_master.lecturers (Step 02) | `cargo run -- task SyncBiodataDosenToAcademicLecturerMasterLecturer` |
| `SyncPeriodePerkuliahanToAcademicTransactionActivities` | Upsert periode_perkuliahan to academic_campaign_transaction.activities (Step 03) | `cargo run -- task SyncPeriodePerkuliahanToAcademicTransactionActivities` |
| `SyncSkalaNilaiProdiToAcademicTransactionGrades` | Upsert skala_nilai_program_studi to academic_campaign_transaction.grades (Step 04) | `cargo run -- task SyncSkalaNilaiProdiToAcademicTransactionGrades` |
| `SyncMatakuliahToAcademicCourseMasterCourse` | Upsert matakuliah to academic_course_master.courses (Step 05) | `cargo run -- task SyncMatakuliahToAcademicCourseMasterCourse` |
| `SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails` | Upsert kurikulum and matakuliah_kurikulum to academic_course_master.curriculums and details (Step 06) | `cargo run -- task SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails` |
| `SyncRencanaEvaluasiToCourseEvaluationPlannings` | Upsert rencana_evaluasi to academic_course_master.course_evaluation_plannings (Step 07) | `cargo run -- task SyncRencanaEvaluasiToCourseEvaluationPlannings` |
| `SyncRencanaPembelajaranToCourseLearnPlannings` | Upsert rencana_pembelajaran to academic_course_master.course_learn_plannings RPS (Step 08) | `cargo run -- task SyncRencanaPembelajaranToCourseLearnPlannings` |
| `SyncKelasKuliahToAcademicCampaignTransactionClassCode` | Upsert kelas_kuliah to academic_campaign_transaction.class_codes (Step 09) | `cargo run -- task SyncKelasKuliahToAcademicCampaignTransactionClassCode` |
| `SyncKartuRencanaStudiMahasiswaToAcademicCampaignTransactionClassCode` | Upsert kartu_rencana_studi_mahasiswa to academic_campaign_transaction.class_codes (Step 10) | `cargo run -- task SyncKartuRencanaStudiMahasiswaToAcademicCampaignTransactionClassCode` |
| `SyncKelasKuliahToAcademicTransactionTeaches` | Upsert kelas_kuliah to academic_campaign_transaction.teaches (Step 11) | `cargo run -- task SyncKelasKuliahToAcademicTransactionTeaches` |
| `SyncKartuRencanaStudiMahasiswaToAcademicTransactionTeaches` | Upsert kartu_rencana_studi_mahasiswa to academic_campaign_transaction.teaches (Step 12) | `cargo run -- task SyncKartuRencanaStudiMahasiswaToAcademicTransactionTeaches` |
| `SyncNilaiPerkuliahanKelasToTransactionTeaches` | Upsert nilai_perkuliahan_kelas to academic_campaign_transaction.teaches metrics (Step 13) | `cargo run -- task SyncNilaiPerkuliahanKelasToTransactionTeaches` |
| `SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer` | Upsert aktifitas_mengajar_dosen to academic_campaign_transaction.teach_lecturers (Step 14) | `cargo run -- task SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer` |
| `SyncKomponenEvaluasiKelasToTeachEvaluations` | Upsert komponen_evaluasi_kelas to academic_campaign_transaction.teach_evaluations (Step 15) | `cargo run -- task SyncKomponenEvaluasiKelasToTeachEvaluations` |
| `SyncPerkuliahanMahasiswaToAcademicStudentActivities` | Upsert perkuliahan_mahasiswa to academic_student_campaign.student_activities AKM (Step 16) | `cargo run -- task SyncPerkuliahanMahasiswaToAcademicStudentActivities` |
| `SyncNilaiTransferPendidikanMahasiswaToConvertions` | Upsert nilai_transfer_pendidikan_mahasiswa to academic_student_campaign.convertions (Step 17) | `cargo run -- task SyncNilaiTransferPendidikanMahasiswaToConvertions` |
| `SyncKartuRencanaStudiMahasiswaToDetailActivities` | Upsert kartu_rencana_studi_mahasiswa to academic_student_campaign.detail_activities (Step 18) | `cargo run -- task SyncKartuRencanaStudiMahasiswaToDetailActivities` |
| `SyncPesertaKelasKuliahToDetailActivities` | Upsert peserta_kelas_kuliah to academic_student_campaign.detail_activities (Step 19) | `cargo run -- task SyncPesertaKelasKuliahToDetailActivities` |
| `SyncNilaiPerkuliahanKelasToDetailActivities` | Upsert detail_nilai_perkuliahan_kelas to academic_student_campaign.detail_activities grades (Step 20) | `cargo run -- task SyncNilaiPerkuliahanKelasToDetailActivities` |
| `SyncBiodataMahasiswaToContactDetails` | Upsert biodata_mahasiswa to contact_master phones, emails, and residences (Step 21) | `cargo run -- task SyncBiodataMahasiswaToContactDetails` |
| `SyncBiodataDosenToContactDetails` | Upsert biodata_dosen to contact_master phones, emails, and residences (Step 22) | `cargo run -- task SyncBiodataDosenToContactDetails` |
| `utility:cleanup-student-detail-activity` | Soft-deletes duplicate detail_activities rows (same activity_id + course_id), keeping the best one, and rows whose course no longer exists (even if they have a mark) | `cargo run -- task utility:cleanup-student-detail-activity --dry-run` |
| `utility:feeder-add-credential` | Prompts for Feeder username, password, institution code and URL, then stores the credential (password encrypted) | `cargo run -- task utility:feeder-add-credential` |
| `utility:generate-env` | Creates `.env` with every key the server reads (secrets generated), or adds only the missing keys to an existing one. Needs no database | `cargo run -- task utility:generate-env` |
| `utility:generate-permission-from-client` | Grants each position type the permissions its client area (`client/src/routes/<area>`) requests | `cargo run -- task utility:generate-permission-from-client --dry-run` |
| `utility:generate-permission-from-route` | Upserts every named controller route into auth.permissions and deletes permissions no route uses | `cargo run -- task utility:generate-permission-from-route --dry-run` |
| `utility:hash-password` | Hashes input string/password using Argon2id and Bcrypt from arguments | `cargo run -- task utility:hash-password "MySecretPass123"` |
| `utility:preference-add-mail-server` | Prompts for SMTP host, port, sender, address and credentials, then stores the active mail server (password encrypted) | `cargo run -- task utility:preference-add-mail-server` |
| `utility:preference-add-openwa` | Prompts for OpenWA URL, session ID, operator API key and webhook secrets, then stores the active OpenWA settings (keys and secrets encrypted) | `cargo run -- task utility:preference-add-openwa` |
| `utility:preference-generate-webhook-secret` | Generates MIAB and OpenWA webhook secrets ([miab\|openwa], default both), prints them as .env lines and stores them encrypted in the active OpenWA settings | `cargo run -- task utility:preference-generate-webhook-secret` |
| `utility:route-list` | Lists all system routes with their URL path, HTTP method, handler function, and route name | `cargo run -- task utility:route-list` |
| `utility:sync-permissions` | Synchronizes all predefined route permissions into the auth.permissions table | `cargo run -- task utility:sync-permissions` |
| `utility:sync-staff-roles` | Gives every current staff appointment with a position type and a user account a role, and revokes the rest | `cargo run -- task utility:sync-staff-roles --dry-run` |
| `utility:sync-student-roles` | Synchronizes student roles into the auth.roles table | `cargo run -- task utility:sync-student-roles` |

> ℹ️ The `utility:*` tasks used to be named `feeder:add-credential`, `sync:permissions`, `hash:password`, and so on. The old names still run the task, with a warning pointing to the new name, but will be removed in a future release, so update scripts and cron jobs.

##### 🔑 Password Hashing Utility (`utility:hash-password`)

Hash a raw password string directly from command-line arguments:

```bash
# Generate both Argon2id and Bcrypt hashes:
cargo run -- task utility:hash-password "MySecretPass123"

# Specify a specific algorithm (argon2 or bcrypt):
cargo run -- task utility:hash-password "MySecretPass123" argon2
cargo run -- task utility:hash-password "MySecretPass123" bcrypt

# Interactive prompt (if no argument is provided):
cargo run -- task utility:hash-password
```

##### 🛣️ Route Listing (`utility:route-list`)

List and inspect registered API routes in a formatted table:

```bash
# List all routes
cargo run -- task utility:route-list

# Filter routes by path, method, handler name, or keyword
cargo run -- task utility:route-list auth
cargo run -- task utility:route-list student
```

##### 🔄 Sync Permissions (`utility:sync-permissions`)

Sync predefined system permission constants into the PostgreSQL database:

```bash
cargo run -- task utility:sync-permissions
# or
cargo run -- task sync_permissions
```

##### 🎓 Add Feeder Credential (`utility:feeder-add-credential`)

Store the PDDikti Feeder login for an institution. The task prompts for each value; nothing is passed as an argument:

```bash
cargo run -- task utility:feeder-add-credential
```

| Prompt | Notes |
| :--- | :--- |
| Institution code | Defaults to the institution of the credential already stored. Must match an existing institution |
| Feeder username | Required |
| Feeder password | Hidden input. Stored encrypted |
| Feeder URL | Must start with `http://` or `https://`, e.g. `http://host:3003/ws/live2.php` |

Each institution has one credential. If one already exists, it is updated; otherwise a new one is created.

The credential also decides the **current institution** used by every Feeder task (see [Settings Stored in the Database](#settings-stored-in-the-database)). Store a credential for one institution only; with credentials for several, Feeder tasks refuse to run.

##### 📧 Add Mail Server (`utility:preference-add-mail-server`)

Store the SMTP server used to send e-mail. The task prompts for each value:

```bash
cargo run -- task utility:preference-add-mail-server
```

| Prompt | Notes |
| :--- | :--- |
| SMTP host | Required |
| SMTP port | Defaults to `587` |
| Use TLS (y/n) | Defaults to `y` |
| Sender name | Required |
| Sender mail address | Defaults to `SYSTEM_MAIL_ADDRESS` if set. Must contain `@` |
| SMTP user | Leave empty for a server without authentication; the password prompt is then skipped |
| SMTP password | Hidden input. Stored encrypted |

If an active mail server already exists, it is updated; otherwise a new active one is created.

##### 💬 Add OpenWA Settings (`utility:preference-add-openwa`)

Store the OpenWA (WhatsApp) connection and the webhook secrets described in [Inbound Webhooks](#-inbound-webhooks). The task prompts for each value:

```bash
cargo run -- task utility:preference-add-openwa
```

| Prompt | Notes |
| :--- | :--- |
| OpenWA URL | Must start with `http://` or `https://`, e.g. `http://host:2785` |
| OpenWA session ID | Defaults to `OPENWA_API_KEY_SESSION_ID` |
| OpenWA operator API key | Hidden input. Stored encrypted |
| OpenWA webhook secret | Hidden input. Stored encrypted |
| Mail-in-a-Box webhook secret | Hidden input. Stored encrypted |

If active OpenWA settings already exist, they are updated; otherwise a new active record is created.

##### 🔐 Generate Webhook Secrets (`utility:preference-generate-webhook-secret`)

Generate the shared secrets for the [Inbound Webhooks](#-inbound-webhooks). Each secret is 32 random bytes as 64 hex characters, the same as `openssl rand -hex 32`:

```bash
cargo run -- task utility:preference-generate-webhook-secret          # both secrets
cargo run -- task utility:preference-generate-webhook-secret miab     # only MIAB_WEBHOOK_SECRET
cargo run -- task utility:preference-generate-webhook-secret openwa   # only OPENWA_WEBHOOK_SECRET
```

The task prints the secrets as `.env` lines (`MIAB_WEBHOOK_SECRET="..."`, `OPENWA_WEBHOOK_SECRET="..."`) and stores them encrypted in the active OpenWA settings. If no active OpenWA settings exist, nothing is stored; run `utility:preference-add-openwa` first and paste the secrets there.

When the secrets are stored in the database they take effect immediately; the printed `.env` lines are only needed if you use the `.env` fallback (then restart the API). Every run replaces the old secrets: register the new OpenWA secret again and update `XSIA_WEBHOOK_SECRET` on the Mail-in-a-Box server, or their deliveries will get `401`. The secrets are printed in plain text, so don't run the task where output is logged.

All four tasks need a configured database connection and `APP_ENCRYPTION_KEY` set in `server/.env`, since they encrypt the secrets before saving them.

##### 🧾 Generate `.env` (`utility:generate-env`)

Write a `server/.env` with every key the server reads, grouped and commented. Unlike the other tasks it needs no database connection, so it works on a fresh checkout:

```bash
cargo run -- task utility:generate-env                    # create server/.env, or add the keys it is missing
cargo run -- task utility:generate-env --output .env.prod # another file
cargo run -- task utility:generate-env --stdout           # print a fresh file, write nothing
```

- `JWT_SECRET`, `APP_ENCRYPTION_KEY`, `MIAB_WEBHOOK_SECRET` and `OPENWA_WEBHOOK_SECRET` get random values. The value you must set yourself (`DATABASE_URL`) is `CHANGE_ME`.
- Keys with a built-in default, and the SMTP / OpenWA / Feeder fallbacks that the `utility:preference-*` and `utility:feeder-add-credential` settings override, are written commented out.
- If the file exists, only missing keys are appended (a commented-out key counts as present, except `JWT_SECRET`: without an active one the server signs logins with a public default, so a real one is added). Existing values are never changed, so `APP_ENCRYPTION_KEY` stays the same and encrypted secrets in the database stay readable.
- A new file is created with mode `600`.
- If the existing `JWT_SECRET` is empty, the built-in default, or shorter than 32 characters, the task warns and shows how to generate a new one. It doesn't replace it, because that logs everyone out.

##### 🛡️ Generate Permissions from Client (`utility:generate-permission-from-client`)

Traces which API endpoints each client area (`client/src/routes/<area>`) calls, using `client/scripts/extract-api-usage.mjs`. It then grants the matching route permissions to the position types that work in that area. Administrator is skipped because it bypasses RBAC.

Run it from `server/`, because the client is found at `../client` by default. It needs `bun` on your `PATH` and a configured database connection.

```bash
# Preview the changes without writing anything
cargo run -- task utility:generate-permission-from-client --dry-run

# Apply the grants
cargo run -- task utility:generate-permission-from-client

# Limit to a single area
cargo run -- task utility:generate-permission-from-client --area rectorat --dry-run

# Also revoke grants the client no longer needs (preview first!)
cargo run -- task utility:generate-permission-from-client --prune --dry-run
cargo run -- task utility:generate-permission-from-client --prune

# Reuse a previously captured usage JSON instead of running the Bun script
(cd ../client && bun scripts/extract-api-usage.mjs) > /tmp/usage.json
cargo run -- task utility:generate-permission-from-client --input /tmp/usage.json --dry-run
```

| Flag | Effect |
|---|---|
| `--dry-run` / `-n` | Show the changes without writing them to the database |
| `--prune` | Revoke existing grants the client no longer needs |
| `--area <name>` | Process only one area folder. An unknown name fails with an error. |
| `--client <dir>` | Use a different client directory (default `../client`) |
| `--input <json>` | Read usage from a JSON file instead of running `extract-api-usage.mjs` |

**Re-run after adding routes or pages.** Grants are not applied automatically. When a client page starts calling a new backend route, a non-administrator role gets `403 Forbidden` until this task is re-run. The 403 response names the permission it was looking for:

```text
Access denied: role lacks permission 'institution.master.employees.register' or 'institution.master.employees.register.create'
```

The fix is usually to re-run the task for that area (dry-run first):

```bash
cargo run -- task utility:generate-permission-from-client --area rectorat --dry-run
cargo run -- task utility:generate-permission-from-client --area rectorat
```

**What the extractor can trace.** `extract-api-usage.mjs` reads the code without running it. It follows each page's imports down to its `fetch()` calls. A call is traced when:

- its URL is built from string literals, template strings, constants, or parameters of a helper function, and
- its HTTP method is a literal (`method: 'PUT'`), is left out (meaning `GET`), or is a helper parameter that each call site passes as a literal:

```ts
async function requestJson<T>(method: string, path: string, body?: unknown) {
    return fetch(`${getBaseApiUrl()}/${path}`, { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
}
requestJson('PUT', `institution/master/employees/${encodeURIComponent(id)}`, payload); // -> PUT institution/master/employees/{}
```

Any call the extractor can't trace is printed as `[WARN] <area>: N fetch call(s) could not be traced`, and the task grants nothing for it. To list these calls, run the script and inspect `unresolved`:

```bash
(cd ../client && bun scripts/extract-api-usage.mjs) | jq '.areas.rectorat.unresolved'
```

`[NO ROUTE]` lines are client requests that match no backend route, usually a wrong path or HTTP method in the client.

**Checking a role by hand.** To see which permission a role is missing, log in, switch to the role, and call the endpoint directly. The backend listens on `127.0.0.1:5800`.

```bash
B=http://127.0.0.1:5800/api/v1
T=$(curl -s $B/login -H 'Content-Type: application/json' \
      -d '{"email":"<email>","password":"<password>"}' | jq -r .token)
# List your roles (id | name | position type)
curl -s $B/login -H 'Content-Type: application/json' \
      -d '{"email":"<email>","password":"<password>"}' | jq -r '.user.roles[] | "\(.id) | \(.name) | \(.position_type_id)"'
curl -s -X POST $B/user/set_current_role/<role_id> -H "Authorization: Bearer $T"
curl -s -X POST $B/institution/master/employees/register -H "Authorization: Bearer $T" \
      -H 'Content-Type: application/json' -d '{}'
```

**403 vs. 404: route permissions and data scope.** Two separate checks apply to every request:

| Check | Decides | Where | Failure |
|---|---|---|---|
| Route permission (RBAC) | *Which endpoints* the active role can call | `server/src/middleware/rbac.rs`, granted by this task | `403 Access denied: role lacks permission '…'` |
| Data scope | *Which records* those endpoints return | `server/src/services/auth/data_scope.rs` (`DataScope`) | Lists leave the record out; `show` returns `404 … not found` |

The data scope is based on the **active** role:

- **Administrator:** sees everything.
- **Staff:** study program or department staff see their own unit, faculty staff see their unit and every unit below it, and everyone else (rectorate, bureaus, foundation…) sees every unit of their institution.
- **Student:** sees only their own records.
- **Lecturer:** sees students in the classes they teach, plus the students they advise.

Re-running `utility:generate-permission-from-client` doesn't fix a 404 like this, because the endpoint is allowed and only the record is out of scope. Check which unit or institution the record belongs to and compare it with the active role's scope.

One exception: `GET academic/student/master/students/{id}` also returns a student who is the `roleable` of one of the signed-in user's **own** roles, whatever role is active (`is_own_student()` in `data_scope.rs`). The role switcher needs this: `enrichUserRolesWithStudentCodes()` in `client/src/lib/authStore.ts` looks up each student role's code and unit. Without the exception, a user with a Rektorat role in one institution and Mahasiswa roles in another got 404s on every page. Other students outside the scope are still hidden, and list, update and delete still use the active role's scope only.

##### 🧹 Clean Up Student Detail Activities (`utility:cleanup-student-detail-activity`)

Soft-deletes bad rows in `academic_student_campaign.detail_activities` in two phases. It sets `deleted_at` and never removes rows outright.

```bash
# Preview the changes without writing anything
cargo run -- task utility:cleanup-student-detail-activity --dry-run

# Apply the cleanup
cargo run -- task utility:cleanup-student-detail-activity
```

1. **Duplicates.** For each `(activity_id, course_id)` pair with more than one active row, one row is kept and the rest are soft-deleted. The kept row is chosen by, in order: having a mark above 0 or a grade, having a Feeder ID, and the newest `updated_at`.
2. **Orphaned courses.** Active rows whose `course_id` has no active course in `academic_course_master.courses` are soft-deleted, including rows with a mark. The output shows how many of them had a mark above 0, so check that number in the dry run before you apply it.

| Flag | Effect |
|---|---|
| `--dry-run` | Show what would be deleted without writing to the database |

A spinner runs while the task queries the database, and a progress bar tracks the deletes, which are committed in transactions of 200 rows.

##### 📥 Feeder Master Data Estimation Orchestrator (`EstimateGetAllMasterData`)

Run all master data estimation and extraction tasks from PDDikti Feeder sequentially (excluding `GetAllPT` and `GetAllProdi`):

```bash
# Execute all master estimation tasks sequentially
cargo run -- task EstimateGetAllMasterData

# Abort immediately if any sub-task encounters an error
cargo run -- task EstimateGetAllMasterData --fail-fast
```

##### 🔄 Downstream Master Synchronization Orchestrator (`SyncAllMasterData` / `upsert_00_all`)

Execute all 22 downstream master synchronization tasks sequentially from the local `feeder_master` schema to institutional and academic tables following topological DAG dependencies:

```bash
# Execute the complete pipeline sequentially (Steps 01 to 22)
cargo run -- task SyncAllMasterData
# Or using the file/task alias:
cargo run -- task upsert_00_all

# Abort immediately on the first encountered error
cargo run -- task SyncAllMasterData --fail-fast

# Resume/start execution from a specific step (e.g., resume from Step 14)
cargo run -- task SyncAllMasterData --start-from 14

# Execute only a single targeted step (e.g., Step 21)
cargo run -- task SyncAllMasterData --only 21

# Run without interactive progress bars
cargo run -- task SyncAllMasterData --no-progress
```

#### 3. PDDikti Feeder Downstream Master Synchronization Hierarchy

Data synchronization from the local `feeder_master` schema to institutional and academic system tables must be executed following a strict **Directed Acyclic Graph (DAG)** to guarantee that all relational foreign key dependencies are satisfied.

```mermaid
flowchart TD
    subgraph L1["Tier 1: Master Identity & Core Reference"]
        T01["01: Mahasiswa (students)"]
        T02["02: Dosen (lecturers)"]
        T03["03: Periode Aktivitas (activities)"]
        T04["04: Skala Nilai (grades)"]
        T05["05: Mata Kuliah (courses)"]
    end

    subgraph L2["Tier 2: Kurikulum & Perencanaan Matakuliah"]
        T06["06: Kurikulum & Detail (curriculums)"]
        T07["07: Rencana Evaluasi (course_evaluation_plannings)"]
        T08["08: RPS (course_learn_plannings)"]
    end

    subgraph L3["Tier 3: Kode Kelas Perkuliahan"]
        T09["09: Kode Kelas dari Kelas Kuliah (class_codes)"]
        T10["10: Kode Kelas dari KRS (class_codes)"]
    end

    subgraph L4["Tier 4: Kelas Perkuliahan (Teaches)"]
        T11["11: Kelas Kuliah (teaches)"]
        T12["12: Kelas Kuliah dari KRS (teaches)"]
        T13["13: Metrik Kelas Kuliah (teaches metrics)"]
    end

    subgraph L5["Tier 5: Relasi Kelas Perkuliahan"]
        T14["14: Dosen Pengajar (teach_lecturers)"]
        T15["15: Komponen Evaluasi Kelas (teach_evaluations)"]
    end

    subgraph L6["Tier 6: Aktivitas Semester & Konversi"]
        T16["16: AKM Mahasiswa (student_activities)"]
        T17["17: Nilai Transfer (convertions)"]
    end

    subgraph L7["Tier 7: KRS & Nilai Mahasiswa"]
        T18["18: KRS Mahasiswa (detail_activities)"]
        T19["19: Peserta Kelas (detail_activities)"]
        T20["20: Detail Nilai Perkuliahan (detail_activities)"]
    end

    subgraph L8["Tier 8: Detail Kontak Individu"]
        T21["21: Kontak Mahasiswa (contact_details)"]
        T22["22: Kontak Dosen (contact_details)"]
    end

    T05 --> T06
    T05 --> T07
    T05 --> T08

    T03 --> T09
    T03 --> T10

    T03 & T05 & T09 & T10 --> T11
    T03 & T05 & T09 & T10 --> T12
    T11 & T12 --> T13

    T02 & T11 & T13 --> T14
    T11 & T13 --> T15

    T01 & T03 --> T16
    T01 & T05 & T04 --> T17

    T01 & T16 & T11 --> T18
    T01 & T16 & T11 --> T19
    T18 & T19 & T04 --> T20

    T01 --> T21
    T02 --> T22
```

##### Running Downstream Master Synchronization

You can execute the entire pipeline sequentially using the master orchestrator `SyncAllMasterData` (`upsert_00_all`), or run specific steps:

```bash
# Execute the full pipeline sequentially (Steps 01 to 22)
cargo run -- task SyncAllMasterData

# Abort immediately if any step fails
cargo run -- task SyncAllMasterData --fail-fast

# Start execution from a specific step (e.g. resume from step 14)
cargo run -- task SyncAllMasterData --start-from 14

# Run only a specific step (e.g. step 21)
cargo run -- task SyncAllMasterData --only 21

# Run without interactive progress bars
cargo run -- task SyncAllMasterData --no-progress
```

##### Master Synchronization Pipeline Matrix

| Step | Implementation Plan | Feeder Source Table | Target System Table | Relational Dependencies |
| :---: | :--- | :--- | :--- | :--- |
| **00** | [00_all](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_00_all.md) | *All master feeder tables* | *All target tables (Steps 01–22)* | Sequential execution of all 22 tasks |
| **01** | [01_biodata_mahasiswa_and_mahasiswa](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_01_biodata_mahasiswa_and_mahasiswa_to_individual_and_student.md) | `biodata_mahasiswa`, `mahasiswa` | `person_master.individuals`, `academic_student_master.students` | Static references (`units`, `academic_years`, `religions`, `districts`) |
| **02** | [02_biodata_dosen_and_dosen](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_02_biodata_dosen_and_dosen_to_individual_lecturer.md) | `biodata_dosen`, `dosen` | `person_master.individuals`, `academic_lecturer_master.lecturers` | Static references (`units`, `religions`, `districts`) |
| **03** | [03_periode_perkuliahan](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_03_periode_perkuliahan_to_academic_campaign_transaction_activities.md) | `periode_perkuliahan` | `academic_campaign_transaction.activities` | `institution_master.units`, `academic_general_reference.academic_years` |
| **04** | [04_skala_nilai_prodi](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_04_skala_nilai_prodi_to_academic_campaign_transaction_grades.md) | `skala_nilai_program_studi` | `academic_campaign_transaction.grades` | `institution_master.units` |
| **05** | [05_matakuliah](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_05_matakuliah_to_academic_course_master_course.md) | `matakuliah` | `academic_course_master.courses` | `institution_master.units` |
| **06** | [06_kurikulum_and_matkul_kurikulum](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_06_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details.md) | `kurikulum`, `matakuliah_kurikulum` | `academic_course_master.curriculums`, `curriculum_details` | Step 05 (`courses`), `units`, `academic_years` |
| **07** | [07_rencana_evaluasi](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_07_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings.md) | `rencana_evaluasi` | `academic_course_master.course_evaluation_plannings` | Step 05 (`courses`), `evaluation_types` |
| **08** | [08_rencana_pembelajaran](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_08_rencana_pembelajaran_to_academic_course_master_course_learn_plannings.md) | `rencana_pembelajaran` | `academic_course_master.course_learn_plannings` (RPS) | Step 05 (`courses`), `units`, `institutions` |
| **09** | [09_kelas_kuliah_to_class_code](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_09_kelas_kuliah_to_academic_campaign_transaction_class_code.md) | `kelas_kuliah` | `academic_campaign_transaction.class_codes` | Step 03 (`activities`), `units`, `academic_years` |
| **10** | [10_kartu_rencana_studi_to_class_code](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_10_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code.md) | `kartu_rencana_studi_mahasiswa` | `academic_campaign_transaction.class_codes` | Step 03 (`activities`), `units`, `academic_years` |
| **11** | [11_kelas_kuliah_to_teaches](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_11_kelas_kuliah_to_academic_campaign_transaction_teaches.md) | `kelas_kuliah` | `academic_campaign_transaction.teaches` | Step 03 (`activities`), Step 05 (`courses`), Step 09 (`class_codes`) |
| **12** | [12_kartu_rencana_studi_to_teaches](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_12_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches.md) | `kartu_rencana_studi_mahasiswa` | `academic_campaign_transaction.teaches` | Step 03 (`activities`), Step 05 (`courses`), Step 09-10 (`class_codes`) |
| **13** | [13_nilai_perkuliahan_kelas_to_teaches](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_13_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches.md) | `nilai_perkuliahan_kelas` | `academic_campaign_transaction.teaches` (metrics) | Step 11-12 (`teaches`), Step 03 (`activities`), Step 05 (`courses`) |
| **14** | [14_aktifitas_mengajar_dosen](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_14_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.md) | `aktifitas_mengajar_dosen` | `academic_campaign_transaction.teach_lecturers` | Step 02 (`lecturers`), Step 11-13 (`teaches`), Step 05 (`courses`) |
| **15** | [15_komponen_evaluasi_kelas](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_15_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations.md) | `komponen_evaluasi_kelas` | `academic_campaign_transaction.teach_evaluations` | Step 11-13 (`teaches`), `evaluation_types` |
| **16** | [16_perkuliahan_mahasiswa](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_16_perkuliahan_mahasiswa_to_academic_student_campaign_activities.md) | `perkuliahan_mahasiswa` | `academic_student_campaign.student_activities` (AKM) | Step 01 (`students`), Step 03 (`activities`), `academic_years` |
| **17** | [17_nilai_transfer_pendidikan](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_17_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions.md) | `nilai_transfer_pendidikan_mahasiswa` | `academic_student_campaign.convertions` | Step 01 (`students`), Step 05 (`courses`), Step 04 (`grades`) |
| **18** | [18_kartu_rencana_studi_to_detail](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_18_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities.md) | `kartu_rencana_studi_mahasiswa` | `academic_student_campaign.detail_activities` | Step 01 (`students`), Step 16 (`student_activities`), Step 11-13 (`teaches`), Step 05 (`courses`) |
| **19** | [19_peserta_kelas_kuliah](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_19_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities.md) | `peserta_kelas_kuliah` | `academic_student_campaign.detail_activities` | Step 01 (`students`), Step 16 (`student_activities`), Step 11-13 (`teaches`), Step 03 (`activities`) |
| **20** | [20_detail_nilai_perkuliahan_kelas](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_20_detail_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities.md) | `detail_nilai_perkuliahan_kelas` | `academic_student_campaign.detail_activities` (grades) | Step 18-19 (`detail_activities`), Step 01 (`students`), Step 11-13 (`teaches`), Step 04 (`grades`) |
| **21** | [21_biodata_mahasiswa_to_contact_details](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_21_biodata_mahasiswa_to_contact_details.md) | `biodata_mahasiswa` | `contact_master.phones`, `electronic_mails`, `residences` | Step 01 (`individuals`), `location` |
| **22** | [22_biodata_dosen_to_contact_details](server/src/tasks/feeder_dikti/synchronize/downstream/implementations/master/implementation_plan_upsert_22_biodata_dosen_to_contact_details.md) | `biodata_dosen` | `contact_master.phones`, `electronic_mails`, `residences` | Step 02 (`individuals`), `location` |

#### 4. Creating a Custom Task

To create a new task:

1. Create a new file in `server/src/tasks/` (or a sub-module like `server/src/tasks/utilities/`).
2. Implement the `Task` trait:

   ```rust
   use salvo::async_trait;
   use sea_orm::DatabaseConnection;
   use crate::tasks::Task;

   pub struct MyCustomTask;

   #[async_trait]
   impl Task for MyCustomTask {
       fn name(&self) -> &str {
           "custom:task"
       }

       fn description(&self) -> &str {
           "Description of what the task does"
       }

       async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
           println!("Executing custom task with args: {:?}", args);
           // Task logic here...
           Ok(())
       }
   }
   ```

3. Register the task in `server/src/tasks/mod.rs` inside `get_tasks()`:

   ```rust
   pub fn get_tasks() -> Vec<Box<dyn Task>> {
       vec![
           // ...
           Box::new(my_module::MyCustomTask),
       ]
   }
   ```

---

## 🧪 Testing & Quality Assurance

The repository includes a comprehensive testing matrix covering backend API integration tests, frontend white-box unit/component tests, and frontend black-box browser automation tests.

---

### 1. Backend Testing (`server/`)

Backend tests validate database entities, foreign key constraints, service layers, and permission relations.

#### Prerequisites

Install `cargo-nextest` for faster, parallelized test execution:

```bash
cargo install cargo-nextest --locked
```

#### Running Backend Tests

```bash
cd server

# Run all tests using nextest (Recommended)
cargo nextest run

# Run tests with real-time stdout output
cargo nextest run --no-capture

# Run a specific integration test file
cargo nextest run --test auth_relations_test
cargo nextest run --test person_relations_test

# Run tests matching a specific name filter
cargo nextest run test_user_permission_relation

# Alternative: Standard cargo test
cargo test
cargo test -- --nocapture
```

---

### 2. Frontend Testing (`client/`)

The frontend test suite is divided into two distinct levels of testing:

```mermaid
graph LR
    ClientTests[Frontend Testing Suite] --> WhiteBox[White-Box: Vitest + JSDOM]
    ClientTests --> BlackBox[Black-Box: Playwright Browser Automation]

    WhiteBox --> WB1[Storage Engine Unit Tests]
    WhiteBox --> WB2[Role & Auth State Machine Tests]
    WhiteBox --> WB3[Toaster Component & State Tests]
    WhiteBox --> WB4[TopBar Navigation Component Tests]

    BlackBox --> BB1[Landing Page & Hero Navigation]
    BlackBox --> BB2[Dark / Light Mode Theme Toggle]
    BlackBox --> BB3[Authentication Flows & Form Validation]
    BlackBox --> BB4[Real-time WebSocket Studio View]
    BlackBox --> BB5[404 Catch-All Recovery Routing]
```

#### Prerequisites (One-Time Setup)

Make sure dependencies and the Playwright Chromium browser binary are installed:

```bash
cd client

# Install project dependencies
bun install

# Install Playwright browser binaries (Chromium)
bunx playwright install chromium
```

#### A. White-Box Unit & Component Testing (Vitest)

White-box tests execute in an isolated JSDOM environment with `@solidjs/testing-library` to inspect internal state, signals, storage keys, and DOM rendering.

| Test File | Target | Coverage |
| :--- | :--- | :--- |
| `src/lib/storage.test.ts` | Storage Helpers | `localStorage`, `sessionStorage`, key removal, existence checks |
| `src/lib/authStore.test.ts` | Auth Engine | Role normalization, display names, route mapping, active role switcher, logout cleanup |
| `src/components/toast/Toaster.test.tsx` | Toast Component | Toast store state machine, notifications, unique ID generation, portal rendering |
| `src/components/navigation/TopBar.test.tsx` | Navigation Bar | Guest vs authenticated state, user badges, portal branding |

```bash
cd client

# Run all white-box unit & component tests
bun run test:unit

# Run in watch mode during development
bun run test:unit:watch

# Generate code coverage report
bun run test:unit:coverage
```

#### B. Black-Box End-to-End Browser Testing (Playwright / Laravel Dusk Counterpart)

Black-box tests launch a real headless or headed Chromium browser against the live SolidStart application to test complete end-to-end user workflows, routing, animations, and API communication.

| Spec File | Feature Area | What is Tested |
| :--- | :--- | :--- |
| `tests/e2e/home.spec.ts` | Landing Page | Hero branding, action buttons, live dark/light mode toggle |
| `tests/e2e/auth.spec.ts` | Authentication | Form inputs, password visibility toggle, remember email, navigation to session login |
| `tests/e2e/realtime.spec.ts` | WebSocket Studio | Real-time studio controls, layout, and connection badges |
| `tests/e2e/not-found.spec.ts` | 404 Catch-All | 404 graphic, invalid route reporting, "Back to Home" navigation |

```bash
cd client

# Run all black-box browser tests (Headless Chromium)
bun run test:e2e

# Run with a visible browser window (Headed mode)
bun run test:e2e:headed

# Open the interactive Playwright UI & Time-Travel Debugger
bun run test:e2e:ui
```

#### C. Run Complete Frontend Test Suite

To run both White-Box (Vitest) and Black-Box (Playwright) suites together:

```bash
cd client
bun run test
```

---

### 3. Frontend Production Build (`client/`)

```bash
cd client

# Type-check and build production bundle using Bun
bun run build

# Preview production build locally
bun run preview
```

---

### 4. Database Requirement

The backend requires **PostgreSQL `v18`** with these extensions installed on the server and enabled in **both** the main and test databases (`xsia_xarx`, `xsia_xarx_test`):

| Extension | `CREATE EXTENSION` name | Repository | Purpose |
| :--- | :--- | :--- | :--- |
| **pg_uuidv7** | `pg_uuidv7` | [fboulnois/pg_uuidv7](https://github.com/fboulnois/pg_uuidv7) | Time-ordered UUIDv7 primary keys via `uuid_generate_v7()` |
| **pgvector** | `vector` | [pgvector/pgvector](https://github.com/pgvector/pgvector) | `vector` column type & similarity search for AI embeddings |
| **pgmq** | `pgmq` | [pgmq/pgmq](https://github.com/pgmq/pgmq) | PostgreSQL-native message queue for background jobs (e.g. email) |
| **Apache AGE** | `age` | [apache/age](https://github.com/apache/age) | Graph database (openCypher) for the AI knowledge graph (`ai_graph`) |

#### A. Install the Extensions (build from source)

> ℹ️ PostgreSQL 18 has a built-in `uuidv7()` function, but the migrations call `uuid_generate_v7()`, so the **`pg_uuidv7` extension is still required**.

Make sure the PostgreSQL server development headers are installed first (e.g. `postgresql-server-dev-18` on Debian/Ubuntu, `postgresql18-devel` on Fedora/RHEL/Rocky) and that PostgreSQL 18's `pg_config` is on your `PATH` (PGDG on RHEL/Rocky: `export PATH=/usr/pgsql-18/bin:$PATH`). Extensions built against another major version won't load in PostgreSQL 18.

```bash
# 1. pg_uuidv7
git clone https://github.com/fboulnois/pg_uuidv7.git
cd pg_uuidv7 && make && sudo make install && cd ..

# 2. pgvector
git clone https://github.com/pgvector/pgvector.git
cd pgvector && make && sudo make install && cd ..

# 3. pgmq
git clone https://github.com/pgmq/pgmq.git
cd pgmq/pgmq-extension && make && sudo make install && cd ../..

# 4. Apache AGE (needs bison & flex; one branch per PostgreSQL major version)
git clone --branch release/PG18/1.8.0 https://github.com/apache/age.git
cd age && make && sudo make install && cd ..
```

> 💡 Prebuilt packages are also available for some platforms (e.g. `postgresql-18-pgvector` on Debian/Ubuntu or `pgvector_18` on RHEL/Rocky via the PGDG repositories, or the `pg_uuidv7` release tarballs on GitHub). Check each repository's README for your OS.

#### B. Enable the Extensions

Run the following as a superuser on **each** database:

```sql
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS age;
```

Or from the shell:

```bash
for DB in xsia_xarx xsia_xarx_test; do
  psql -U postgres -d "$DB" \
    -c "CREATE EXTENSION IF NOT EXISTS pg_uuidv7;" \
    -c "CREATE EXTENSION IF NOT EXISTS vector;" \
    -c "CREATE EXTENSION IF NOT EXISTS pgmq;" \
    -c "CREATE EXTENSION IF NOT EXISTS age;"
done
```

> ℹ️ The `ai` migration (`m20260228_145611_schema_ai_table_chunks`) also runs `CREATE EXTENSION IF NOT EXISTS age` / `vector` and creates the `ai_graph` graph, so the migration user needs permission to create extensions. AGE must be loaded in every session that runs Cypher queries. Non-superusers can't run `LOAD 'age'`, so set `ALTER DATABASE <db> SET session_preload_libraries = 'age';` as a superuser. If the database user isn't a superuser, also `GRANT USAGE ON SCHEMA ag_catalog` and `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ag_catalog` to it so the migration can create `ai_graph` (see `DEPLOYMENT.md` §2.C).

#### C. Verify

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_uuidv7', 'vector', 'pgmq', 'age');

-- Quick smoke tests
SELECT uuid_generate_v7();
SELECT '[1,2,3]'::vector;
SELECT pgmq.create('healthcheck'); SELECT pgmq.drop_queue('healthcheck');
SELECT * FROM ag_catalog.ag_graph;
```

> ⚠️ **PGMQ fallback:** On startup the server calls `PGMQueueExt::init()`. If the `pgmq` extension is unavailable, it falls back to installing the PGMQ schema from embedded SQL (`install-sql-embedded` feature). Installing the native extension is still recommended for production.

---

## 🐍 Python Tools (autocrop & docling)

Two Python command-line tools are installed with [uv](https://docs.astral.sh/uv/). Each one gets its own isolated virtual environment, so they don't touch the system Python.

| Tool | Repository | Purpose |
| :--- | :--- | :--- |
| **autocrop** | [leblancfg/autocrop](https://github.com/leblancfg/autocrop) | Detects faces (OpenCV YuNet, bundled offline model) and crops/resizes photos, e.g. student and staff profile pictures |
| **docling** | [docling-project/docling](https://github.com/docling-project/docling) | Converts PDF, DOCX, PPTX, XLSX, HTML and images (with OCR) to Markdown / JSON, e.g. for the `pgvector` embedding pipeline |

Both need **Python 3.10+**. uv downloads a suitable Python automatically if the system doesn't have one.

### 1. Install uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# then open a new shell, or: source $HOME/.local/bin/env

uv --version
```

### 2. Install autocrop

```bash
uv tool install autocrop

autocrop --version
```

Usage:

```bash
# Crop to the default 500×500 px around the face
autocrop portrait.jpg -o cropped.jpg

# Custom size, with the face filling 50% of the image height
autocrop portrait.jpg -o cropped.jpg -w 400 -H 600 --facePercent 50

# Crop around the face but keep the original resolution
autocrop portrait.jpg --no-resize > cropped.jpg
```

### 3. Install docling

```bash
# CPU-only (recommended for servers without an NVIDIA GPU, a much smaller download than CUDA PyTorch)
uv tool install docling \
  --extra-index-url https://download.pytorch.org/whl/cpu \
  --index-strategy unsafe-best-match

# With an NVIDIA GPU (CUDA PyTorch from PyPI)
# uv tool install docling

docling --version
```

Download the layout/OCR models ahead of time, so the first conversion doesn't stall and offline servers work:

```bash
docling-tools models download
```

Usage:

```bash
# Convert a PDF (local path or URL) to Markdown in the current directory
docling https://arxiv.org/pdf/2206.01062

# Choose the output format and directory
docling document.pdf --to md --output ./converted
docling document.pdf --to json --output ./converted
```

### 4. Upgrade / uninstall

```bash
uv tool list                 # installed tools
uv tool upgrade --all        # upgrade autocrop and docling
uv tool uninstall autocrop docling
```

> 💡 **On the production server**, install the tools as the account that runs the API (e.g. `sudo -u xsia -H bash -c '…'`). The executables land in that user's `~/.local/bin`. That folder isn't on the systemd service's `PATH`, so call them by absolute path or add `Environment=PATH=…` to the unit.

---

## 🚀 Production Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for a step-by-step guide to launching on a Rocky Linux 10 server (PostgreSQL 18 + extensions, systemd services, Ferron with automatic Let's Encrypt, SELinux/firewalld, redeploy and backup scripts).

---

## Fix Role

```sh
cargo run -- task utility:generate-permission-from-client --prune
```

## 📄 License

**Personal License** — Copyright © 2026 Benny L.E.P. All rights reserved.

This project is the personal property of the author and is provided for **personal use only**.
Without prior written permission from the author, you may **not**:

- Copy, modify, merge, or create derivative works of this software
- Distribute, sublicense, sell, or publish this software or any part of it
- Use this software for commercial purposes

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM THE USE OF THIS SOFTWARE.
