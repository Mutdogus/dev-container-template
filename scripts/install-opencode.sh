#!/usr/bin/env bash
set -euo pipefail

echo "Installing OpenCode TUI (idempotent)..."
echo ""

# Detect OS and package manager for installing prerequisites (curl)
#!/usr/bin/env bash
set -euo pipefail

echo "Installing OpenCode TUI (idempotent)..."

# Run the upstream OpenCode installer (official install script)
echo "Running OpenCode installer..."
curl -fsSL https://opencode.ai/install | bash

# Try to install the VS Code Insiders extension if a code CLI is available
echo ""
echo "=== Installing VS Code Extension ==="
echo ""
CODE_CLI=""
if command -v code-insiders >/dev/null 2>&1; then
  CODE_CLI=code-insiders
elif command -v code >/dev/null 2>&1; then
  CODE_CLI=code
fi

if [ -n "${CODE_CLI}" ]; then
  echo "Using ${CODE_CLI} to install the OpenCode GUI extension..."
  ${CODE_CLI} --install-extension tanishqkancharla.opencode-vscode --force || true
  echo "✓ Extension install attempted (or already installed)."
else
  echo "VS Code CLI not found. To auto-install the GUI extension, install VS Code Insiders and ensure 'code-insiders' (or 'code') is on PATH."
fi

echo ""
echo "Done: OpenCode installation steps completed (prereqs and spec-kit handled by separate scripts)."
