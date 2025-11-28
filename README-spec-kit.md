# Spec-Kit Setup & Spec-Driven Development Guide

Spec-Kit is GitHub's open-source toolkit for **Spec-Driven Development** — a methodology where specifications become executable, directly generating working implementations rather than just guiding them.

**Key Insight**: Focus on the *what* and *why* first (specification), then define the *how* (technical plan), and finally execute with an AI coding agent.

## Prerequisites

- **Python 3.11+** (on your machine or in dev container)
- **Git** (for version control)
- **uv** package manager (install with `curl -LsSf https://astral.sh/uv/install.sh | sh` or `brew install uv`)
- **Supported AI agent**: OpenCode ✅ (or Claude Code, GitHub Copilot, Cursor, etc.)

## Installation

### Option 1: Persistent Installation (Recommended)

Install the `specify-cli` tool globally so you can use it anywhere:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

Verify installation:

```bash
specify --version
specify check
```

### Option 2: One-time Usage

Run without installing:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init my-project
```

### Upgrade

To upgrade Specify CLI to the latest version:

```bash
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git
```

## Spec-Driven Development Workflow

### Step 1: Initialize a Project

Create a new project or initialize in the current directory:

```bash
# Create new project directory (with interactive prompts)
specify init my-project

# Skip interactive prompts by specifying options directly
specify init my-project --ai opencode --script sh

# Or initialize in current directory
specify init . --ai opencode
# or use --here flag
specify init --here --ai opencode

# Force merge if directory has files (skip confirmation)
specify init . --force --ai opencode
```

#### Interactive Prompts

When you run `specify init` without flags, you'll be prompted to select:

1. **AI Agent** - Choose from: `claude`, `gemini`, `copilot`, `opencode`, `cursor-agent`, `windsurf`, `qwen`, `codex`, and others
   - **For this setup**: Select `opencode`

2. **Script Type** - Choose from: `sh` (bash/zsh) or `ps` (PowerShell)
   - **For macOS/Linux**: Select `sh`
   - **For Windows**: Select `ps`

**Recommended (non-interactive):**

```bash
specify init my-project --ai opencode --script sh
```

The CLI will:
- Create a `.specify/` directory with templates, scripts, and memory storage
- Initialize Git repository (unless `--no-git` flag is used)
- Generate project structure with slash command templates for your AI agent

### Step 2: Establish Project Principles

Open your AI agent (OpenCode) in the project directory:

```bash
cd my-project
opencode
```

Use the slash command:

```
/speckit.constitution Create principles focused on code quality, testing standards, user experience consistency, and performance requirements. Include governance for how these principles should guide technical decisions and implementation choices.
```

This creates `.specify/memory/constitution.md` — your project's foundational guidelines.

### Step 3: Create the Specification

Define what you want to build (focus on *what* and *why*, not *how*):

```
/speckit.specify Build an application that allows users to create photo albums grouped by date, reorder albums via drag-and-drop, and preview photos in a tile interface. Albums are never nested. Photos aren't uploaded anywhere; metadata is stored locally in SQLite.
```

This generates a specification in `specs/001-feature-name/spec.md` with user stories and functional requirements.

### Step 4: Clarify Underspecified Areas (Optional but Recommended)

Before planning, clarify any vague requirements:

```
/speckit.clarify
```

This runs a structured questioning workflow and records answers in a Clarifications section of your spec. You can also follow up with free-form prompts:

```
For each sample project, randomly distribute 5-15 tasks with at least one task in each completion state.
```

### Step 5: Create a Technical Implementation Plan

Now specify your tech stack and architecture:

```
/speckit.plan The application uses Vite with vanilla HTML, CSS, and JavaScript. Images are not uploaded; metadata is stored in a local SQLite database via a REST API.
```

This generates:
- `specs/001-feature-name/plan.md` — implementation plan
- `specs/001-feature-name/data-model.md` — database schema
- `specs/001-feature-name/api-spec.json` — API contracts
- `specs/001-feature-name/research.md` — tech stack research

### Step 6: Analyze for Consistency (Optional)

Validate that spec, plan, and tasks are consistent:

```
/speckit.analyze
```

This checks for cross-artifact consistency and coverage gaps.

### Step 7: Generate Task Breakdown

Break the plan into actionable, ordered tasks:

```
/speckit.tasks
```

This generates `specs/001-feature-name/tasks.md` with:
- Tasks organized by user story
- Dependency management (task ordering)
- Parallel execution markers `[P]`
- Exact file paths for implementation
- Test-driven development structure

### Step 8: Execute Implementation

Run the implementation:

```
/speckit.implement
```

The agent will:
- Validate prerequisites (constitution, spec, plan, tasks)
- Parse and execute tasks in correct order
- Follow TDD approach if specified
- Provide progress updates and error handling

**Important**: The agent will execute local CLI commands (e.g., `npm`, `dotnet`, `python`). Make sure required tools are installed.

## Available Slash Commands

### Core Commands

| Command | Purpose |
|---------|---------|
| `/speckit.constitution` | Create or update project governing principles |
| `/speckit.specify` | Define what you want to build (requirements) |
| `/speckit.clarify` | Clarify underspecified areas (formerly `/quizme`) |
| `/speckit.plan` | Create technical implementation plan with tech stack |
| `/speckit.analyze` | Cross-artifact consistency & coverage analysis |
| `/speckit.tasks` | Generate actionable task lists |
| `/speckit.implement` | Execute all tasks to build the feature |
| `/speckit.checklist` | Generate quality checklists for validation |

## Supported AI Agents

Spec-Kit works with OpenCode ✅ and many others:

- Claude Code ✅
- GitHub Copilot ✅
- Cursor ✅
- Gemini CLI ✅
- Windsurf ✅
- Qwen Code ✅
- Roo Code ✅
- Auggie CLI ✅
- And more...

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SPECIFY_FEATURE` | Override feature detection for non-Git repos. Set to feature directory name (e.g., `001-photo-albums`) |
| `GH_TOKEN` or `GITHUB_TOKEN` | GitHub token for API requests (helpful in corporate environments) |

