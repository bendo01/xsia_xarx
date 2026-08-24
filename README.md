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
- [Quick Start](#-quick-start)
  - [1. Backend Setup (`server/`)](#1-backend-setup-server)
  - [2. Frontend Setup (`client/`)](#2-frontend-setup-client)
- [API Documentation & Swagger UI](#-api-documentation--swagger-ui)
- [Real-time Communication & WebSockets](#-real-time-communication--websockets)
- [Database Migrations & Entity Generation](#-database-migrations--entity-generation)
- [Background Workers & Task Runner](#-background-workers--task-runner)
- [Testing & Quality Assurance](#-testing--quality-assurance)
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
- ⚡ **Asynchronous Background Processing**: Queue-backed task execution via [Apalis](https://github.com/geoffraey/apalis) on Redis (e.g. SMTP email delivery, periodic workers).
- 📄 **Reporting & Utilities**: Headless Chrome PDF generation, `rust_xlsxwriter` Excel spreadsheets, QR code generation, Tera templates, and Fluent i18n localization.

---

## 🏗️ Architecture & Monorepo Structure

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
│   │   ├── jobs/                 # Apalis queue job workers (e.g. email)
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
    └── vite.config.ts            # Vite 8 & SolidStart build configuration
```

---

## 🚀 Tech Stack

### Backend (`server/`)

| Layer / Purpose | Technology | Details |
| :--- | :--- | :--- |
| **Language & Runtime** | [Rust](https://www.rust-lang.org/) (2024 Edition) | Multi-threaded async engine on [Tokio](https://tokio.rs/) v1.45 |
| **Web Framework** | [Salvo](https://salvo.rs/) (v0.95) | HTTP/HTTPS server with OpenAPI & Swagger UI generation |
| **Database & ORM** | [SeaORM](https://www.sea-ql.org/SeaORM/) (v2.0) | PostgreSQL, RBAC, Schema Sync, `pgvector` |
| **Task Queue & Scheduler** | [Apalis](https://github.com/geoffraey/apalis) (v0.7) | Redis-backed background job queue & workers |
| **Security & Auth** | JWT, Argon2, Bcrypt | Token signing, verification, secure password hashing |
| **AI / Machine Learning** | Rig-core, Candle, Burn, `text-splitter` | Vector search, embeddings, model inferencing |
| **Reporting & Media** | Headless Chrome, `rust_xlsxwriter`, Lettre, QR Code | Dynamic PDF generation, Excel reports, SMTP email, QR codes |
| **Testing** | `cargo-nextest`, `rstest`, `insta` | Fast parallel test execution and snapshot testing |

### Frontend (`client/`)

| Layer / Purpose | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [SolidJS](https://www.solidjs.com/) (v1.9) + [SolidStart](https://start.solidjs.com/) (v2.0) | Fine-grained reactivity, SSR/CSR, Nitro engine |
| **Build Tool** | [Vite](https://vitejs.dev/) (v8.0) | Instant HMR, lightning-fast compilation |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS engine via `@tailwindcss/vite` |
| **Data & State Management** | TanStack Solid Form & Table | Robust form handling and virtualized data grids |
| **Visualizations & Maps** | TanStack Charts, OpenLayers (`ol`) | Interactive charts and GIS mapping capabilities |
| **UI Components & Rich Text** | Slim Select, Quill, Toastify JS, Floating UI | Rich text editing, toast notifications, popovers |

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Rust**: Version `1.97.1+` (or latest stable supporting edition 2024)
- **Node.js**: `v24+` and **pnpm** (or `npm`/`yarn`/`bun`)
- **PostgreSQL**: `v15+` with `pgvector` extension enabled
- **Redis**: `v7+` for background job execution
- **SeaORM CLI**: Installed via Cargo:
  ```bash
  cargo install sea-orm-cli
  ```
- *(Optional)* **cargo-nextest**: For ultra-fast test execution:
  ```bash
  cargo install cargo-nextest --locked
  ```

---

## ⚙️ Environment Configuration

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

# Redis & Apalis Task Queue
REDIS_URL="redis://127.0.0.1:6379"

# Authentication & Security
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION_HOURS=24

# Institution & Academic Context
CURRENT_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
CURRENT_STUDENT_ADMISSION_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
CURRENT_INSTITUTION_ID="ed7e8c02-451b-4548-aa81-26b8d0b7fdec"
CURRENT_INSTITUTION_CODE="092010"

# SMTP Mailer Settings
SMTP_HOST="mail.xsia.app"
SMTP_PORT=587
SMTP_USER="no-reply@xsia.app"
SMTP_PASSWORD="your-smtp-password"
SMTP_SENDER="Academic Information System"
SYSTEM_MAIL_ADDRESS="no-reply@xsia.app"
SMTP_SECURE=true

# External Integrations (PDDikti Feeder / Payment)
FEEDER_USERNAME="feeder_username"
FEEDER_PASSWORD="feeder_password"
FEEDER_URL="http://feeder.example.ac.id/ws/live2.php"
IS_PRODUCTION_MIDTRANS_PAYMENT=false
```

### Client Environment (`client/.env`)

Create a `.env` file in the `client/` directory:

```env
CURRENT_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
CURRENT_STUDENT_ADMISSION_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
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

2. **Run database migrations**:
   ```bash
   sea-orm-cli migrate up
   ```

3. **Start the server with background email worker**:
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
   # or: pnpm install
   ```

3. **Start the development server**:
   ```bash
   bun run dev
   # or: pnpm dev
   ```
   Open your browser at `http://localhost:3000` (or the port indicated in terminal).

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

### 3. Background Job Execution (Apalis Email Worker)
In addition to the HTTP and WebSocket endpoints, `cargo run` automatically spawns an asynchronous **Apalis** background task worker:
- **Worker Runtime**: Tokio background task (`tokio::spawn(email_worker.run())`)
- **Queue Storage**: Redis (`REDIS_URL="redis://127.0.0.1:6379"`)
- **Responsibilities**: Consumes and processes queued tasks (such as transactional SMTP emails) asynchronously without blocking HTTP requests.

---

## 🗄️ Database Migrations & Entity Generation

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

### Apalis Redis Background Workers
The server automatically initializes an **Apalis** background monitor on startup to process queued jobs (such as transactional emails via SMTP):
- **Worker Queue**: `xsia-xarx:email`
- **Job Structure**: `EmailJob { to, subject, body }`

### CLI Task Runner
Custom CLI tasks and one-off batch scripts can be executed using the integrated task runner:

```bash
cd server

# List all available CLI tasks
cargo run -- task

# Run a specific task with optional arguments
cargo run -- task example
cargo run -- task example --arg1 value1
```

---

## 🧪 Testing & Quality Assurance

### Backend Tests (`server/`)

Run the complete test suite using `cargo-nextest` (recommended for speed and parallelism):

```bash
cd server

# Run all backend tests
cargo nextest run

# Run with stdout output enabled
cargo nextest run --no-capture

# Run a specific test suite or test filter
cargo nextest run --test auth_relations_test
cargo nextest run --test person_relations_test
cargo nextest run test_user_permission_relation
```

Or using standard `cargo test`:
```bash
cargo test
cargo test -- --nocapture
```

### Frontend Production Build (`client/`)

```bash
cd client

# Type-check and build production bundle using Bun
bun run build
# or: pnpm build

# Preview production build locally
bun run preview
# or: pnpm preview
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
