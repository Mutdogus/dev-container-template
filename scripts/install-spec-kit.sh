#!/usr/bin/env bash
set -euo pipefail

echo "=== install-spec-kit.sh: install uv and specify-cli ==="

# Install uv (prefer Homebrew if available)
if ! command -v uv >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "Installing uv via Homebrew..."
    brew install uv || true
  fi
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "Falling back to curl installer for uv"
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

if command -v uv >/dev/null 2>&1; then
  echo "uv installed: $(uv --version 2>/dev/null || true)"
else
  echo "uv installation failed or uv not on PATH"
fi

echo "Installing specify-cli via uv"
if command -v uv >/dev/null 2>&1; then
  uv tool install specify-cli --from git+https://github.com/github/spec-kit.git || echo "uv tool install failed"
else
  echo "Skipping specify-cli install because uv not found"
fi

echo "Note: uv installs executables to ~/.local/bin by default. Ensure ~/.local/bin is on PATH or run 'uv tool update-shell'"

echo "install-spec-kit.sh complete"
