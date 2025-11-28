#!/usr/bin/env bash
set -euo pipefail

echo "=== configure-env.sh: configure shell environment (PATH updates) ==="

ZSHRC="$HOME/.zshrc"
ENTRY='export PATH="$HOME/.local/bin:$PATH"'

if [ -f "$ZSHRC" ]; then
  if ! grep -qxF "$ENTRY" "$ZSHRC" 2>/dev/null; then
    echo "$ENTRY" >> "$ZSHRC"
    echo "Appended uv PATH to $ZSHRC"
  else
    echo "uv PATH already present in $ZSHRC"
  fi
else
  echo "$ZSHRC not found; creating and adding PATH entry"
  echo "$ENTRY" > "$ZSHRC"
fi

echo "To apply changes now, run: exec zsh -l"

echo "configure-env.sh complete"
