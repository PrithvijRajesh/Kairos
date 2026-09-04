#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed."
  echo "Install with: brew install node"
  echo "Or download from https://nodejs.org"
  exit 1
fi

echo "Node $(node -v) · npm $(npm -v)"
echo "Installing backend dependencies..."
(cd "$ROOT/backend" && npm install)
echo "Installing frontend dependencies..."
(cd "$ROOT/frontend" && (npm ci 2>/dev/null || npm install --legacy-peer-deps))
echo ""
echo "Done. To run:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npx expo start"
