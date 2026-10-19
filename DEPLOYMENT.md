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
> - The [PGMQ](https://github.com/pgmq/pgmq) email worker runs inside the API process — no separate worker service is needed. Redis is **not** required.
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
14. [Alternative: build on a workstation, ship to the server](#14-alternative-build-on-a-workstation-ship-to-the-server)
15. [Backups](#15-backups)
16. [Troubleshooting](#16-troubleshooting)

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

> ⚠️ **`/var/www/ferron` is Ferron's default web root.** The app directory holds `.env` (database password, JWT secret) and the full source, so **no Ferron host may use `root "/var/www/ferron"`** or any folder above `xsia_xarx`. Otherwise those files could be downloaded over HTTP. Remove or change the catch-all `:80 { root "/var/www/ferron" }` block that ships with Ferron (it's also in `server/server_config/ferron.conf`). The `chmod 750` above is a second safeguard: the `ferron` user can't read the folder even if a host is misconfigured.

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
LOAD 'age';
-- Set the search path so AGE's functions can be resolved
SET search_path = ag_catalog, "$user", public;
-- Now create the extension
CREATE EXTENSION IF NOT EXISTS age;
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

Install as the `xsia` user so builds don't run as root. (Alternatively, compile on your workstation and copy only the artifacts; see [section 14](#14-alternative-build-on-a-workstation-ship-to-the-server). The server then needs Bun as the SSR runtime but no Rust toolchain.)

```bash
# Rust (stable; the crate needs >= 1.97.1)
sudo -u xsia -H bash -c 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal'

# Bun — package manager, build runner, AND the runtime for the SolidStart SSR server (packageManager = bun@1.4.3)
# Vite+ (`vp`) needs no global install — it's a client dev dependency installed by `bun install`
sudo -u xsia -H bash -c 'curl -fsSL https://bun.sh/install | bash'

# SELinux: files under /var/lib get var_lib_t, which systemd won't execute (xsia-web fails with status=203/EXEC)
sudo semanage fcontext -a -t bin_t '/var/lib/xsia/\.bun/bin(/.*)?'
sudo restorecon -Rv /var/lib/xsia/.bun/bin
```

> ℹ️ Node.js is **not** needed. [Bun](https://github.com/oven-sh/bun) runs the client build (`bun --bun run build` forces Bun to run `vp`, whose shebang asks for `node`), the SSR server (`bun .output/server/index.mjs`), and `client/scripts/extract-api-usage.mjs` for the `utility:generate-permission-from-client` task.

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
# Embedding model for AI chunks (gitignored, so not in the checkout); ≈ 460 MB
asxsia 'cd /var/www/ferron/xsia_xarx/server && uvx --from huggingface_hub hf download sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 config.json tokenizer.json model.safetensors --local-dir models/paraphrase-multilingual-MiniLM-L12-v2'

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

Create `/var/www/ferron/xsia_xarx/server/.env`. Either generate it, which fills in every key the server reads with random `JWT_SECRET`, `APP_ENCRYPTION_KEY` and webhook secrets, then replace the `CHANGE_ME` values:

```bash
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task utility:generate-env'   # no database needed
sudo -u xsia ${EDITOR:-vi} /var/www/ferron/xsia_xarx/server/.env
```

Or write it by hand (start from `server/.env.production.example`):

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
# The academic year is resolved from the current date (academic_years.start_date)
# The institution comes from the stored Feeder credential (task utility:feeder-add-credential)

# SMTP and Feeder: fallbacks only. Prefer storing them in the database (6.D);
# a stored mail server / Feeder credential wins over these values.
# SMTP
SMTP_HOST="mail.example.ac.id"
SMTP_PORT=587
SMTP_USER="no-reply@example.ac.id"
SMTP_PASSWORD="CHANGE_ME"

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

> ⚠️ **`.env` must be owned by `xsia`.** Mode `600` means only the owner can read it. If it's created or saved as root (e.g. `sudo nano .env`, `sudo cp`, a FileZilla/scp upload moved in with `sudo`), the API can't read it, **silently ignores it**, and falls back to built-in defaults. The usual symptom: `password authentication failed for user "bendo01"` although `DATABASE_URL` is correct. Check and fix:
>
> ```bash
> sudo ls -la /var/www/ferron/xsia_xarx/server/.env    # must show: -rw------- ... xsia xsia
> sudo chown xsia:xsia /var/www/ferron/xsia_xarx/server/.env && sudo chmod 600 /var/www/ferron/xsia_xarx/server/.env
> ```
>
> Always edit it with `sudo -u xsia ${EDITOR:-vi} …`, and run `./xsia_xarx` / `./migration` by hand as `xsia` (`asxsia '…'` or `sudo -u xsia ./xsia_xarx …`). Run as your own login user, the binary can't read the file either and hits the same fallback.

### D. Run migrations and initial tasks

```bash
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./migration up'              # reads DATABASE_URL from .env
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./migration status'

# Sync permissions / roles from the client route definitions (needs the client source)
asxsia 'cd /var/www/ferron/xsia_xarx/src/server && cp /var/www/ferron/xsia_xarx/server/.env . && cargo run --release -- task utility:generate-permission-from-client --prune'

# List all available tasks (e.g. feeder master-data sync)
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task'
```

Then store the integration settings in the database. Each task prompts for its values (passwords and keys are hidden and stored encrypted with `APP_ENCRYPTION_KEY`), so run them in an interactive terminal:

```bash
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task utility:feeder-add-credential'       # Feeder login + current institution
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task utility:preference-add-mail-server'  # SMTP
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task utility:preference-add-openwa'       # OpenWA + both webhook secrets
```

| Task | Why it matters |
| :--- | :--- |
| `utility:feeder-add-credential` | **Required for Feeder.** The institution you enter becomes the server's *current institution*; there is no `.env` key for it any more. Store a credential for **one** institution only: with none, or with credentials for several, Feeder tasks stop with an error. |
| `utility:preference-add-mail-server` | Without it, email uses the `SMTP_*` keys from `.env`. |
| `utility:preference-add-openwa` | Without it, WhatsApp messages and the webhooks use the `OPENWA_*` / `*_WEBHOOK_SECRET` keys from `.env`. |

Stored settings win over `.env` and are read when needed, so changing them later doesn't need a restart. Check which institution is current:

```bash
sudo -u postgres psql -d xsia_xarx -c "SELECT i.code, i.name FROM feeder_akun.kredential k JOIN institution_master.institutions i ON i.id = k.institution_id WHERE k.deleted_at IS NULL;"   # expect exactly one row
```

#### Running tasks when you're logged in as another user

The files in `server/` (notably `.env`) belong to `xsia`, so run `./xsia_xarx task …` and `./migration …` **as `xsia`**, not as your login user (e.g. `bendo01`). Otherwise `.env` can't be read and the binary falls back to the built-in default database credentials.

```bash
# One-off command, using the asxsia helper from step 3
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task <task-name>'

# Same thing without the helper
sudo -u xsia -H bash -c 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task <task-name>'

# Interactive shell as xsia (for prompting tasks such as utility:feeder-add-credential)
sudo -iu xsia
cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task
```

- `-H` / `-i` set `HOME` to `/var/lib/xsia`, so `~/.cargo`, `~/.bun` and `~/.local/bin` (`autocrop`, `docling`) are found.
- `cd` is a shell builtin, so wrap it in `bash -c '…'` as above.
- If `bendo01` can't use `sudo -u xsia`, add `bendo01 ALL=(xsia) NOPASSWD: ALL` with `sudo visudo -f /etc/sudoers.d/bendo01` (or restrict it to specific commands).
- For tasks that must run on a schedule, use a systemd timer with `User=xsia` or `sudo crontab -u xsia -e` rather than your own crontab.

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

Ferron 3's `.conf` syntax uses `#` comments (`//` is a parse error) and `proxy "<url>"` for upstreams. Named hosts (anything but `*:80`) get a Let's Encrypt certificate automatically, so no `tls`/ACME block is needed. The listing below is also in `server/server_config/ferron.conf`.

```conf
# Global configuration
{
    log /var/log/ferron/access.log {
        access_log_rotate_size 10485760
        access_log_rotate_keep 7
    }
    error_log /var/log/ferron/error.log {
        error_log_rotate_size 10485760
        error_log_rotate_keep 7
    }
}

# ---------- API (Rust, 127.0.0.1:5800) ----------
# REST, WebSocket (/api/v1/realtime/ws) and SSE (/api/v1/realtime/sse) all go through this one proxy.
api.example.ac.id {
    proxy "http://127.0.0.1:5800"
}

# ---------- Frontend (SolidStart SSR, 127.0.0.1:3000) ----------
app.example.ac.id {
    proxy "http://127.0.0.1:3000"
    compressed
}
```

Use `127.0.0.1`, not `localhost`: both services bind IPv4 loopback only, and `localhost` can resolve to `::1` first, which gives a `502`.

Don't add `Access-Control-*` headers (e.g. a `cors_headers` snippet) to the API or SSR hosts. The API already sends permissive CORS headers, and sending them twice makes browsers reject the response. They are only appropriate for hosts serving static files.

```bash
sudo ferron validate -c /etc/ferron/ferron.conf
sudo systemctl restart ferron            # later edits: sudo systemctl reload ferron
journalctl -u ferron -f                  # watch the certificates being issued
tail -f /var/log/ferron/error.log        # ACME progress / errors
```

DNS A/AAAA records for both domains must point at this server, and ports 80 and 443 must be reachable from the internet, before Ferron can pass the HTTP-01 challenge. Right after a (re)start, HTTPS can fail for a few minutes with `ERR_SSL_PROTOCOL_ERROR` until the certificates are issued. Don't keep restarting Ferron while issuing fails: every attempt counts as a failed authorization and Let's Encrypt rate-limits the domain (5 failures per hour).

> ⚠️ The directives in the old KDL examples (`observability { provider file }`, `tls { provider acme }`, `proxy { upstream ... }`, `request_header Host "{{request.host}}"`, nested `location`) are **not** valid in the `.conf` syntax above. If you need extras such as caching headers for `/_build/assets`, restricting Swagger UI by IP, or a custom `Host` header, look up the exact directive in the Ferron docs (https://ferron.sh/docs/configuration/fundamentals/syntax) and confirm with `ferron validate` before reloading.

### C. Still on Ferron 2?

Older servers used `ferron.kdl` (Ferron 2 syntax) and proxied to port `5150`. The API now listens on **`5800`**, so update the upstream when you migrate. Follow Ferron's [migration guide from v2](https://ferron.sh/docs/migration/from-v2); the Ferron 3 equivalent of the hosts is the `.conf` in step B.

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

| Source | Endpoint | Secret (database, or `server/.env` fallback) | Auth header |
| :--- | :--- | :--- | :--- |
| Mail-in-a-Box | `https://api.example.ac.id/api/v1/webhook/mail-in-a-box` | `MIAB_WEBHOOK_SECRET` | `X-Webhook-Signature: sha256=<HMAC>` |
| [OpenWA](https://github.com/rmyndharis/OpenWA) | `https://api.example.ac.id/api/v1/webhook/openwa` | `OPENWA_WEBHOOK_SECRET` (≥ 16 chars) | `X-OpenWA-Signature: sha256=<HMAC>` (sent by OpenWA) |

Each request reads the secrets from the active OpenWA settings in the database (`preference.what_apps`, stored by `utility:preference-add-openwa`) and falls back to `server/.env` only when no active row exists. Both endpoints answer `503` until a secret is set, and `401` for a missing or wrong signature. No Ferron change is needed: they're under `/api/v1`, which is already proxied.

### A. Set the secrets

**Recommended: store them in the database.** `utility:preference-add-openwa` ([6.D](#d-run-migrations-and-initial-tasks)) asks for both secrets. To replace them later, run `utility:preference-generate-webhook-secret`: it updates the stored secrets directly and they take effect immediately, with no restart. Then update the senders ([12.B](#b-mail-in-a-box--xsia), [12.C](#c-openwa--xsia)).

**Fallback: `server/.env`**, used only while no active OpenWA settings are stored. Generate them with the `utility:preference-generate-webhook-secret` task. It prints both as `.env` lines and, if OpenWA settings were already added with `utility:preference-add-openwa`, also stores them encrypted in the database. Pass `miab` or `openwa` to generate only one:

```bash
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task utility:preference-generate-webhook-secret'
# MIAB_WEBHOOK_SECRET="…"
# OPENWA_WEBHOOK_SECRET="…"
```

Or with `openssl` (same format: 32 random bytes as hex):

```bash
openssl rand -hex 32     # MIAB_WEBHOOK_SECRET
openssl rand -hex 32     # OPENWA_WEBHOOK_SECRET
```

To use the `.env` fallback, set them with the `set_env` helper below, which replaces a key that's already in `.env` and appends it otherwise. Don't just append (`tee -a`, `>>`) a second time: `.env` is loaded with the first occurrence of a key winning, so a duplicate line added later is silently ignored.

```bash
ENV_FILE=/var/www/ferron/xsia_xarx/server/.env
set_env() {   # usage: set_env KEY VALUE
  sudo -u xsia sed -i "/^$1=/d" "$ENV_FILE"
  printf '%s="%s"\n' "$1" "$2" | sudo -u xsia tee -a "$ENV_FILE" >/dev/null
}

# Paste the values from the task (or openssl) above
set_env MIAB_WEBHOOK_SECRET   "PASTE_MIAB_SECRET"
set_env OPENWA_WEBHOOK_SECRET "PASTE_OPENWA_SECRET"     # at least 16 characters

# Or generate and set in one go (prints nothing; read them back below)
# set_env MIAB_WEBHOOK_SECRET   "$(openssl rand -hex 32)"
# set_env OPENWA_WEBHOOK_SECRET "$(openssl rand -hex 32)"

# OpenWA gateway (outgoing WhatsApp messages + webhook registration)
set_env OPENWA_URL                "https://wa.example.ac.id"
set_env OPENWA_API_KEY_SESSION_ID "CHANGE_ME"
set_env OPENWA_API_KEY_OPERATOR   "CHANGE_ME"

# Check: each key exactly once, file still private
sudo grep -nE '^(MIAB_WEBHOOK_SECRET|OPENWA_WEBHOOK_SECRET|OPENWA_URL|OPENWA_API_KEY_SESSION_ID|OPENWA_API_KEY_OPERATOR)=' "$ENV_FILE"
sudo stat -c '%a %U' "$ENV_FILE"     # expect: 600 xsia

sudo systemctl restart xsia-api

# Both should now return 401 (unsigned request), not 503
for hook in mail-in-a-box openwa; do
  curl -s -o /dev/null -w "$hook: %{http_code}\n" -X POST "https://api.example.ac.id/api/v1/webhook/$hook" \
    -H 'Content-Type: application/json' -d '{}'
done
```

### B. Mail-in-a-Box → xsia

Mail-in-a-Box has no built-in webhook sender, so you install a small signing script **on the Mail-in-a-Box server** and call it from cron or a hook.

**Before you start:** [12.A](#a-set-the-secrets) is done (the endpoint answers `401`, not `503`), and you have the value of `MIAB_WEBHOOK_SECRET`.

**Step 1 — Check the box can reach the API.** On the Mail-in-a-Box server:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.example.ac.id/api/v1/webhook/mail-in-a-box \
  -H 'Content-Type: application/json' -d '{}'     # expect 401
```

**Step 2 — Store the URL and secret** (readable by root only):

```bash
# On the Mail-in-a-Box server, as root
install -m 600 /dev/null /etc/xsia-webhook.env
cat > /etc/xsia-webhook.env <<'EOF'
XSIA_WEBHOOK_URL="https://api.example.ac.id/api/v1/webhook/mail-in-a-box"
XSIA_WEBHOOK_SECRET="<same value as MIAB_WEBHOOK_SECRET>"
EOF
```

**Step 3 — Install the sender script.** It builds the JSON body, signs it with HMAC-SHA256 and posts it with `X-Webhook-Signature`:

```bash
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
```

**Step 4 — Send a test event:**

```bash
xsia-webhook test.ping '{"note":"deployment test"}'     # → {"id":"…","duplicate":false}
```

A `401` means the secret in `/etc/xsia-webhook.env` differs from `MIAB_WEBHOOK_SECRET`. The event should now be in `webhook.mail_in_a_box_events` ([12.D](#d-verify)).

**Step 5 — Hook it to real events.** Call `xsia-webhook <event> '<json>'` wherever the box should report something. Use dotted lowercase event names (`mail.bounced`, `mailbox.created`, `status_check.failed`, …; see the README's *Inbound Webhooks*). Example cron job (`crontab -e` as root) that reports a stopped mail service every 5 minutes:

```cron
*/5 * * * * for s in postfix dovecot; do systemctl is-active --quiet $s || /usr/local/bin/xsia-webhook status_check.failed "{\"service\":\"$s\"}"; done
```

**Step 6 (optional) — Accept this endpoint only from the mail server.** Inside the `api.example.ac.id` block in `/etc/ferron/ferron.conf`, then reload Ferron:

```conf
# Syntax not verified against Ferron 3's .conf format: look up the IP-allow and
# location directives in the Ferron docs and check with `ferron validate`.
# Intent: allow only the Mail-in-a-Box public IP (e.g. 203.0.113.25) on
# /api/v1/webhook/mail-in-a-box, proxying to http://127.0.0.1:5800
```

**Rotating the secret:** generate a new one and set it with `set_env MIAB_WEBHOOK_SECRET "…"` ([12.A](#a-set-the-secrets)), restart `xsia-api`, then update `XSIA_WEBHOOK_SECRET` in `/etc/xsia-webhook.env` and rerun step 4. Events sent between the two changes get `401`.

### C. OpenWA → xsia

OpenWA sends webhooks itself; you only register the xsia URL on the OpenWA session, with the **same secret** as `OPENWA_WEBHOOK_SECRET`.

**Before you start:**
- [12.A](#a-set-the-secrets) is done (the endpoint answers `401`, not `503`).
- The OpenWA session exists and is connected (QR scanned). Its ID is `OPENWA_API_KEY_SESSION_ID`.
- You have an OpenWA API key with the **operator** role or higher (`OPENWA_API_KEY_OPERATOR`). If OpenWA runs in Docker, read the generated key from the container (run on the OpenWA host):

  ```bash
  docker exec openwa-api cat /app/data/.api-key
  ```
- `OPENWA_WEBHOOK_SECRET` is at least 16 characters. OpenWA rejects shorter secrets, and a webhook without a secret is unsigned, so xsia always answers `401`.
- The OpenWA host can reach `https://api.example.ac.id`. OpenWA checks webhook URLs against SSRF rules when you register them, so use the public HTTPS URL rather than a private or loopback address.

Load the variables used below (as root on the xsia server):

```bash
set -a; . /var/www/ferron/xsia_xarx/server/.env; set +a      # OPENWA_URL, OPENWA_API_KEY_*, OPENWA_WEBHOOK_SECRET
```

**Step 1 — Register the webhook.** Either:

- **Dashboard:** open `OPENWA_URL` (default port `2785`) → **Webhooks** → choose the session → **New Webhook**. Set the URL to `https://api.example.ac.id/api/v1/webhook/openwa` and pick the events. (Menu and button labels may differ slightly between OpenWA versions.)

  > **Note:** the **Create Webhook** dialog has no **Secret** field, so a webhook created here is unsigned and xsia answers `401` to every delivery. Use the **API** option below, which accepts `secret`. If you already created one in the dashboard, delete it first so xsia doesn't receive duplicates.
- **API (required for the secret):**

  ```bash
  curl -fsS -X POST "$OPENWA_URL/api/sessions/$OPENWA_API_KEY_SESSION_ID/webhooks" \
    -H "X-API-Key: $OPENWA_API_KEY_OPERATOR" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://api.example.ac.id/api/v1/webhook/openwa","events":["message.received","message.ack","session.status"],"secret":"'"$OPENWA_WEBHOOK_SECRET"'"}'
  ```

  Note the `id` in the response; it's the webhook ID used below.

Common events: `message.received`, `message.sent`, `message.ack`, `message.failed`, `session.status`, `session.disconnected`. Use `["*"]` for all of them. Without `events`, OpenWA subscribes to `message.received` only.

**Step 2 — Send a test delivery.** Use the webhook's **Test** button in the dashboard, or:

```bash
WEBHOOK_ID="<id from step 1>"
curl -fsS -X POST "$OPENWA_URL/api/sessions/$OPENWA_API_KEY_SESSION_ID/webhooks/$WEBHOOK_ID/test" \
  -H "X-API-Key: $OPENWA_API_KEY_OPERATOR"
```

OpenWA sends a signed `test` event, which xsia stores like any other ([12.D](#d-verify)). A `401` in `journalctl -u xsia-api` means the secret registered in OpenWA differs from `OPENWA_WEBHOOK_SECRET`.

**Step 3 — Send a real message** to the WhatsApp number and check that a `message.received` row appears.

**Managing the webhook:**

```bash
H="X-API-Key: $OPENWA_API_KEY_OPERATOR"; BASE="$OPENWA_URL/api/sessions/$OPENWA_API_KEY_SESSION_ID/webhooks"

curl -fsS -H "$H" "$BASE"                                    # list (secrets are not returned)
curl -fsS -X PUT -H "$H" -H "Content-Type: application/json" \
  -d '{"secret":"'"$OPENWA_WEBHOOK_SECRET"'"}' "$BASE/$WEBHOOK_ID"   # rotate secret / change url, events, active
curl -fsS -X DELETE -H "$H" "$BASE/$WEBHOOK_ID"              # remove
```

**Rotating the secret:** set the new value with `set_env OPENWA_WEBHOOK_SECRET "…"` ([12.A](#a-set-the-secrets)), restart `xsia-api`, reload the variables above, then run the `PUT` and repeat step 2. OpenWA retries failed deliveries (3 attempts by default, exponential backoff), so events sent during the switch may still arrive once both sides match.

`OpenWaSender::register_webhook` in `server/src/services/messenger/openwa.rs` makes the same registration call from Rust.

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

## 14. Alternative: build on a workstation, ship to the server

Compiling on the server needs Rust, lots of RAM and a long first build. Instead you can compile on a development workstation and copy only the finished artifacts. The server then needs **no Rust toolchain and no source checkout**: skip the Rust line of [step 3](#3-install-build-toolchains-rust-bun) (keep Bun, it runs the SSR server) and all of [step 5](#5-get-the-code).

> ⚠️ **Build inside a Rocky Linux 10 container, not directly on the workstation.** A Rust binary needs the glibc version it was linked against *or newer*. Rocky 10 ships glibc 2.39; a rolling-release workstation (Arch, Fedora, …) is usually newer (`ldd --version`), and a binary built there fails on the server with `GLIBC_2.4x not found`. The container also produces the right `libtensorflow*.so`. Docker and Podman both work (replace `docker` with `podman`).
>
> 🚫 **Don't upgrade the server's glibc to match the workstation.** Rocky 10 stays on glibc 2.39 for its whole lifetime and no repository offers a newer one. `dnf`, `systemd`, `sshd`, PostgreSQL and nearly everything else link against it, so replacing it by hand can leave the server unable to boot or log in. Build for the server's glibc instead (this container), never the other way round.

### Quick path: `deploy/build-release.sh`

Steps A–D below are automated by one script. Put the production client values (the file from A) in e.g. `~/xsia-client.env`, then:

```bash
sudo systemctl start docker                      # if the daemon isn't running
ENGINE="sudo docker" deploy/build-release.sh --client-env ~/xsia-client.env main
# Output: ~/xsia-build/out/xsia_xarx-<commit>.tar.gz
```

- `ENGINE` defaults to `docker` (or `podman`); use `ENGINE="sudo docker"` if your user isn't in the `docker` group.
  Symptom of the missing prefix: `permission denied while trying to connect to the docker API at unix:///var/run/docker.sock`. Either use the prefix, or run `sudo usermod -aG docker $USER` and log in again.
- Building from the repo with a local client `.env` (when it already holds the production values):

  ```bash
  cd /path/to/xsia_xarx
  ENGINE="sudo docker" deploy/build-release.sh --client-env client/.env
  ```

  The build is long (full release compile of server, migration and client). It must be run in your own terminal if `sudo` asks for a password.
- The last argument is the branch, tag or commit to build (default `HEAD`). Uncommitted changes are not included.
- `BUILD=<dir>` changes the build directory (default `~/xsia-build`); `CARGO_BUILD_JOBS=4` limits memory use.
- The script ends by checking the binary's libraries against Rocky 10, then prints the `scp` command. Install on the server as in step D.

The manual steps follow for reference.

### A. Prepare a clean build tree (workstation)

Export the commit you want to deploy into a separate directory, so your dev `.env` files and `target/` (built against the workstation glibc) don't end up in the release:

```bash
BUILD=~/xsia-build
REV=main                                   # branch, tag or commit to ship
rm -rf $BUILD/src && mkdir -p $BUILD/src $BUILD/out
git -C ~/Projects/xsia_xarx archive "$REV" | tar -x -C $BUILD/src
```

Put the **production** client values in `$BUILD/src/client/.env`; they are baked into the bundle (same content as [7.B](#b-production-client-env)):

```bash
cat > $BUILD/src/client/.env <<'EOF'
CURRENT_INSTITUTION_ID="ed7e8c02-451b-4548-aa81-26b8d0b7fdec"
CURRENT_INSTITUTION_CODE="092010"
VITE_API_SERVER_URL="https://api.example.ac.id/api/v1/"
VITE_SERVER_URL="https://api.example.ac.id/"
VITE_WEB_SOCKET_SERVER_URL="wss://api.example.ac.id/api/v1/realtime/ws"
VITE_APP_NAME="XARX"
VITE_APP_TYPE="xarx"
EOF
```

### B. Build image (one-time)

Save as `$BUILD/Containerfile`:

```dockerfile
FROM rockylinux/rockylinux:10
# Mirrors are sometimes out of sync (404 on repodata): refresh metadata and retry.
RUN for i in 1 2 3 4 5; do \
      dnf clean all && \
      dnf -y --setopt=retries=5 --setopt=timeout=60 install epel-release && \
      dnf config-manager --set-enabled crb && \
      dnf -y --setopt=retries=5 --setopt=timeout=60 install git curl tar unzip gzip gcc gcc-c++ make cmake clang perl \
                   pkgconf-pkg-config openssl-devel && dnf clean all && exit 0; \
      echo "dnf failed (attempt $i), retrying in 20s"; sleep 20; \
    done; exit 1
ENV RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo BUN_INSTALL=/opt/bun
ENV PATH=/opt/cargo/bin:/opt/bun/bin:$PATH
# Flaky connections: retry the toolchain downloads from a clean state.
ENV RUSTUP_MAX_RETRIES=10
RUN for i in 1 2 3 4 5; do \
      rm -rf /opt/rustup /opt/cargo /opt/bun && \
      curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal && \
      curl -fsSL https://bun.sh/install | bash && exit 0; \
      echo "toolchain download failed (attempt $i), retrying in 20s"; sleep 20; \
    done; exit 1
WORKDIR /work
```

```bash
docker build -t xsia-build:rocky10 -f $BUILD/Containerfile $BUILD
```

`rust-toolchain.toml` (channel `stable`) makes rustup fetch the current stable toolchain on first use; the named volumes below keep it, the cargo registry and the `target/` cache between builds, so later builds are incremental.

### C. Compile and collect the artifacts

```bash
docker run --rm \
  -v $BUILD/src:/work/src -v $BUILD/out:/work/out \
  -v xsia-cargo-registry:/opt/cargo/registry -v xsia-rustup:/opt/rustup \
  -v xsia-target:/work/target -v xsia-target-migration:/work/target-migration \
  xsia-build:rocky10 bash -euo pipefail -c '
    cd /work/src/server
    CARGO_TARGET_DIR=/work/target cargo build --release --locked
    cd migration
    CARGO_TARGET_DIR=/work/target-migration cargo build --release --locked
    cd /work/src/client
    bun install --frozen-lockfile
    bun --bun run build
    bun scripts/extract-api-usage.mjs > /work/out/api-usage.json   # for the permission task, see 14.E

    rm -rf /work/out/release && mkdir -p /work/out/release/server/lib /work/out/release/client
    install -m 0755 /work/target/release/xsia_xarx            /work/out/release/server/
    install -m 0755 /work/target-migration/release/migration  /work/out/release/server/
    find /work/target/release -name "libtensorflow*.so*" -exec cp -a {} /work/out/release/server/lib/ \;
    cp -a /work/src/server/public  /work/out/release/server/
    cp -a /work/src/client/.output /work/out/release/client/
    mv /work/out/api-usage.json    /work/out/release/
    chown -R '"$(id -u):$(id -g)"' /work/out
  '
```

> ⏳ Same memory notes as [6.A](#a-build-release-binaries) apply; add `-e CARGO_BUILD_JOBS=4` if the workstation runs out of RAM.

Package it with the commit in the name and check that it runs against Rocky's glibc:

```bash
TAG=$(git -C ~/Projects/xsia_xarx rev-parse --short "$REV")
tar -C $BUILD/out/release -czf $BUILD/out/xsia_xarx-$TAG.tar.gz .
docker run --rm -v $BUILD/out/release:/r rockylinux/rockylinux:10 \
  bash -c 'LD_LIBRARY_PATH=/r/server/lib ldd /r/server/xsia_xarx | grep "not found" || echo "all libraries resolved"'
```

### D. Transfer and install on the server

**What goes to the server.** Only these files; everything under `/var/www/ferron/xsia_xarx` is relative to that directory:

| From the workstation | To the server | How | When |
|---|---|---|---|
| `server/xsia_xarx` (API binary) | `server/xsia_xarx` | tarball | every deploy |
| `server/migration` (migration binary) | `server/migration` | tarball | every deploy |
| `server/lib/libtensorflow*.so*` | `/usr/local/lib64/` | tarball | every deploy |
| `server/public/` (static assets, PDF logos/signatures) | `server/public/` (never overwrites `public/upload/`) | tarball | every deploy |
| `client/.output/` (SolidStart SSR build) | `client/.output/` | tarball | every deploy |
| `api-usage.json` | `server/api-usage.json` | tarball | every deploy |
| `server/models/paraphrase-multilingual-MiniLM-L12-v2/` (≈ 460 MB, gitignored) | `server/models/paraphrase-multilingual-MiniLM-L12-v2/` | `rsync`, see below | once, or when the model changes |
| — | `server/.env` | created on the server ([6.C](#c-production-env)) | once |

**Don't copy:** `target/`, the source tree, your dev `server/.env` / `client/.env`, `backups/`, `logs/`. The email template and the i18n files are compiled into the binary. The server creates `server/logs/`, `server/storage/ai/uploads/` and `server/public/upload/` itself.

The embedding model isn't in git, so it isn't in the tarball. Copy it once from your dev checkout (or download it on the server with the `hf download` command in `src/services/ai/embedding.rs`):

```bash
rsync -a --mkpath ~/Projects/xsia_xarx/server/models/paraphrase-multilingual-MiniLM-L12-v2/ \
  admin@server.example.ac.id:/tmp/minilm/
# on the server
sudo mkdir -p /var/www/ferron/xsia_xarx/server/models
sudo rsync -a --delete /tmp/minilm/ /var/www/ferron/xsia_xarx/server/models/paraphrase-multilingual-MiniLM-L12-v2/
sudo chown -R xsia:xsia /var/www/ferron/xsia_xarx/server/models
```

Ship the tarball:

```bash
scp $BUILD/out/xsia_xarx-$TAG.tar.gz admin@server.example.ac.id:/tmp/
```

On the server, save as `/var/www/ferron/xsia_xarx/install-release.sh` (`chmod +x`) and run `sudo /var/www/ferron/xsia_xarx/install-release.sh /tmp/xsia_xarx-<TAG>.tar.gz`. It does the same as the install half of [13](#13-updating--redeploying): DB backup, keep the old binary, migrate, swap the client, restart.

```bash
#!/usr/bin/env bash
set -euo pipefail
asxsia() { sudo -u xsia -H bash -lc "export PATH=\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH; $*"; }

PKG=${1:?usage: install-release.sh <xsia_xarx-TAG.tar.gz>}
RUN=/var/www/ferron/xsia_xarx
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
tar -xzf "$PKG" -C "$STAGE"

# Backup DB before migrating
mkdir -p /var/lib/pgsql/backups
sudo -u postgres pg_dump -Fc xsia_xarx > "/var/lib/pgsql/backups/xsia_xarx_$(date +%F_%H%M).dump"

# Shared library from the tensorflow crate
if compgen -G "$STAGE/server/lib/libtensorflow*.so*" >/dev/null; then
  cp -a "$STAGE"/server/lib/libtensorflow*.so* /usr/local/lib64/
  echo /usr/local/lib64 > /etc/ld.so.conf.d/local-lib64.conf && ldconfig
fi

# Backend (keep the old binary for rollback)
mkdir -p $RUN/server/logs
[ -f $RUN/server/xsia_xarx ] && cp -a $RUN/server/xsia_xarx $RUN/server/xsia_xarx.prev
install -o xsia -g xsia -m 0755 "$STAGE/server/xsia_xarx" "$STAGE/server/migration" $RUN/server/
# Sync static assets but NEVER delete runtime uploads
rsync -a --exclude 'upload/' "$STAGE/server/public/" $RUN/server/public/
install -o xsia -g xsia -m 0644 "$STAGE/api-usage.json" $RUN/server/
chown -R xsia:xsia $RUN/server/public $RUN/server/logs
restorecon -R $RUN/server                       # bin_t label (SELinux, see 6.B)

asxsia "cd $RUN/server && ./migration up"

# Frontend
mkdir -p $RUN/client
rm -rf $RUN/client/.output.new && cp -a "$STAGE/client/.output" $RUN/client/.output.new
rm -rf $RUN/client/.output && mv $RUN/client/.output.new $RUN/client/.output
chown -R xsia:xsia $RUN/client

systemctl restart xsia-api xsia-web
sleep 3
systemctl is-active xsia-api xsia-web
```

**First install.** Before the first run, do steps [1](#1-prepare-the-server), [2](#2-install-postgresql-18--extensions), [3](#3-install-build-toolchains-rust-bun) (Bun only) and [4](#4-install-headless-chromium-pdf--python-tools), add the SELinux rule from [6.B](#b-install-the-runtime-files) (the `semanage fcontext` line), and create `server/.env` as in [6.C](#c-production-env). After the script, finish [6.D](#d-run-migrations-and-initial-tasks) (the credential tasks, and the permission sync from 14.E), then [8](#8-systemd-services)–[11](#11-verify). Skip [7](#7-build--configure-the-frontend): the client was built in 14.C (it still needs the Nitro change from 7.A in the committed code). Until the units from step 8 exist, the script's final `systemctl restart` fails; that's expected.

**Rollback** works as in [13](#13-updating--redeploying), or reinstall an older tarball (restore the pre-deploy dump if a migration must be undone).

### E. Permissions sync without the client source

`utility:generate-permission-from-client` normally runs `client/scripts/extract-api-usage.mjs` against the client source, which the server doesn't have. The build step above already ran it and shipped the result as `api-usage.json` (next to the binary, in `server/`). When no client source is found, the task falls back to `./api-usage.json` automatically; `--input <path>` points it at a different file:

```bash
# uses ./api-usage.json (run from server/)
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task utility:generate-permission-from-client --area course-department --dry-run'

# explicit path
asxsia 'cd /var/www/ferron/xsia_xarx/server && ./xsia_xarx task utility:generate-permission-from-client --input /path/to/api-usage.json --prune'
```

If it fails with `cannot read client API usage file`, the file was not shipped (older deploy). Regenerate it on the workstation and install it:

```bash
cd client && bun scripts/extract-api-usage.mjs > /tmp/api-usage.json
scp /tmp/api-usage.json you@server:/tmp/
# on the server
sudo install -o xsia -g xsia -m 0644 /tmp/api-usage.json /var/www/ferron/xsia_xarx/server/api-usage.json
```

Use `--area <name>` to limit the sync to one client area and `--dry-run` to preview. Add `--prune` only when you want to revoke grants the client no longer needs. Run `utility:generate-permission-from-route` first if a new route's permission row doesn't exist yet.

**Where the file comes from and where it goes**

- It is not a compile output. It is generated from the client source by `client/scripts/extract-api-usage.mjs`; `deploy/build-release.sh` runs that and ships it in the release.
- It lives at `/var/www/ferron/xsia_xarx/server/api-usage.json`, next to the `xsia_xarx` binary, readable by `xsia`. Run the task from that directory, because the automatic fallback is relative to the working directory.
- `generate_permission_from_client.rs` is the Rust source of the task, compiled into the binary. You never run it directly; you run it as `./xsia_xarx task utility:generate-permission-from-client`.
- A binary built before the fallback was added always needs `--input api-usage.json`.

**Fixing a 403 on one area (example: `course-department`)**

```bash
cd /var/www/ferron/xsia_xarx/server
# 1. Preview. Check that the route's permission is listed for the position type.
sudo -u xsia -H ./xsia_xarx task utility:generate-permission-from-client --input api-usage.json --area course-department --dry-run
# 2. Apply
sudo -u xsia -H ./xsia_xarx task utility:generate-permission-from-client --input api-usage.json --area course-department
```

If the preview says the permission doesn't exist, run `utility:generate-permission-from-route` first. Then reload the page as a user of that role.

---

## 15. Backups

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

## 16. Troubleshooting

| Symptom | Likely cause / fix |
| :--- | :--- |
| `502 Bad Gateway` from Ferron | Service down (`systemctl status xsia-api xsia-web`), the upstream port is wrong (old configs use `5150`; the API is on `5800`), or SELinux (see [step 10](#10-firewall--selinux)). |
| No HTTPS certificate issued | DNS doesn't point at the server yet, port 80 is blocked, or `/var/cache/ferron-acme` isn't writable. Check `journalctl -u ferron`. |
| API exits with `password authentication failed for user "bendo01"` | `server/.env` isn't readable, so the built-in default credentials are used. Usually it's owned by `root` (created/edited with plain `sudo`), or the binary was run as your login user. `chown xsia:xsia` + `chmod 600` it and run as `xsia` ([6.C](#c-production-env)). |
| API exits with `Failed to connect to PGMQ` | Wrong `DATABASE_URL`, `pg_hba.conf` still on `ident`, or role lacks rights on schema `pgmq`. |
| `extension "pg_uuidv7" is not available` (or `"age"`) | Built against the wrong PostgreSQL — rebuild with `PATH=/usr/pgsql-18/bin:$PATH` (for AGE, use the `release/PG18/…` branch). |
| `403 Forbidden` on a page's API call for a staff role | The role's position type lacks the route's permission — run [14.E](#e-permissions-sync-without-the-client-source) with `--area <name>`. |
| Migration fails: `permission denied for schema ag_catalog` / `for table ag_graph` | AGE grants missing — run the AGE lines of [2.C](#c-create-the-database-role-and-enable-extensions) as `postgres`. |
| `access to library "age" is not allowed` | Something ran `LOAD 'age'` as `xsia` (non-superusers can't). Rely on `session_preload_libraries` from [2.C](#c-create-the-database-role-and-enable-extensions) instead. |
| `unhandled cypher(cstring) function call` | AGE isn't loaded in that connection — check `SHOW session_preload_libraries;` returns `age`, then restart `xsia-api` so the pool reconnects. |
| `operator class "graphid_ops" does not exist` | `ag_catalog.create_graph()` called without `ag_catalog` on the `search_path`. |
| `autocrop` / `docling: command not found` from the API | Not installed as `xsia`, or the unit lacks `Environment=PATH=/var/lib/xsia/.local/bin:…` (see [4.B](#b-autocrop--docling-via-uv)). Run `systemctl daemon-reload && systemctl restart xsia-api` after editing. |
| Webhook returns `503` | No secret: no active OpenWA settings with a secret in the database, and `MIAB_WEBHOOK_SECRET` / `OPENWA_WEBHOOK_SECRET` empty in `server/.env` (or `xsia-api` not restarted after editing `.env`) ([12.A](#a-set-the-secrets)). |
| Webhook returns `500` "Webhook settings unavailable" | The stored OpenWA settings can't be read: usually `APP_ENCRYPTION_KEY` changed since they were saved. Restore the old key, or re-save them with `utility:preference-add-openwa`. |
| Feeder task: "No Feeder credential is stored…" | Run `utility:feeder-add-credential` ([6.D](#d-run-migrations-and-initial-tasks)); the current institution comes from it. |
| Feeder task: "…more than one institution…" | `feeder_akun.kredential` holds credentials for several institutions. Soft-delete the ones that don't belong to this installation (set `deleted_at`). |
| Webhook returns `401` | Secret differs between the sender and xsia (the database, or `server/.env` when nothing is stored), the body was changed after signing (sign the exact bytes sent), or the OpenWA webhook was registered without a secret. |
| `vp: command not found` during the client build | Dependencies not installed — run `bun install --frozen-lockfile` in `src/client` (Vite+ is a local dev dependency). |
| Logos / signatures missing in PDFs, `No such file` | `WorkingDirectory` / `APP_DIRECTORY` not `/var/www/ferron/xsia_xarx/server`, or `public/` not copied. |
| PDF endpoint hangs or errors | `CHROME_BIN` wrong or Chromium missing; test with `$CHROME_BIN --headless --dump-dom https://example.com`. |
| Frontend calls `127.0.0.1:5800` from the browser | `client/.env` missing at build time — `VITE_API_SERVER_URL` is baked in; fix and rebuild. |
| WebSocket closes immediately | `ws://` used on an HTTPS page (use `wss://` in `VITE_WEB_SOCKET_SERVER_URL` and rebuild the client). |
| `xsia-api` fails with `status=203/EXEC` | SELinux label on the binary is `httpd_sys_content_t`. Run the `semanage fcontext` + `restorecon` step in [6.B](#b-install-the-runtime-files). |
| `xsia-web` fails with `status=203/EXEC` | SELinux label on `/var/lib/xsia/.bun/bin/bun` is `var_lib_t`. Run the `semanage fcontext` + `restorecon` lines in [step 3](#3-install-build-toolchains-rust-bun) (again after `bun upgrade`). |
| `error while loading shared libraries: libtensorflow…` | See the `ldd` step in [6.B](#b-install-the-runtime-files). |
| `version 'GLIBC_2.4x' not found` | The binary was built on a machine with a newer glibc. Rebuild in the Rocky 10 container ([14.C](#c-compile-and-collect-the-artifacts)); don't upgrade the server's glibc. |
| CORS errors | The API allows any origin; check that Ferron isn't adding duplicate `Access-Control-*` headers (e.g. a `cors_headers` snippet applied to the API host). |

Logs: `journalctl -u xsia-api -f`, `journalctl -u xsia-web -f`, `/var/log/ferron/error.log`, `journalctl -u ferron`, `/var/lib/pgsql/18/data/log/`.
