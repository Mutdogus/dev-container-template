#!/usr/bin/env bash
set -euo pipefail

echo "=== configure-coding-environment: wrapper that runs split install scripts ==="

# Ask for sudo up-front and keepalive
if command -v sudo >/dev/null 2>&1; then
  sudo -v || true
  ( while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null ) &
fi

SCRIPTS_DIR="$(cd "$(dirname "$0")/" && pwd)/scripts"

echo "Running prerequisites installer..."
bash "${SCRIPTS_DIR}/install-prereqs.sh"

echo "Running OpenCode installer..."
bash "${SCRIPTS_DIR}/install-opencode.sh"

echo "Installing Spec-Kit (uv + specify)..."
bash "${SCRIPTS_DIR}/install-spec-kit.sh"

echo "Configuring shell environment..."
bash "${SCRIPTS_DIR}/configure-env.sh"

echo "All done. If zsh, run: exec zsh -l" 
