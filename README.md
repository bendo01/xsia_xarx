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
  - [1. Backend Testing (`server/`)](#1-backend-testing-server)
  - [2. Frontend Testing (`client/`)](#2-frontend-testing-client)
  - [3. Frontend Production Build (`client/`)](#3-frontend-production-build-client)
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

Custom CLI tasks, utilities, and one-off maintenance scripts can be executed using the integrated task runner located in `server/src/tasks/`.

Both colon (`:`) and underscore (`_`) task name formats are supported interchangeably (e.g. `hash:password` or `hash_password`).

#### 1. List Available Tasks

To view all registered tasks and their descriptions:

```bash
cd server
cargo run -- task
```

#### 2. Built-in Tasks & Usage Examples

| Task Name | Description | Example Command |
| :--- | :--- | :--- |
| `hash:password` | Generates secure password hashes using Argon2id (application standard) and Bcrypt. | `cargo run -- task hash:password "MySecretPass123"` |
| `route:list` | Displays a table of all registered system HTTP routes, methods, and handlers. | `cargo run -- task route:list` |
| `sync_permissions` | Synchronizes predefined route permission records into the `auth.permissions` database table. | `cargo run -- task sync_permissions` |
| `example` | Test task demonstrating argument passing and database access. | `cargo run -- task example arg1 arg2` |
| `EstimateAktifitasMengajarDosen` | Fetch and process GetAktivitasMengajarDosen data from Feeder Dikti | `cargo run -- task EstimateAktifitasMengajarDosen` |
| `EstimateGetAllProdi` | Fetch and process GetAllProdi data from Feeder Dikti | `cargo run -- task EstimateGetAllProdi` |
| `EstimateGetAllPT` | Fetch and process GetAllPT data from Feeder Dikti | `cargo run -- task EstimateGetAllPT` |
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
| `EstimateGetDosenPengajarKelasKuliah` | Fetch and process GetDosenPengajarKelasKuliah data from Feeder Dikti | `cargo run -- task EstimateGetDosenPengajarKelasKuliah` |
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
| `EstimateGetProdi` | Fetch and process GetProdi data from Feeder Dikti | `cargo run -- task EstimateGetProdi` |
| `EstimateGetProfilPT` | Fetch and process GetProfilPT data from Feeder Dikti | `cargo run -- task EstimateGetProfilPT` |
| `EstimateRiwayatFungsionalDosen` | Fetch and process GetRiwayatFungsionalDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatFungsionalDosen` |
| `EstimateRiwayatNilaiMahasiswa` | Fetch and process GetRiwayatNilaiMahasiswa data from Feeder Dikti | `cargo run -- task EstimateRiwayatNilaiMahasiswa` |
| `EstimateRiwayatPangkatDosen` | Fetch and process GetRiwayatPangkatDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatPangkatDosen` |
| `EstimateRiwayatPendidikanDosen` | Fetch and process GetRiwayatPendidikanDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatPendidikanDosen` |
| `EstimateRiwayatPenelitianDosen` | Fetch and process GetRiwayatPenelitianDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatPenelitianDosen` |
| `EstimateRiwayatSertifikasiDosen` | Fetch and process GetRiwayatSertifikasiDosen data from Feeder Dikti | `cargo run -- task EstimateRiwayatSertifikasiDosen` |
| `EstimateTranskripMahasiswa` | Fetch and process GetTranskripMahasiswa data from Feeder Dikti | `cargo run -- task EstimateTranskripMahasiswa` |
| `EstimateGetAlatTransportasi` | Fetch and process GetAlatTransportasi data from Feeder Dikti | `cargo run -- task EstimateGetAlatTransportasi` |
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
| `EstimateGetSemester` | Fetch and process GetSemester data from Feeder Dikti | `cargo run -- task EstimateGetSemester` |
| `EstimateGetStatusKeaktifanPegawai` | Fetch and process GetStatusKeaktifanPegawai data from Feeder Dikti | `cargo run -- task EstimateGetStatusKeaktifanPegawai` |
| `EstimateGetStatusKepegawaian` | Fetch and process GetStatusKepegawaian data from Feeder Dikti | `cargo run -- task EstimateGetStatusKepegawaian` |
| `EstimateGetStatusMahasiswa` | Fetch and process GetStatusMahasiswa data from Feeder Dikti | `cargo run -- task EstimateGetStatusMahasiswa` |
| `EstimateGetTahunAjaran` | Fetch and process GetTahunAjaran data from Feeder Dikti | `cargo run -- task EstimateGetTahunAjaran` |
| `EstimateGetTingkatPrestasi` | Fetch and process GetTingkatPrestasi data from Feeder Dikti | `cargo run -- task EstimateGetTingkatPrestasi` |
| `EstimateGetWilayah` | Fetch and process GetWilayah data from Feeder Dikti | `cargo run -- task EstimateGetWilayah` |
| `EstimateGetAgama` | Fetch and process GetAgama data from Feeder Dikti | `cargo run -- task EstimateGetAgama` |
| `SyncNilaiPerkuliahanKelasToDetailActivities` | Upsert detail_nilai_perkuliahan_kelas to academic_student_campaign.detail_activities | `cargo run -- task SyncNilaiPerkuliahanKelasToDetailActivities` |

##### 🔑 Password Hashing Utility (`hash:password`)

Hash a raw password string directly from command-line arguments:

```bash
# Generate both Argon2id and Bcrypt hashes:
cargo run -- task hash:password "MySecretPass123"

# Specify a specific algorithm (argon2 or bcrypt):
cargo run -- task hash:password "MySecretPass123" argon2
cargo run -- task hash:password "MySecretPass123" bcrypt

# Interactive prompt (if no argument is provided):
cargo run -- task hash:password
```

##### 🛣️ Route Listing (`route:list`)

List and inspect registered API routes in a formatted table:

```bash
# List all routes
cargo run -- task route:list

# Filter routes by path, method, handler name, or keyword
cargo run -- task route:list auth
cargo run -- task route:list student
```

##### 🔄 Sync Permissions (`sync_permissions`)

Sync predefined system permission constants into the PostgreSQL database:

```bash
cargo run -- task sync_permissions
# or
cargo run -- task sync:permissions
```

#### 3. Creating a Custom Task

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
# or: pnpm install

# Install Playwright browser binaries (Chromium)
bunx playwright install chromium
# or: pnpm exec playwright install chromium
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
# or: pnpm test:unit

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
# or: pnpm test:e2e

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
# or: pnpm test
```

---

### 3. Frontend Production Build (`client/`)

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
