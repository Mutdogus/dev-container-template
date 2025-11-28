#!/usr/bin/env bash
set -euo pipefail

echo "Installing OpenCode TUI (idempotent)..."
echo ""

# Detect OS and package manager for installing prerequisites (curl)
OS_TYPE="$(uname -s)"
INSTALL_CMD=""

echo "=== Checking prerequisites ==="
echo ""

# Check and install Homebrew on macOS
if [ "${OS_TYPE}" = "Darwin" ]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Set brew into PATH for Apple Silicon
    eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"
  else
    echo "✓ Homebrew found: $(brew --version | head -1)"
  fi
  PKG_MGR="brew"
  INSTALL_CMD="brew install"
elif [ "${OS_TYPE}" = "Linux" ]; then
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    if echo "${ID} ${ID_LIKE:-}" | grep -Eiq "debian|ubuntu"; then
      PKG_MGR="apt"
      INSTALL_CMD="sudo apt-get update && sudo apt-get install -y"
    elif echo "${ID} ${ID_LIKE:-}" | grep -Eiq "fedora|centos|rhel"; then
      PKG_MGR="dnf"
      INSTALL_CMD="sudo dnf install -y"
    else
      PKG_MGR="apk"
      INSTALL_CMD="sudo apk add --no-cache"
    fi
  else
    echo "Unable to detect Linux distribution; please ensure prerequisites are installed and rerun."
  fi
else
  echo "Unsupported OS: ${OS_TYPE}. Please install prerequisites manually."
fi

# Ensure curl is available
if ! command -v curl >/dev/null 2>&1; then
  if [ -n "${INSTALL_CMD}" ]; then
    echo "Installing curl using ${PKG_MGR}..."
    eval "${INSTALL_CMD} curl"
  else
    echo "curl not found and no package manager detected. Please install curl and re-run."
    exit 1
  fi
else
  echo "✓ curl found: $(curl --version | head -1)"
fi

# Check and install Docker
if ! command -v docker >/dev/null 2>&1; then
  echo ""
  echo "Docker not found. Installing Docker..."
  if [ "${OS_TYPE}" = "Darwin" ]; then
    echo "  macOS detected. Installing Docker Desktop via Homebrew..."
    brew install --cask docker
    echo "  Please start Docker Desktop manually and rerun this script."
    exit 0
  elif [ "${OS_TYPE}" = "Linux" ]; then
    echo "  Linux detected. Installing Docker CLI..."
    eval "${INSTALL_CMD} docker.io" || eval "${INSTALL_CMD} docker"
    sudo usermod -aG docker "${USER}" 2>/dev/null || true
    echo "  Note: You may need to log out and back in for group permissions to take effect."
  fi
else
  echo "✓ Docker found: $(docker --version)"
fi

# Check and install VS Code Insiders
if ! command -v code-insiders >/dev/null 2>&1; then
  echo ""
  echo "VS Code Insiders not found. Installing..."
  if [ "${OS_TYPE}" = "Darwin" ]; then
    echo "  macOS detected. Installing VS Code Insiders via Homebrew..."
    brew install --cask visual-studio-code-insiders
  elif [ "${OS_TYPE}" = "Linux" ]; then
    echo "  Linux detected. Installing VS Code Insiders..."
    if echo "${ID} ${ID_LIKE:-}" | grep -Eiq "debian|ubuntu"; then
      wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
      sudo install -D -o root -g root -m 644 microsoft.gpg /etc/apt/keyrings/microsoft.gpg
      echo "deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/vscode stable main" | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
      eval "${INSTALL_CMD} code-insiders"
      rm -f microsoft.gpg
    elif echo "${ID} ${ID_LIKE:-}" | grep -Eiq "fedora|centos|rhel"; then
      eval "${INSTALL_CMD} code"
      echo "  Note: VS Code Insiders may not be available on Fedora/RHEL; using regular VS Code instead."
    fi
  fi
else
  echo "✓ VS Code Insiders found: $(code-insiders --version | head -1)"
fi

echo ""
echo "=== Installing uv package manager ==="
echo ""

# Check and install uv (required for Spec-Kit)
if ! command -v uv >/dev/null 2>&1; then
  echo "uv not found. Installing uv..."
  if [ "${OS_TYPE}" = "Darwin" ]; then
    brew install uv
  elif [ "${OS_TYPE}" = "Linux" ]; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
  fi
else
  echo "✓ uv found: $(uv --version)"
fi

echo ""
echo "=== Installing Spec-Kit (specify-cli) ==="
echo ""

# Check and install Spec-Kit
if ! command -v specify >/dev/null 2>&1; then
  echo "Installing specify-cli from GitHub/spec-kit..."
  uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
else
  echo "✓ specify-cli already installed: $(specify --version 2>/dev/null || echo 'version check unavailable')"
fi

echo ""

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
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Reload your shell: exec zsh -l"
echo "2. Verify OpenCode: opencode --version"
echo "3. Verify Spec-Kit: specify --version && specify check"
echo "4. Open VS Code Insiders to see the OpenCode extension"
echo ""
echo "Ready to get started?"
echo "  - For OpenCode TUI usage: see README-opencode.md"
echo "  - For Spec-Kit workflow: see README-spec-kit.md"
echo ""
echo "Happy coding!"
