#!/usr/bin/env bash
set -euo pipefail

echo "=== install-prereqs.sh: ensure package manager, curl, Docker Desktop, and VS Code Insiders ==="

OS_TYPE="$(uname -s)"
INSTALL_CMD=""

if [ "${OS_TYPE}" = "Darwin" ]; then
  PKG_MGR="brew"
  INSTALL_CMD="brew install"
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"
  else
    echo "✓ Homebrew found: $(brew --version | head -1)"
  fi
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
    exit 1
  fi
else
  echo "Unsupported OS: ${OS_TYPE}. Please install prerequisites manually."
  exit 1
fi

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

# Docker Desktop on macOS via Homebrew cask; on Linux install docker package
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Installing Docker..."
  if [ "${OS_TYPE}" = "Darwin" ]; then
    echo "  macOS detected. Installing Docker Desktop via Homebrew..."
    brew install --cask docker
    echo "  Please start Docker Desktop manually and rerun any scripts that require Docker."
  elif [ "${OS_TYPE}" = "Linux" ]; then
    echo "  Linux detected. Installing Docker CLI..."
    eval "${INSTALL_CMD} docker.io" || eval "${INSTALL_CMD} docker"
    sudo usermod -aG docker "${USER}" 2>/dev/null || true
    echo "  Note: You may need to log out and back in for group permissions to take effect."
  fi
else
  echo "✓ Docker found: $(docker --version)"
fi

# VS Code Insiders
if ! command -v code-insiders >/dev/null 2>&1; then
  echo "VS Code Insiders not found. Installing..."
  if [ "${OS_TYPE}" = "Darwin" ]; then
    brew install --cask visual-studio-code-insiders
  elif [ "${OS_TYPE}" = "Linux" ]; then
    if echo "${ID} ${ID_LIKE:-}" | grep -Eiq "debian|ubuntu"; then
      wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
      sudo install -D -o root -g root -m 644 microsoft.gpg /etc/apt/keyrings/microsoft.gpg
      echo "deb [arch=amd64,arm64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/vscode stable main" | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
      eval "${INSTALL_CMD} code-insiders"
      rm -f microsoft.gpg
    else
      eval "${INSTALL_CMD} code || true"
      echo "Note: VS Code Insiders may not be available on this distro; regular VS Code may have been installed."
    fi
  fi
else
  echo "✓ VS Code Insiders found: $(code-insiders --version | head -1)"
fi

echo "install-prereqs.sh complete"
