#!/usr/bin/env bash
# Build a release tarball for the Rocky Linux 10 server inside a Rocky 10 container.
# See DEPLOYMENT.md section 14.
#
# Usage: deploy/build-release.sh --client-env FILE [REV]
#   --client-env FILE   production client .env (VITE_* values are baked into the bundle)
#   REV                 branch, tag or commit to build (default: HEAD)
#
# Env: BUILD (default ~/xsia-build), ENGINE (e.g. "sudo docker"; default docker/podman), CARGO_BUILD_JOBS
set -euo pipefail

CLIENT_ENV=""
REV=HEAD
while [ $# -gt 0 ]; do
  case $1 in
    --client-env) CLIENT_ENV=${2:?--client-env needs a file}; shift 2 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) REV=$1; shift ;;
  esac
done
[ -f "$CLIENT_ENV" ] || { echo "error: --client-env FILE is required and must exist" >&2; exit 1; }

REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
BUILD=${BUILD:-$HOME/xsia-build}
read -r -a ENGINE <<< "${ENGINE:-$(command -v docker || command -v podman || true)}"
[ -n "${ENGINE[0]:-}" ] || { echo "error: neither docker nor podman found" >&2; exit 1; }

if ! git -C "$REPO" diff --quiet HEAD 2>/dev/null; then
  echo "warning: working tree has uncommitted changes; they are NOT included (building $REV)" >&2
fi
TAG=$(git -C "$REPO" rev-parse --short "$REV")

# A. clean build tree
rm -rf "$BUILD/src" && mkdir -p "$BUILD/src" "$BUILD/out"
git -C "$REPO" archive "$REV" | tar -x -C "$BUILD/src"
cp "$CLIENT_ENV" "$BUILD/src/client/.env"

# B. build image (cached after first run)
cat > "$BUILD/Containerfile" <<'DOCKERFILE'
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
RUN curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal && \
    curl -fsSL https://bun.sh/install | bash
WORKDIR /work
DOCKERFILE
"${ENGINE[@]}" build -t xsia-build:rocky10 -f "$BUILD/Containerfile" "$BUILD"

# C. compile and collect
rm -rf "$BUILD/out/release"
"${ENGINE[@]}" run --rm \
  ${CARGO_BUILD_JOBS:+-e CARGO_BUILD_JOBS=$CARGO_BUILD_JOBS} \
  -v "$BUILD/src:/work/src" -v "$BUILD/out:/work/out" \
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
    bun scripts/extract-api-usage.mjs > /work/out/api-usage.json

    mkdir -p /work/out/release/server/lib /work/out/release/client
    install -m 0755 /work/target/release/xsia_xarx            /work/out/release/server/
    install -m 0755 /work/target-migration/release/migration  /work/out/release/server/
    find /work/target/release -name "libtensorflow*.so*" -exec cp -a {} /work/out/release/server/lib/ \;
    cp -a /work/src/server/public  /work/out/release/server/
    cp -a /work/src/client/.output /work/out/release/client/
    mv /work/out/api-usage.json    /work/out/release/
    chown -R '"$(id -u):$(id -g)"' /work/out /work/src
  '

# D. package + verify against Rocky's glibc
TARBALL=$BUILD/out/xsia_xarx-$TAG.tar.gz
tar -C "$BUILD/out/release" -czf "$TARBALL" .
"${ENGINE[@]}" run --rm -v "$BUILD/out/release:/r:ro" rockylinux/rockylinux:10 \
  bash -c 'LD_LIBRARY_PATH=/r/server/lib ldd /r/server/xsia_xarx | grep "not found" && exit 1 || echo "all libraries resolved"'

echo "Built $TARBALL"
echo "Ship:  scp $TARBALL USER@HOST:/tmp/"
