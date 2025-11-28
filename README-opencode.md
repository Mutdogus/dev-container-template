# OpenCode (TUI) + OpenCode GUI setup

This file contains quick steps to install the OpenCode terminal UI (TUI) and the OpenCode VS Code GUI extension for VS Code Insiders.

## Quick start

Run the automated install script (works on macOS, Debian/Ubuntu, Fedora/RHEL):

```bash
./scripts/install-opencode.sh
```

The script will:
- Detect your OS and install/verify prerequisites (Homebrew on macOS, Docker, VS Code Insiders)
- Install the OpenCode TUI
- Install the OpenCode VS Code GUI extension
- Update your shell configuration

Then reload your shell:

```bash
exec zsh -l
```

Verify the installation:

```bash
opencode --version
```

## Manual steps

Prerequisites
- Docker (optional for other workflows)
- VS Code Insiders (for the GUI extension)
- Homebrew (recommended on macOS) or apt/dnf for Linux

### 1) Install the OpenCode TUI (terminal)

Run the official installer (this downloads the CLI and installs it):

```bash
curl -fsSL https://opencode.ai/install | bash
```

After install, verify:

```bash
opencode --version
opencode --help
```

### 2) Install the OpenCode GUI extension in VS Code Insiders

Option A — from VS Code UI:
- Open Extensions (Cmd+Shift+X)
- Search for "OpenCode" or use the extension id `tanishqkancharla.opencode-vscode`
- Click Install

Option B — from the command line (VS Code Insiders):

```bash
# install via CLI (use `code-insiders` for VS Code Insiders)
code-insiders --install-extension tanishqkancharla.opencode-vscode --force
```

### 3) Reload your shell

After the TUI install, reload your shell so `opencode` is on your PATH:

```bash
exec zsh -l
# or just open a new terminal tab
```

### 4) Try them together

- Open your project in VS Code Insiders
- Launch the OpenCode TUI in your terminal:

```bash
opencode
```

- Use the OpenCode GUI sidebar/commands in VS Code to start sessions, or run the TUI and keep the IDE for editing.

### 5) Tips
- If you host models locally (Ollama), configure OpenCode to point at the local endpoint in `~/.config/opencode/config` or via environment variables (see https://opencode.ai/docs).
- The devcontainer in this repo already lists the GUI extension under `.devcontainer/devcontainer.json` so the extension will be recommended when opening in a container.
- The `scripts/install-opencode.sh` automates the entire setup and works cross-platform (macOS, Debian/Ubuntu, Fedora/RHEL).