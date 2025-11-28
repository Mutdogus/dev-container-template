# Spec-kit / OpenCode — Copilot Chat Transcript

Date: 2025-11-28

## Links referenced

- https://github.com/github/spec-kit
- https://opencode.ai/

## User intent

You asked how to set up a portable AI-assisted coding environment using GitHub's `spec-kit` and OpenCode (TUI + GUI). You want a setup that works on your Mac and can move with you (you have Proxmox infra at home).

## Key assistant recommendations (cleaned)

- OpenCode: install both the GUI VS Code extension and use the OpenCode TUI in the terminal (hybrid approach).
  - Extension suggested: `tanishqkancharla.opencode-vscode`
- Spec-kit: appears to be an experimental GitHub project (not a marketplace extension). Decide whether you'll use it as a CLI repo or integrate it into VS Code.
- Portable setup strategy (recommended): Hybrid approach using Dev Containers + Remote SSH + Settings Sync.
  - Dev Containers for consistent local dev (same image on Mac and Proxmox)
  - Remote SSH to Proxmox for remote staging/testing
  - Settings Sync to keep VS Code extensions/settings portable

## Example devcontainer template suggested

```json
{
  "name": "My AI-Assisted Dev Environment",
  "image": "mcr.microsoft.com/devcontainers/universal:latest",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "GitHub.Copilot",
        "tanishqkancharla.opencode-vscode",
        "ms-vscode-remote.remote-containers"
      ]
    }
  },
  "forwardPorts": [3000, 8000, 5432],
  "postCreateCommand": "git config --global user.name 'Your Name' && git config --global user.email 'your@email.com'"
}
```

## Notes & next questions

- Do you want me to create the `.devcontainer` files now using that template?
- Which language/runtime do you primarily work with (Node, Python, Go, etc.) so I can customize the image and features?

---

Saved from VS Code Insiders Copilot chat session stored under `User/globalStorage/emptyWindowChatSessions`.
