# Personal Coding Environment Setup

This repository contains a portable, reproducible setup for AI-assisted development using OpenCode and Spec-Kit, made completly with opencode tui and the speckit workflow.

## Quick Start

Run the automated setup wrapper (runs all installers):

```bash
bash configure-coding-environment.sh
```

Then reload your shell:

```bash
exec zsh -l
```

Verify everything works:

```bash
opencode --version
specify --version
docker --version
```

**Note**: See [SESSION.md](SESSION.md) for current session state, known issues, and troubleshooting.

## What's Included

### 1. OpenCode (TUI + GUI)

- **OpenCode TUI**: Terminal-based AI coding agent
  - **Repository**: https://github.com/opencode/opencode
- **Installation**: `curl -fsSL https://opencode.ai/install | bash`
- **VS Code Extension**: GUI integration in VS Code Insiders
  - **Repository**: https://github.com/tanishqkancharla/opencode-vscode
  - **Installation**: `code-insiders --install-extension tanishqkancharla.opencode-vscode`
- Works with local or remote LLM models

See [README-opencode.md](README-opencode.md) for detailed setup and usage.

### 2. Spec-Kit (Spec-Driven Development)

- GitHub's toolkit for specification-driven development
- AI-powered workflow to turn specs into working code
- Supports OpenCode, Claude Code, GitHub Copilot, and more

See [README-spec-kit.md](README-spec-kit.md) for the full workflow guide.

### 3. Dev Containers

- Python-based dev environment preconfigured with OpenCode
- Cross-platform (macOS, Linux, Windows)
- Reproducible environment for local and Proxmox-based development
- **Fixed port conflicts** (3001, 8001, 5433) to avoid local service conflicts
- **Removed GitHub CLI feature** that was causing build failures

See [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) for current configuration.

**Recent Updates:**

- ✅ Fixed VS Code container loading issues
- ✅ Resolved port conflicts with local services
- ✅ Removed problematic GitHub CLI feature
- ✅ Container now builds and connects successfully

## Installation Features

The install wrapper (`configure-coding-environment.sh`) automatically runs these focused scripts:

- **`scripts/install-prereqs.sh`** — Detects OS, installs Homebrew/package manager, curl, Docker, VS Code Insiders
- **`scripts/install-opencode.sh`** — Installs OpenCode TUI and VS Code extension
- **`scripts/install-spec-kit.sh`** — Installs uv package manager and specify-cli
- **`scripts/configure-env.sh`** — Updates shell configuration (PATH for uv tools)
- **Used in this project**: Complete devcontainer implementation with OpenCode CLI integration

Features:

- ✅ Detects your OS (macOS, Debian/Ubuntu, Fedora/RHEL)
- ✅ Installs Homebrew (macOS) or uses native package manager (Linux)
- ✅ Installs Docker
- ✅ Installs VS Code Insiders
- ✅ Installs OpenCode TUI
- ✅ Installs OpenCode VS Code extension
- ✅ Installs `uv` package manager
- ✅ Installs Spec-Kit CLI (`specify`)
- ✅ **Used in this project**: Complete devcontainer implementation with OpenCode CLI integration
- ✅ Updates shell configuration (`.zshrc`, `.bashrc`)
- ✅ All scripts are idempotent (safe to run multiple times)

## File Structure

```
personal/
├── README.md                           # Quick-start and overview
├── SESSION.md                          # Current session state and bootstrap guide
├── README-opencode.md                  # OpenCode TUI + GUI setup guide
├── README-spec-kit.md                  # Spec-Driven Development guide
├── opencode-spec-kit-session.md        # Original Copilot chat transcript
├── configure-coding-environment.sh     # Main wrapper script (runs all installers)
├── .devcontainer/
│   └── devcontainer.json               # Dev container configuration
└── scripts/
    ├── install-prereqs.sh              # Prerequisites: Homebrew, curl, Docker, VS Code
    ├── install-opencode.sh             # OpenCode TUI + extension installer
    ├── install-spec-kit.sh             # uv + specify-cli installer
    └── configure-env.sh                # Shell environment configuration
```

## Prerequisites

- macOS or Linux (Debian/Ubuntu, Fedora/RHEL)
- Internet connection
- 10+ GB free disk space (for Docker, dependencies)

## Next Steps

1. **Run the setup wrapper** (first time only):

   ```bash
   bash configure-coding-environment.sh
   ```

   See [SESSION.md](SESSION.md) if issues occur.

2. **Reload your shell**:

   ```bash
   exec zsh -l
   ```

3. **Verify all tools**:

   ```bash
   opencode --version
   specify --version
   uv --version
   docker --version
   ```

4. **Choose your workflow**:
   - **Option A**: Use OpenCode TUI directly in the terminal
   - **Option B**: Use OpenCode GUI in VS Code Insiders
   - **Option C**: Use Spec-Kit for structured, specification-driven development (recommended)

5. **For Spec-Kit setup**:

   ```bash
   specify init my-project --ai opencode --script sh
   cd my-project
   opencode
   /speckit.constitution
   ```

6. **For dev container development**:
   - Open this repo in VS Code Insiders
   - Use "Dev Containers: Reopen in Container"

See [README-spec-kit.md](README-spec-kit.md) for full Spec-Driven Development workflow.

## Troubleshooting

See [SESSION.md](SESSION.md) for detailed troubleshooting of known issues.

Quick fixes:

- **Shell reload**: After running the script, reload your shell with `exec zsh -l`
- **OpenCode not found**: Ensure `~/.zshrc` was updated; try `source ~/.zshrc` then `exec zsh -l`
- **VS Code extension not installed**: Run `code-insiders --install-extension tanishqkancharla.opencode-vscode --force`
- **specify not found**: Verify `uv` is installed with `uv --version` and on PATH; reload shell
- **Docker not starting**: Manually start Docker Desktop (Applications folder)

## Resources

- **OpenCode**: https://opencode.ai/
- **Spec-Kit**: https://github.com/github/spec-kit
- **OpenCode VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=tanishqkancharla.opencode-vscode
- **Dev Containers**: https://containers.dev/

---

**Last Updated**: 2025-11-28  
**Setup Status**: Refactored and in progress (see [SESSION.md](SESSION.md))  
**Tested On**: macOS 14+ with Apple Silicon
