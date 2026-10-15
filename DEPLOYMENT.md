# 🚀 Production Deployment — Rocky Linux 10

This guide deploys `xsia_xarx` to a single **Rocky Linux 10** server (x86_64):

```text
                    ┌────────────────────── Rocky Linux 10 server ───────────────────────┐
 Browser ──HTTPS──▶ │ Ferron :443 (auto Let's Encrypt)                                   │
                    │   ├── app.example.ac.id  ──▶ SolidStart SSR (bun)   127.0.0.1:3000 │
                    │   └── api.example.ac.id  ──▶ Rust API (salvo)       127.0.0.1:5800 │
                    │                                   │                                │
                    │                                   └──▶ PostgreSQL 18 :5432         │
                    │                                   (pg_uuidv7, pgvector, pgmq, age) │
                    └────────────────────────────────────────────────────────────────────┘
```

Replace `app.example.ac.id` / `api.example.ac.id` with your real domains everywhere below.

> ⚙️ Rocky Linux 10 requires an **x86-64-v3** CPU (Haswell / Zen or newer). On older hardware or VMs with a generic CPU model it won't boot, so set the VM's CPU type to `host` or `x86-64-v3`.

> ℹ️ **Facts about the app that shape this setup**
> - The API binary **always binds `127.0.0.1:5800`** (hard-coded in `server/src/main.rs`; `SERVER_PORT` is ignored). It must sit behind a reverse proxy (Ferron here).
> - The API reads `.env` from its **working directory** and resolves `public/...` paths (logos, signatures, uploads) **relative to it**. The systemd unit must set `WorkingDirectory` to the folder containing `.env` and `public/`.
> - The [PGMQ](https://github.com/pgmq/pgmq) email worker runs inside the API process — no separate worker service is needed. Redis is **not** required (`REDIS_URL` is read but unused).
> - PDF generation uses headless Chrome/Chromium (`CHROME_BIN`).
> - Client `VITE_*` / `CURRENT_*` variables are **baked in at build time**. Rebuild the client whenever they change.

---

## 📑 Contents

1. [Prepare the server](#1-prepare-the-server)
2. [Install PostgreSQL 18 + extensions](#2-install-postgresql-18--extensions)
3. [Install build toolchains (Rust, Bun)](#3-install-build-toolchains-rust-bun)
4. [Install headless Chromium (PDF) & Python tools](#4-install-headless-chromium-pdf--python-tools)
5. [Get the code](#5-get-the-code)
6. [Build & configure the backend](#6-build--configure-the-backend)
7. [Build & configure the frontend](#7-build--configure-the-frontend)
8. [systemd services](#8-systemd-services)
9. [Ferron reverse proxy + HTTPS](#9-ferron-reverse-proxy--https)
10. [Firewall & SELinux](#10-firewall--selinux)
11. [Verify](#11-verify)
12. [Inbound webhooks (Mail-in-a-Box & OpenWA)](#12-inbound-webhooks-mail-in-a-box--openwa)
13. [Updating / redeploying](#13-updating--redeploying)
14. [Backups](#14-backups)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Prepare the server

```bash
sudo dnf -y update
sudo dnf -y install epel-release
sudo dnf config-manager --set-enabled crb          # CodeReady Builder (needed by EPEL / -devel packages)
sudo dnf -y install git curl tar unzip policycoreutils-python-utils \
  gcc gcc-c++ make cmake clang perl pkgconf-pkg-config openssl-devel

sudo timedatectl set-timezone Asia/Makassar          # adjust to your timezone

# Dedicated, non-login service account.
# Its home (Rust/Bun toolchains, caches) stays OUTSIDE the web directory.
sudo useradd --system --create-home --home-dir /var/lib/xsia --shell /sbin/nologin xsia

# Application directory
sudo mkdir -p /var/www/ferron/xsia_xarx
sudo chown xsia:xsia /var/www/ferron/xsia_xarx
sudo chmod 750 /var/www/ferron/xsia_xarx            # Ferron only proxies; it never needs to read these files
```

Directory layout used in this guide:

```text
/var/www/ferron/xsia_xarx/
├── src/                 # git checkout (build happens here)
├── server/              # runtime: xsia_xarx binary, migration binary, .env, public/, logs/
└── client/              # runtime: .output/ (SolidStart SSR build)

/var/lib/xsia/           # home of the xsia user: ~/.cargo, ~/.rustup, ~/.bun
```

> ⚠️ **`/var/www/ferron` is Ferron's default web root.** The app directory holds `.env` (database password, JWT secret) and the full source, so **no Ferron host may use `root "/var/www/ferron"`** or any folder above `xsia_xarx`. Otherwise those files could be downloaded over HTTP. Remove or change the catch-all `:80 { root "/var/www/ferron" }` block that ships with Ferron (it's also in `server/server_config/ferron.kdl`). The `chmod 750` above is a second safeguard: the `ferron` user can't read the folder even if a host is misconfigured.

---

## 2. Install PostgreSQL 18 + extensions

### A. PostgreSQL from the official PGDG repository

```bash
# Rocky 10 has no module streams, so there's no "dnf module disable postgresql" step
sudo dnf -y install https://download.postgresql.org/pub/repos/yum/reporpms/EL-10-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo dnf -y install postgresql18-server postgresql18-contrib postgresql18-devel pgvector_18

sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
sudo systemctl enable --now postgresql-18
```

> ℹ️ **PostgreSQL 18 notes**
> - PG 18 has a built-in `uuidv7()` function, but the migrations call `uuid_generate_v7()`, so the `pg_uuidv7` extension is **still required**.
> - `initdb` turns on data checksums by default in 18. That's fine for a fresh cluster, but `pg_upgrade` from an older cluster without checksums needs `--no-data-checksums` at `initdb` time (or enable checksums on the old cluster first).
> - If PGDG doesn't publish `pgvector_18` for EL-10 yet, build it from source the same way as the others below.

### B. Build `pg_uuidv7`, `pgmq`, and Apache AGE from source

`pgvector` came from PGDG above; the others ([pg_uuidv7](https://github.com/fboulnois/pg_uuidv7), [pgmq](https://github.com/pgmq/pgmq) — PostgreSQL-native message queue used by the email worker) are built against PGDG's `pg_config`. [Apache AGE](https://github.com/apache/age) (graph database / openCypher, used for the AI knowledge graph `ai_graph`) also needs `bison` and `flex`:

```bash
sudo dnf -y install bison flex
export PATH=/usr/pgsql-18/bin:$PATH
cd /tmp

git clone https://github.com/fboulnois/pg_uuidv7.git
(cd pg_uuidv7 && make && sudo PATH=$PATH make install)

git clone https://github.com/pgmq/pgmq.git
(cd pgmq/pgmq-extension && make && sudo PATH=$PATH make install)

# AGE ships one branch per PostgreSQL major version — use the PG18 one
git clone --branch release/PG18/1.8.0 https://github.com/apache/age.git
(cd age && make && sudo PATH=$PATH make install)
```

### C. Create the database, role, and enable extensions

```bash
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=')"; echo "DB password: $DB_PASS"   # store it safely

sudo -u postgres psql <<SQL
CREATE ROLE xsia WITH LOGIN PASSWORD '$DB_PASS';
CREATE DATABASE xsia_xarx OWNER xsia;
\c xsia_xarx
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgmq;
GRANT ALL ON SCHEMA pgmq TO xsia;
GRANT ALL ON ALL TABLES IN SCHEMA pgmq TO xsia;
ALTER DEFAULT PRIVILEGES IN SCHEMA pgmq GRANT ALL ON TABLES TO xsia;
CREATE EXTENSION IF NOT EXISTS age;
GRANT USAGE ON SCHEMA ag_catalog TO xsia;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ag_catalog TO xsia;
ALTER DATABASE xsia_xarx SET session_preload_libraries = 'age';
SQL
```

> ℹ️ **Why the AGE grants?** The `ai` migration creates the `ai_graph` graph as the `xsia` role, and `xsia` is not a superuser:
> - `create_graph()` registers the graph in `ag_catalog.ag_graph` / `ag_label`, so `xsia` needs `USAGE` on `ag_catalog` plus write access to its tables. The graph schema `ai_graph` is then owned by `xsia`.
> - Non-superusers may not run `LOAD 'age'` (`access to library "age" is not allowed`). `session_preload_libraries` loads AGE into every new connection to `xsia_xarx` instead, which `cypher()` queries need. The setting only applies to **new** connections.
> - `CREATE EXTENSION age` must be run by a superuser (above). The migration's own `CREATE EXTENSION IF NOT EXISTS` then just skips.

Switch local TCP auth to passwords. In `/var/lib/pgsql/18/data/pg_hba.conf`, make sure the `host` lines for `127.0.0.1/32` and `::1/128` use `scram-sha-256` (not `ident`), then:

```bash
sudo systemctl restart postgresql-18
psql "postgres://xsia:$DB_PASS@127.0.0.1:5432/xsia_xarx" -c "SELECT uuid_generate_v7(), '[1,2,3]'::vector;" -c "SHOW session_preload_libraries;"
```

PostgreSQL listens on `localhost` only by default — keep it that way.

> 💡 **Restoring an existing database instead?** Create the role/database, extensions, and AGE grants as above, then `pg_restore -U xsia -h 127.0.0.1 -d xsia_xarx your_dump.dump` and skip the initial seed steps.

---

## 3. Install build toolchains (Rust, Bun)

Install as the `xsia` user so builds don't run as root. (Alternatively, build on a separate **Rocky Linux 10** machine and copy only the artifacts.)

```bash
# Rust (stable; the crate needs >= 1.97.1)
sudo -u xsia -H bash -c 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal'

# Bun — package manager, build runner, AND the runtime for the SolidStart SSR server (packageManager = bun@1.4.3)
# Vite+ (`vp`) needs no global install — it's a client dev dependency installed by `bun install`
sudo -u xsia -H bash -c 'curl -fsSL https://bun.sh/install | bash'
```

> ℹ️ Node.js is **not** needed. [Bun](https://github.com/oven-sh/bun) runs the client build (`bun --bun run build` forces Bun to run `vp`, whose shebang asks for `node`), the SSR server (`bun .output/server/index.mjs`), and `client/scripts/extract-api-usage.mjs` for the `generate:permission-from-client` task.

Helper to run commands as `xsia` with the toolchains on `PATH` (used throughout this guide):

```bash
asxsia() { sudo -u xsia -H bash -lc "export PATH=\$HOME/.cargo/bin:\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH; $*"; }
asxsia 'cargo --version && bun --version'
```

---

## 4. Install headless Chromium (PDF) & Python tools

### A. Headless Chromium

```bash
sudo dnf -y install chromium-headless          # from EPEL 10 (if unavailable: sudo dnf -y install chromium, then CHROME_BIN=/usr/bin/chromium-browser)
rpm -ql chromium-headless | grep -E 'headless_shell$'
# e.g. /usr/lib64/chromium-browser/headless_shell  → use this as CHROME_BIN
```

Also install fonts so PDFs render correctly:

```bash
sudo dnf -y install google-noto-sans-vf-fonts google-noto-serif-vf-fonts liberation-fonts dejavu-sans-fonts
```

### B. autocrop & docling (via uv)

Two Python CLI tools, each in its own isolated [uv](https://docs.astral.sh/uv/) environment (no system Python packages needed; uv fetches Python 3.10+ itself):

| Tool | Repository | Purpose |
| :--- | :--- | :--- |
| **autocrop** | [leblancfg/autocrop](https://github.com/leblancfg/autocrop) | Face detection + crop/resize of profile photos (student & staff) |
| **docling** | [docling-project/docling](https://github.com/docling-project/docling) | Converts PDF, DOCX, PPTX, XLSX, HTML and images (OCR) to Markdown / JSON for the `pgvector` embedding pipeline |

Install as `xsia` so the API can run them. Executables land in `/var/lib/xsia/.local/bin`:

```bash
sudo -u xsia -H bash -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'

asxsia 'uv tool install autocrop'
# CPU-only PyTorch: much smaller than the CUDA build. On an NVIDIA GPU server use plain `uv tool install docling`.
asxsia 'uv tool install docling --extra-index-url https://download.pytorch.org/whl/cpu --index-strategy unsafe-best-match'

# Pre-download docling's layout/OCR models (cached in /var/lib/xsia/.cache) so the first conversion doesn't stall
asxsia 'docling-tools models download'

asxsia 'autocrop --version && docling --version'
```

> ℹ️ `~/.local/bin` isn't on a systemd service's `PATH`. The API unit in [8.A](#a-api--etcsystemdsystemxsia-apiservice) adds it via `Environment=PATH=…`.

---

## 5. Get the code

```bash
sudo -u xsia git clone <YOUR_GIT_REMOTE_URL> /var/www/ferron/xsia_xarx/src
sudo -u xsia mkdir -p /var/www/ferron/xsia_xarx/server/logs /var/www/ferron/xsia_xarx/client
```

---

## 6. Build & configure the backend

### A. Build release binaries

```bash
asxsia 'cd /var/www/ferron/xsia_xarx/src/server && cargo build --release --locked'
asxsia 'cd /var/www/ferron/xsia_xarx/src/server/migration && cargo build --release --locked'
```

> ⏳ The first build is long and memory-hungry (Candle / Burn / TensorFlow / Headless Chrome crates). On servers with < 8 GB RAM add swap or limit parallelism with `CARGO_BUILD_JOBS=2`.

### B. Install the runtime files

```bash
sudo -u xsia install -m 0755 /var/www/ferron/xsia_xarx/src/server/target/release/xsia_xarx          /var/www/ferron/xsia_xarx/server/
sudo -u xsia install -m 0755 /var/www/ferron/xsia_xarx/src/server/migration/target/release/migration /var/www/ferron/xsia_xarx/server/
sudo -u xsia cp -a /var/www/ferron/xsia_xarx/src/server/public /var/www/ferron/xsia_xarx/server/

# Check for missing shared libraries (e.g. libtensorflow from the tensorflow crate)
ldd /var/www/ferron/xsia_xarx/server/xsia_xarx | grep 'not found' || echo "all libraries resolved"
```

**SELinux labels.** Files under `/var/www` get the `httpd_sys_content_t` label, which systemd won't execute (the service fails with `status=203/EXEC`). Label the two binaries as executables once; `restorecon` re-applies the rule after every deploy:

```bash
sudo semanage fcontext -a -t bin_t '/var/www/ferron/xsia_xarx/server/(xsia_xarx|migration)(\.prev)?'
sudo restorecon -Rv /var/www/ferron/xsia_xarx/server
ls -Z /var/www/ferron/xsia_xarx/server/xsia_xarx      # should show ...:bin_t:...
```

If `ldd` reports `libtensorflow*.so` as missing, copy it from the build tree and refresh the linker cache:

```bash
sudo find /var/www/ferron/xsia_xarx/src/server/target/release -name 'libtensorflow*.so*' -exec cp -a {} /usr/local/lib64/ \;
echo /usr/local/lib64 | sudo tee /etc/ld.so.conf.d/local-lib64.conf && sudo ldconfig
```

### C. Production `.env`

Create `/var/www/ferron/xsia_xarx/server/.env` (start from `server/.env.production.example`):

```bash
sudo -u xsia tee /var/www/ferron/xsia_xarx/server/.env >/dev/null <<'EOF'
ENV=production
SERVER_DOMAIN="api.example.ac.id"
APP_DIRECTORY="/var/www/ferron/xsia_xarx/server"
APP_FRONTEND_URL="https://app.example.ac.id"

# Database
DATABASE_URL="postgres://xsia:CHANGE_ME@127.0.0.1:5432/xsia_xarx"
DB_CONNECT_TIMEOUT=5000
DB_IDLE_TIMEOUT=5000
DB_MIN_CONNECTIONS=5
DB_MAX_CONNECTIONS=50

# Auth — generate with: openssl rand -base64 64
JWT_SECRET="CHANGE_ME"
JWT_EXPIRATION_HOURS=24

# Institution & academic context
CURRENT_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
CURRENT_STUDENT_ADMISSION_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
CURRENT_INSTITUTION_ID="ed7e8c02-451b-4548-aa81-26b8d0b7fdec"
CURRENT_INSTITUTION_CODE="092010"

# SMTP
SMTP_HOST="mail.example.ac.id"
SMTP_PORT=587
SMTP_USER="no-reply@example.ac.id"
SMTP_PASSWORD="CHANGE_ME"
SMTP_SENDER="Academic Information System"
SYSTEM_MAIL_ADDRESS="no-reply@example.ac.id"
SMTP_SECURE=true

# PDDikti Feeder
FEEDER_USERNAME="CHANGE_ME"
FEEDER_PASSWORD="CHANGE_ME"
FEEDER_URL="http://feeder.example.ac.id/ws/live2.php"

# Payment
IS_PRODUCTION_MIDTRANS_PAYMENT=true

# PDF rendering (path from step 4.A)
CHROME_BIN="/usr/lib64/chromium-browser/headless_shell"
EOF
sudo chmod 600 /var/www/ferron/xsia_xarx/server/.env
```

### D. Run migrations and initial tasks

```bash
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./migration up'              # reads DATABASE_URL from .env
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./migration status'

# Sync permissions / roles from the client route definitions (needs the client source)
asxsia 'cd /var/www/ferron/xsia_xarx/src/server && cp /var/www/ferron/xsia_xarx/server/.env . && cargo run --release -- task generate:permission-from-client --prune'

# List all available tasks (e.g. feeder master-data sync)
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task'
```

---

## 7. Build & configure the frontend

### A. Make the build emit a runnable server (one-time code change)

The client builds with [Vite+](https://github.com/voidzero-dev/vite-plus): every `client/package.json` script calls its `vp` CLI (`bun run build` → `vp build`), and `vite` is aliased to `@voidzero-dev/vite-plus-core`. `package.json` starts production with `bun .output/server/index.mjs`, but the current `vite.config.ts` does not register the Nitro plugin, so `vp build` only produces `dist/` (no standalone server). Add Nitro to the non-test plugin list in `client/vite.config.ts` and commit it:

```ts
import { nitro } from "nitro/vite";
// ...
plugins: lazyPlugins(() =>
  isTest
    ? [solidPlugin()]
    : [institutionAssetsPlugin(), solidStart({ devOverlay: false }), nitro(), tailwindcss()],
),
```

After this, `bun --bun run build` writes `client/.output/` (verify locally: `bun --bun run build && bun run start`). Nitro's default `node-server` output runs as-is on Bun.

### B. Production client `.env`

These values are compiled into the bundle:

```bash
sudo -u xsia tee /var/www/ferron/xsia_xarx/src/client/.env >/dev/null <<'EOF'
CURRENT_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
CURRENT_STUDENT_ADMISSION_ACADEMIC_YEAR_ID="5133cbba-7e54-4795-9bad-0caae06e0284"
CURRENT_INSTITUTION_ID="ed7e8c02-451b-4548-aa81-26b8d0b7fdec"
CURRENT_INSTITUTION_CODE="092010"
VITE_API_SERVER_URL="https://api.example.ac.id/api/v1/"
VITE_SERVER_URL="https://api.example.ac.id/"
VITE_WEB_SOCKET_SERVER_URL="wss://api.example.ac.id/api/v1/realtime/ws"
VITE_APP_NAME="XARX"
VITE_APP_TYPE="xarx"
EOF
```

### C. Build and install

```bash
asxsia 'cd /var/www/ferron/xsia_xarx/src/client && bun install --frozen-lockfile && bun --bun run build'   # → vp build, run by Bun
sudo -u xsia rm -rf /var/www/ferron/xsia_xarx/client/.output
sudo -u xsia cp -a /var/www/ferron/xsia_xarx/src/client/.output /var/www/ferron/xsia_xarx/client/
```

---

## 8. systemd services

### A. API — `/etc/systemd/system/xsia-api.service`

```ini
[Unit]
Description=xsia_xarx Rust API (salvo + PGMQ email worker)
After=network-online.target postgresql-18.service
Wants=network-online.target
Requires=postgresql-18.service

[Service]
Type=simple
User=xsia
Group=xsia
WorkingDirectory=/var/www/ferron/xsia_xarx/server
ExecStart=/var/www/ferron/xsia_xarx/server/xsia_xarx
Environment=RUST_LOG=info
# uv tools (autocrop, docling) from step 4.B
Environment=PATH=/var/lib/xsia/.local/bin:/usr/local/bin:/usr/bin
Restart=always
RestartSec=5
LimitNOFILE=65535

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/var/www/ferron/xsia_xarx/server

[Install]
WantedBy=multi-user.target
```

### B. Frontend SSR — `/etc/systemd/system/xsia-web.service`

```ini
[Unit]
Description=xsia_xarx SolidStart SSR frontend
After=network-online.target xsia-api.service
Wants=network-online.target

[Service]
Type=simple
User=xsia
Group=xsia
WorkingDirectory=/var/www/ferron/xsia_xarx/client
ExecStart=/var/lib/xsia/.bun/bin/bun .output/server/index.mjs
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
Restart=always
RestartSec=5

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

### C. Enable

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now xsia-api xsia-web
systemctl status xsia-api xsia-web --no-pager
journalctl -u xsia-api -f
```

---

## 9. Ferron reverse proxy + HTTPS

[Ferron](https://ferron.sh) handles TLS itself: it gets and renews Let's Encrypt certificates automatically, so you don't need certbot. WebSocket proxying works without extra config, and response buffering is off by default, so SSE streams pass straight through.

### A. Install Ferron 3

```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://rpm.ferron.sh/ferron.repo
sudo dnf -y install ferron3
sudo systemctl enable ferron
```

Ferron reads `/etc/ferron/ferron.conf`, logs to `/var/log/ferron/`, and runs as the `ferron` systemd service.

### B. `/etc/ferron/ferron.conf`

```kdl
// Global configuration
{
    observability {
        provider file
        access_log /var/log/ferron/access.log
        error_log /var/log/ferron/error.log
    }
}

snippet "acme" {
    tls {
        provider acme
        challenge http-01
        contact admin@example.ac.id
        cache /var/cache/ferron-acme
    }
}

// ---------- API (Rust, 127.0.0.1:5800) ----------
// REST, WebSocket (/api/v1/realtime/ws) and SSE (/api/v1/realtime/sse) all go through this one proxy.
api.example.ac.id {
    use "acme"
    dynamic_compressed

    proxy {
        upstream http://127.0.0.1:5800
    }
    request_header Host "{{request.host}}"
}

// ---------- Frontend (SolidStart SSR, 127.0.0.1:3000) ----------
app.example.ac.id {
    use "acme"
    dynamic_compressed

    proxy {
        upstream http://127.0.0.1:3000
    }
    request_header Host "{{request.host}}"

    // Hashed build assets can be cached forever
    location /_build/assets {
        proxy {
            upstream http://127.0.0.1:3000
        }
        header Cache-Control "public, max-age=31536000, immutable"
    }
}
```

Don't add `Access-Control-*` headers in Ferron. The API already sends permissive CORS headers, and sending them twice makes browsers reject the response.

```bash
sudo mkdir -p /var/cache/ferron-acme
sudo chown ferron:ferron /var/cache/ferron-acme 2>/dev/null || true   # service user from the package

sudo ferron validate -c /etc/ferron/ferron.conf
sudo systemctl restart ferron            # later edits: sudo systemctl reload ferron
journalctl -u ferron -f                  # watch the certificates being issued
```

DNS A/AAAA records for both domains must point at this server, and port 80 must be reachable, before Ferron can pass the HTTP-01 challenge.

> 🔒 **Swagger UI** is public at `https://api.example.ac.id/api/v1/swagger-ui/`. To restrict it to your internal network, add this inside the `api.example.ac.id` block:
> ```kdl
> location /api/v1/swagger-ui {
>     allow "10.0.0.0/8" "192.168.0.0/16"
>     proxy {
>         upstream http://127.0.0.1:5800
>     }
> }
> location /api/v1/api-docs {
>     allow "10.0.0.0/8" "192.168.0.0/16"
>     proxy {
>         upstream http://127.0.0.1:5800
>     }
> }
> ```

> ⏱️ If long requests (PDF generation, feeder syncs) get cut off, raise the pipeline `timeout` (see Ferron's *Core directives* docs).

### C. Still on Ferron 2?

The existing `server/server_config/ferron.kdl` uses **Ferron 2** syntax. If your server runs Ferron 2 (`ferron.kdl`), the equivalent hosts are below. Note that the old file proxies to port `5150`; the API now listens on **`5800`**.

```kdl
globals {
    log "/var/log/ferron/access.log"
    error_log "/var/log/ferron/error.log"
}

* {
    auto_tls
    auto_tls_contact "admin@example.ac.id"
}

api.example.ac.id {
    proxy "http://127.0.0.1:5800"
}

app.example.ac.id {
    proxy "http://127.0.0.1:3000"
}
```

To upgrade, follow Ferron's [migration guide from v2](https://ferron.sh/docs/migration/from-v2).

---

## 10. Firewall & SELinux

```bash
# Only SSH + HTTP(S) exposed; 3000/5800/5432 stay on localhost
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload

# Check Ferron's SELinux context
ps -eZ | grep ferron
```

If Ferron shows up as `httpd_t` (confined like a web server), let it connect to the upstream ports and to database ports such as PostgreSQL's 5432:

```bash
sudo setsebool -P httpd_can_network_connect 1      # upstream app ports (3000, 5800)
sudo setsebool -P httpd_can_network_connect_db 1   # database ports (PostgreSQL 5432)

getsebool httpd_can_network_connect httpd_can_network_connect_db   # both should be "on"
```

Keep SELinux in `enforcing` mode. If something is blocked, inspect with `sudo ausearch -m avc -ts recent`.

---

## 11. Verify

```bash
curl -I  http://127.0.0.1:5800/api/v1/swagger-ui/        # API locally
curl -I  http://127.0.0.1:3000/                          # SSR locally
curl -I  https://api.example.ac.id/api/v1/swagger-ui/    # through Ferron + TLS
curl -I  https://app.example.ac.id/

journalctl -u xsia-api --since "10 min ago" | grep -E "Database connection successful|PGMQ email worker started"

# Apache AGE: the graph exists and cypher() works for the app role
psql "postgres://xsia:CHANGE_ME@127.0.0.1:5432/xsia_xarx" -c "SET search_path = ag_catalog, public; SELECT * FROM cypher('ai_graph', \$\$ MATCH (n) RETURN count(n) \$\$) AS (c agtype);"
```

Then in a browser: log in, open a dashboard, generate a PDF (KRS/KHS) to confirm Chromium works, and visit `/example/websocket` to confirm WebSocket/SSE pass through the proxy.

---

## 12. Inbound webhooks (Mail-in-a-Box & OpenWA)

The API accepts two webhooks. Their tables (`webhook.mail_in_a_box_events`, `webhook.open_wa_events`) are created by `./migration up` in [6.D](#d-run-migrations-and-initial-tasks). Payload formats and response codes are documented in the README's *Inbound Webhooks* section.

| Source | Endpoint | Secret (`server/.env`) | Auth header |
| :--- | :--- | :--- | :--- |
| Mail-in-a-Box | `https://api.example.ac.id/api/v1/webhook/mail-in-a-box` | `MIAB_WEBHOOK_SECRET` | `X-Webhook-Signature: sha256=<HMAC>` |
| [OpenWA](https://github.com/rmyndharis/OpenWA) | `https://api.example.ac.id/api/v1/webhook/openwa` | `OPENWA_WEBHOOK_SECRET` (≥ 16 chars) | `X-OpenWA-Signature: sha256=<HMAC>` (sent by OpenWA) |

Both endpoints answer `503` until their secret is set, and `401` for a missing or wrong signature. No Ferron change is needed: they're under `/api/v1`, which is already proxied.

### A. Set the secrets

```bash
MIAB_SECRET="$(openssl rand -hex 32)";   echo "MIAB_WEBHOOK_SECRET=$MIAB_SECRET"     # store both safely
OPENWA_SECRET="$(openssl rand -hex 32)"; echo "OPENWA_WEBHOOK_SECRET=$OPENWA_SECRET"

sudo -u xsia tee -a /var/www/ferron/xsia_xarx/server/.env >/dev/null <<EOF

# Inbound webhooks
MIAB_WEBHOOK_SECRET="$MIAB_SECRET"
OPENWA_WEBHOOK_SECRET="$OPENWA_SECRET"

# OpenWA gateway (outgoing WhatsApp messages + webhook registration)
OPENWA_URL="https://wa.example.ac.id"
OPENWA_API_KEY_SESSION_ID="CHANGE_ME"
OPENWA_API_KEY_OPERATOR="CHANGE_ME"
EOF
sudo systemctl restart xsia-api

# Both should now return 401 (unsigned request), not 503
for hook in mail-in-a-box openwa; do
  curl -s -o /dev/null -w "$hook: %{http_code}\n" -X POST "https://api.example.ac.id/api/v1/webhook/$hook" \
    -H 'Content-Type: application/json' -d '{}'
done
```

### B. Mail-in-a-Box → xsia

Mail-in-a-Box has no built-in webhook sender, so install a small signing script **on the Mail-in-a-Box server** and call it from cron or a hook:

```bash
# On the Mail-in-a-Box server, as root
install -m 600 /dev/null /etc/xsia-webhook.env
cat > /etc/xsia-webhook.env <<'EOF'
XSIA_WEBHOOK_URL="https://api.example.ac.id/api/v1/webhook/mail-in-a-box"
XSIA_WEBHOOK_SECRET="<same value as MIAB_WEBHOOK_SECRET>"
EOF

cat > /usr/local/bin/xsia-webhook <<'EOF'
#!/usr/bin/env bash
# Usage: xsia-webhook <event> [data-json]
#   e.g. xsia-webhook status_check.failed '{"check":"dns"}'
set -euo pipefail
. /etc/xsia-webhook.env
EVENT="$1"; DATA="${2:-{\}}"
BODY=$(printf '{"event":"%s","id":"%s-%s-%s","occurred_at":"%s","hostname":"%s","data":%s}' \
  "$EVENT" "$(hostname -s)" "$(date +%s%N)" "$RANDOM" "$(date -u +%FT%TZ)" "$(hostname -f)" "$DATA")
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$XSIA_WEBHOOK_SECRET" -r | cut -d' ' -f1)
curl -fsS --retry 3 -X POST "$XSIA_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  --data-raw "$BODY"
EOF
chmod 755 /usr/local/bin/xsia-webhook

xsia-webhook test.ping '{"note":"deployment test"}'     # → {"id":"…","duplicate":false}
```

Example cron job (`crontab -e` on the box) that reports a stopped mail service every 5 minutes:

```cron
*/5 * * * * for s in postfix dovecot; do systemctl is-active --quiet $s || /usr/local/bin/xsia-webhook status_check.failed "{\"service\":\"$s\"}"; done
```

> 🔒 Optional: accept this endpoint only from the mail server. Inside the `api.example.ac.id` block in `/etc/ferron/ferron.conf`:
> ```kdl
> location /api/v1/webhook/mail-in-a-box {
>     allow "203.0.113.25"            // Mail-in-a-Box public IP
>     proxy {
>         upstream http://127.0.0.1:5800
>     }
> }
> ```

### C. OpenWA → xsia

Register the webhook with the **same secret** as `OPENWA_WEBHOOK_SECRET`. Either use the OpenWA dashboard (session → Webhooks → add URL, events, secret), or its API:

```bash
set -a; . /var/www/ferron/xsia_xarx/server/.env; set +a      # loads OPENWA_* (run as root)

curl -fsS -X POST "$OPENWA_URL/api/sessions/$OPENWA_API_KEY_SESSION_ID/webhooks" \
  -H "X-API-Key: $OPENWA_API_KEY_OPERATOR" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://api.example.ac.id/api/v1/webhook/openwa","events":["message.received","message.ack","session.status"],"secret":"'"$OPENWA_WEBHOOK_SECRET"'"}'
```

Then use OpenWA's **test webhook** action. It sends a signed `test` event that should be stored like any other. OpenWA retries non-2xx responses (3 attempts by default). A webhook registered without a secret is unsigned and always rejected with `401`.

> ℹ️ If OpenWA runs on this same server, still use the public `https://api.example.ac.id/...` URL (or `http://127.0.0.1:5800/api/v1/webhook/openwa`). Don't point it at the frontend host.

### D. Verify

```bash
sudo -u postgres psql -d xsia_xarx -c "SELECT event_type, hostname, occurred_at, created_at FROM webhook.mail_in_a_box_events ORDER BY created_at DESC LIMIT 5;"
sudo -u postgres psql -d xsia_xarx -c "SELECT event_type, session_id, occurred_at, created_at FROM webhook.open_wa_events ORDER BY created_at DESC LIMIT 5;"
journalctl -u xsia-api --since "10 min ago" | grep -i webhook
```

---

## 13. Updating / redeploying

> ⚠️ **Upgrading a server set up before Apache AGE was added?** Do [2.B](#b-build-pg_uuidv7-pgmq-and-apache-age-from-source) (AGE part) and the AGE lines of [2.C](#c-create-the-database-role-and-enable-extensions) once **before** running the deploy script, or `./migration up` fails on the `ai` migrations. Restart `xsia-api` after setting `session_preload_libraries`.

Save as `/var/www/ferron/xsia_xarx/deploy.sh` (`chmod +x`), run with `sudo /var/www/ferron/xsia_xarx/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
asxsia() { sudo -u xsia -H bash -lc "export PATH=\$HOME/.cargo/bin:\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH; $*"; }

SRC=/var/www/ferron/xsia_xarx/src
RUN=/var/www/ferron/xsia_xarx

asxsia "cd $SRC && git fetch --all && git reset --hard origin/main"

# Backend
asxsia "cd $SRC/server && cargo build --release --locked"
asxsia "cd $SRC/server/migration && cargo build --release --locked"

# Frontend
asxsia "cd $SRC/client && bun install --frozen-lockfile && bun --bun run build"

# Python tools (optional — upgrade autocrop / docling)
# asxsia "uv tool upgrade --all"

# Backup DB before migrating
mkdir -p /var/lib/pgsql/backups
sudo -u postgres pg_dump -Fc xsia_xarx > "/var/lib/pgsql/backups/xsia_xarx_$(date +%F_%H%M).dump"

# Install artifacts (keep the old binary for rollback)
cp -a $RUN/server/xsia_xarx $RUN/server/xsia_xarx.prev
install -o xsia -g xsia -m 0755 $SRC/server/target/release/xsia_xarx          $RUN/server/
install -o xsia -g xsia -m 0755 $SRC/server/migration/target/release/migration $RUN/server/
restorecon -R $RUN/server                       # re-apply the bin_t label (SELinux)
# Sync static assets but NEVER delete runtime uploads
rsync -a --exclude 'upload/' $SRC/server/public/ $RUN/server/public/
chown -R xsia:xsia $RUN/server/public

asxsia "cd $RUN/server && ./migration up"

rm -rf $RUN/client/.output.new && cp -a $SRC/client/.output $RUN/client/.output.new
rm -rf $RUN/client/.output && mv $RUN/client/.output.new $RUN/client/.output
chown -R xsia:xsia $RUN/client

systemctl restart xsia-api xsia-web
sleep 3
systemctl is-active xsia-api xsia-web
```

**Rollback the API:** `sudo cp -a /var/www/ferron/xsia_xarx/server/xsia_xarx.prev /var/www/ferron/xsia_xarx/server/xsia_xarx && sudo systemctl restart xsia-api` (restore the pre-deploy dump if a migration must be undone).

---

## 14. Backups

```bash
sudo -u postgres mkdir -p /var/lib/pgsql/backups
sudo crontab -e
```

```cron
# Nightly DB dump at 02:00, keep 14 days
0 2 * * * sudo -u postgres pg_dump -Fc xsia_xarx > /var/lib/pgsql/backups/xsia_xarx_$(date +\%F).dump && find /var/lib/pgsql/backups -name '*.dump' -mtime +14 -delete
# Nightly uploads archive
30 2 * * * tar -czf /var/lib/pgsql/backups/uploads_$(date +\%F).tar.gz -C /var/www/ferron/xsia_xarx/server public/upload && find /var/lib/pgsql/backups -name 'uploads_*' -mtime +14 -delete
```

Copy backups off the server (rsync / object storage) — a backup on the same disk is not a backup.

---

## 15. Troubleshooting

| Symptom | Likely cause / fix |
| :--- | :--- |
| `502 Bad Gateway` from Ferron | Service down (`systemctl status xsia-api xsia-web`), the upstream port is wrong (old configs use `5150`; the API is on `5800`), or SELinux (see [step 10](#10-firewall--selinux)). |
| No HTTPS certificate issued | DNS doesn't point at the server yet, port 80 is blocked, or `/var/cache/ferron-acme` isn't writable. Check `journalctl -u ferron`. |
| API exits with `Failed to connect to PGMQ` | Wrong `DATABASE_URL`, `pg_hba.conf` still on `ident`, or role lacks rights on schema `pgmq`. |
| `extension "pg_uuidv7" is not available` (or `"age"`) | Built against the wrong PostgreSQL — rebuild with `PATH=/usr/pgsql-18/bin:$PATH` (for AGE, use the `release/PG18/…` branch). |
| Migration fails: `permission denied for schema ag_catalog` / `for table ag_graph` | AGE grants missing — run the AGE lines of [2.C](#c-create-the-database-role-and-enable-extensions) as `postgres`. |
| `access to library "age" is not allowed` | Something ran `LOAD 'age'` as `xsia` (non-superusers can't). Rely on `session_preload_libraries` from [2.C](#c-create-the-database-role-and-enable-extensions) instead. |
| `unhandled cypher(cstring) function call` | AGE isn't loaded in that connection — check `SHOW session_preload_libraries;` returns `age`, then restart `xsia-api` so the pool reconnects. |
| `operator class "graphid_ops" does not exist` | `ag_catalog.create_graph()` called without `ag_catalog` on the `search_path`. |
| `autocrop` / `docling: command not found` from the API | Not installed as `xsia`, or the unit lacks `Environment=PATH=/var/lib/xsia/.local/bin:…` (see [4.B](#b-autocrop--docling-via-uv)). Run `systemctl daemon-reload && systemctl restart xsia-api` after editing. |
| Webhook returns `503` | `MIAB_WEBHOOK_SECRET` / `OPENWA_WEBHOOK_SECRET` empty in `server/.env`, or `xsia-api` not restarted after setting it ([12.A](#a-set-the-secrets)). |
| Webhook returns `401` | Secret differs between sender and `server/.env`, the body was changed after signing (sign the exact bytes sent), or the OpenWA webhook was registered without a secret. |
| `vp: command not found` during the client build | Dependencies not installed — run `bun install --frozen-lockfile` in `src/client` (Vite+ is a local dev dependency). |
| Logos / signatures missing in PDFs, `No such file` | `WorkingDirectory` / `APP_DIRECTORY` not `/var/www/ferron/xsia_xarx/server`, or `public/` not copied. |
| PDF endpoint hangs or errors | `CHROME_BIN` wrong or Chromium missing; test with `$CHROME_BIN --headless --dump-dom https://example.com`. |
| Frontend calls `127.0.0.1:5800` from the browser | `client/.env` missing at build time — `VITE_API_SERVER_URL` is baked in; fix and rebuild. |
| WebSocket closes immediately | `ws://` used on an HTTPS page (use `wss://` in `VITE_WEB_SOCKET_SERVER_URL` and rebuild the client). |
| `xsia-api` fails with `status=203/EXEC` | SELinux label on the binary is `httpd_sys_content_t`. Run the `semanage fcontext` + `restorecon` step in [6.B](#b-install-the-runtime-files). |
| `error while loading shared libraries: libtensorflow…` | See the `ldd` step in [6.B](#b-install-the-runtime-files). |
| CORS errors | The API allows any origin; check that Ferron isn't adding duplicate `Access-Control-*` headers (e.g. via the old `cors_headers` snippet). |

Logs: `journalctl -u xsia-api -f`, `journalctl -u xsia-web -f`, `/var/log/ferron/error.log`, `journalctl -u ferron`, `/var/lib/pgsql/18/data/log/`.
