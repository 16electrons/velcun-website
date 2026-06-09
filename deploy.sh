#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

NODE_DIR="/tmp/node-v22.16.0-darwin-arm64"
GH_DIR="/tmp/gh_2.74.2_macOS_arm64"

if [ ! -x "$NODE_DIR/bin/node" ]; then
  echo "→ Installing Node.js..."
  curl -fsSL -o /tmp/node.tar.gz "https://nodejs.org/dist/v22.16.0/node-v22.16.0-darwin-arm64.tar.gz"
  tar -xzf /tmp/node.tar.gz -C /tmp
fi

if [ ! -x "$GH_DIR/bin/gh" ]; then
  echo "→ Installing GitHub CLI..."
  curl -fsSL -o /tmp/gh.zip "https://github.com/cli/cli/releases/download/v2.74.2/gh_2.74.2_macOS_arm64.zip"
  unzip -qo /tmp/gh.zip -d /tmp
fi

export PATH="$NODE_DIR/bin:$GH_DIR/bin:$PATH"

echo "→ Checking GitHub auth..."
if ! gh auth status &>/dev/null; then
  echo "   Log in to GitHub (browser will open):"
  gh auth login -h github.com -p https -w
fi

REPO_NAME="${1:-velcun-website}"

if git remote get-url origin &>/dev/null; then
  echo "→ Pushing to existing remote..."
  git push -u origin main
else
  echo "→ Creating GitHub repo: $REPO_NAME"
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
fi

echo "→ Checking Vercel auth..."
if ! npx vercel whoami &>/dev/null; then
  echo "   Log in to Vercel (browser will open):"
  npx vercel login
fi

echo "→ Deploying to Vercel production..."
npx vercel --prod --yes --name velcun

echo ""
echo "✓ Done! Add velcun.com in Vercel → Project → Settings → Domains if not already added."
echo "  https://velcun.com"
