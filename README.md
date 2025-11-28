# Personal Coding Environment Setup

This repository contains a portable, reproducible setup for AI-assisted development using OpenCode and Spec-Kit.

## Quick Start

Run the automated setup script:

```bash
./scripts/install-opencode.sh
```

Then reload your shell:

```bash
exec zsh -l
```

Verify everything works:

```bash
opencode --version
specify --version
```

## What's Included

### 1. OpenCode (TUI + GUI)
- **OpenCode TUI**: Terminal-based AI coding agent
- **OpenCode VS Code Extension**: GUI integration in VS Code Insiders
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

See [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json).

## Installation Features

The install script automatically:
- ✅ Detects your OS (macOS, Debian/Ubuntu, Fedora/RHEL)
- ✅ Installs Homebrew (macOS) or uses native package manager (Linux)
- ✅ Installs Docker
- ✅ Installs VS Code Insiders
- ✅ Installs OpenCode TUI
- ✅ Installs OpenCode VS Code extension
- ✅ Installs `uv` package manager
- ✅ Installs Spec-Kit CLI (`specify`)
- ✅ Updates shell configuration (`.zshrc`, `.bashrc`)

## File Structure

```
personal/
├── README.md                           # This file
├── README-opencode.md                  # OpenCode TUI + GUI setup guide
├── README-spec-kit.md                  # Spec-Driven Development guide
├── opencode-spec-kit-session.md        # Original Copilot chat transcript
├── .devcontainer/
│   └── devcontainer.json               # Dev container configuration
└── scripts/
    └── install-opencode.sh             # Automated setup script
```

## Prerequisites

- macOS or Linux (Debian/Ubuntu, Fedora/RHEL)
- Internet connection
- 10+ GB free disk space (for Docker, dependencies)

## Next Steps

1. **Run the setup script** (first time only):
   ```bash
   ./scripts/install-opencode.sh
   ```

2. **Choose your workflow**:
   - **Option A**: Use OpenCode TUI directly in the terminal
   - **Option B**: Use OpenCode GUI in VS Code Insiders
   - **Option C**: Use Spec-Kit for structured, specification-driven development

3. **For Spec-Kit setup**:
   ```bash
   specify init my-project --ai opencode
   cd my-project
   opencode
   /speckit.constitution
   ```

4. **For dev container development**:
   - Open this repo in VS Code Insiders
   - Use "Dev Containers: Reopen in Container"

## Troubleshooting

- **Shell reload**: After running the script, reload your shell with `exec zsh -l`
- **OpenCode not found**: Ensure `.zshrc` was updated; try `source ~/.zshrc`
- **VS Code extension not installed**: Run `code-insiders --install-extension tanishqkancharla.opencode-vscode --force`
- **specify not found**: Verify `uv` is installed with `uv --version` and on PATH

## Resources

- **OpenCode**: https://opencode.ai/
- **Spec-Kit**: https://github.com/github/spec-kit
- **OpenCode VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=tanishqkancharla.opencode-vscode
- **Dev Containers**: https://containers.dev/

---

**Last Updated**: 2025-11-28
**Setup Tested On**: macOS 14+ with Apple Silicon
