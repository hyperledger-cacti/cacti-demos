#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "[Cacti Starter] Enabling corepack..."
corepack enable || true
echo "[Cacti Starter] Installing dependencies..."
yarn install
echo "[Cacti Starter] Bootstrap complete!"
