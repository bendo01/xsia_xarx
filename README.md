# xsia_xarx

`xsia_xarx` is a full-stack web application featuring a high-performance **Rust** backend engine and a responsive **SolidJS** modern frontend client.

---

## 🏗️ Project Architecture

The repository is structured as a monorepo containing the following main components:

```text
xsia_xarx/
├── server/          # Backend API services built with Rust
└── client/          # Web client frontend built with SolidJS & Vite
```

---

## 🚀 Tech Stack

### Backend (`server/`)
* **Language & Runtime:** Rust (2024 Edition) powered by [Tokio](https://tokio.rs/) multi-threaded runtime.
* **Web Framework:** [Salvo](https://salvo.rs/) (v0.95) with OpenAPI support.
* **Database & ORM:** [SeaORM](https://www.sea-ql.org/SeaORM/) (v2.0) with PostgreSQL, `pgvector` for vector embeddings, RBAC, and schema sync.
* **AI & Machine Learning:** [Rig-core](https://github.com/0xPlaygrounds/rig), [Candle](https://github.com/huggingface/candle) (HuggingFace), [Tensorflow](https://github.com/tensorflow/rust), [Burn](https://burn.dev/), and `text-splitter`.
* **Background Tasks & Scheduling:** [Apalis](https://github.com/geoffraey/apalis) (`apalis-cron`, `apalis-redis`).
* **Observability & Logging:** Tracing, OpenTelemetry (OTLP), subscriber JSON format.
* **Templating & Utilities:** Tera, Fluent-templates (i18n), Lettre (SMTP), Headless Chrome, `rust_xlsxwriter`, QR code generator.

### Frontend (`client/`)
* **Framework:** [SolidJS](https://www.solidjs.com/) with TypeScript.
* **Build Tool:** [Vite](https://vitejs.dev/).
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS.
* **Routing:** `@solidjs/router`.
* **Data Visualization:** Chart.js & `solid-chartjs`.

---

## 🛠️ Getting Started

### Prerequisites
* **Rust**: 1.97.1+ (or latest stable toolchain supporting 2024 edition)
* **Node.js**: v24+ and **pnpm** (or `npm`/`yarn`)
* **PostgreSQL**: With `pgvector` extension installed
* **Redis**: For background task queueing (Apalis)

---

## 💻 Running Locally

### 1. Setting Up the Backend (`server/`)

Navigate to the `server/` directory:

```bash
cd server
```

Copy or configure your environment variables (e.g. `.env`):

```bash
# Example environment settings
DATABASE_URL=postgres://postgres:password@localhost:5432/xsia_xarx
REDIS_URL=redis://127.0.0.1:6379
```

Run database migrations:

```bash
sea-orm-cli migrate up
```

Run the server in development mode:

```bash
cargo run
```

---

### 2. Setting Up the Frontend (`client/`)

Navigate to the `client/` directory:

```bash
cd client
```

Install dependencies:

```bash
pnpm install
# or npm install
```

Start the Vite development server:

```bash
pnpm dev
# or npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port indicated by Vite) in your browser.

---

## 🧪 Testing & Verification

### Backend Tests (`server/`)
Navigate to the `server/` directory:
```bash
cd server
```

Run tests using [cargo-nextest](https://nexte.st/) (recommended):
```bash
# Run all server tests using nextest
cargo nextest run

# Run tests with stdout output enabled (uncaptured output)
cargo nextest run --no-capture

# Run a specific test suite or test function
cargo nextest run --test auth_relations_test
cargo nextest run test_user_permission_relation
```

Or using standard `cargo test`:
```bash
cargo test
cargo test -- --nocapture
```

### Frontend Production Build
From the `client/` directory:
```bash
pnpm build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