## Project Structure

After initialization, your project looks like:

```
my-project/
├── .specify/
│   ├── memory/
│   │   └── constitution.md          # Project principles
│   ├── scripts/
│   │   ├── check-prerequisites.sh
│   │   ├── create-new-feature.sh
│   │   ├── setup-plan.sh
│   │   └── update-claude-md.sh
│   └── templates/
│       ├── plan-template.md
│       ├── spec-template.md
│       └── tasks-template.md
├── specs/
│   └── 001-feature-name/
│       ├── spec.md                  # Functional spec
│       ├── plan.md                  # Technical plan
│       ├── tasks.md                 # Task breakdown
│       ├── data-model.md            # Database schema
│       ├── api-spec.json            # API contracts
│       ├── research.md              # Tech research
│       └── quickstart.md            # Quick start guide
├── .git/                            # Git repository
└── README.md                        # Project README
```

## Tips & Best Practices

1. **Be explicit in /speckit.specify**: Focus on *what* and *why*, not implementation details. Example: "Build a Kanban board app" not "Build a Kanban board using React + Redux".

2. **Use /speckit.clarify before planning**: Reduces rework by clarifying ambiguous requirements upfront.

3. **Check prerequisites**: Run `specify check` to verify installed tools match your spec-kit initialization.

4. **Review research.md**: After `/speckit.plan`, review the tech stack research to ensure correct tool versions.

5. **Audit the plan**: Ask your agent to validate the plan for missing pieces before `/speckit.implement`.

6. **Follow TDD patterns**: If tests are requested, they're generated and ordered before implementation.

7. **Use parallel markers**: Tasks marked `[P]` can run in parallel; leverage this for faster development.

## Troubleshooting

### Git Credential Manager on Linux

If Git authentication fails, install Git Credential Manager:

```bash
#!/usr/bin/env bash
set -e
echo "Downloading Git Credential Manager v2.6.1..."
wget https://github.com/git-ecosystem/git-credential-manager/releases/download/v2.6.1/gcm-linux_amd64.2.6.1.deb
echo "Installing Git Credential Manager..."
sudo dpkg -i gcm-linux_amd64.2.6.1.deb
echo "Configuring Git to use GCM..."
git config --global credential.helper manager
echo "Cleaning up..."
rm gcm-linux_amd64.2.6.1.deb
```

### Agent Not Finding Slash Commands

Ensure:
1. You're in the project directory where `specify init` was run
2. The `.specify/` folder exists
3. Your AI agent (OpenCode) is running in that directory
4. Restart the agent if commands don't appear

### Agent Over-Engineering Solutions

Spec-Kit agents can be over-eager. Ask them to:
- Clarify the rationale for added components
- Reference the constitution to ensure alignment
- Simplify over-engineered pieces before `/speckit.implement`

## Resources

- **GitHub Repo**: https://github.com/github/spec-kit
- **Full Methodology**: https://github.com/github/spec-kit/blob/main/spec-driven.md
- **Video Overview**: https://www.youtube.com/watch?v=a9eR1xsfvHg
- **Documentation**: https://github.github.io/spec-kit/

## Next Steps

1. Install `uv` and `specify-cli` using the installation steps above
2. Initialize a test project: `specify init test-project --ai opencode`
3. Open OpenCode in the project directory
4. Try the `/speckit.constitution` command to get started
5. Follow the Spec-Driven Development workflow above

---

*Spec-Kit is an experimental toolkit by GitHub for Spec-Driven Development. Learn more at https://github.com/github/spec-kit*
