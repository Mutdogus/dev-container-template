<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0 (initial constitution definition)
Modified principles: None (all newly defined)
Added sections: Core Principles, Development Standards, Quality Gates, Governance
Templates requiring updates: 
✅ plan-template.md (Constitution Check section already aligned)
✅ spec-template.md (no constitution-specific constraints)
✅ tasks-template.md (no principle-driven task types needed)
✅ command templates (no outdated references)
Follow-up TODOs: None
-->

# VS Code Container Launch Fix Constitution

## Core Principles

### I. Extension-First Architecture
Every feature starts as a VS Code extension with clear boundaries. Extensions must be self-contained, independently testable, and documented. Clear purpose required - no organizational-only extensions. Each extension should provide value without requiring other extensions.

### II. Diagnostic-Driven Interface
Every extension exposes functionality through diagnostic commands and status reporting. Text-based protocol: commands → structured output → human-readable summaries. Support JSON + human-readable formats for all operations.

### III. Test-First Development (NON-NEGOTIABLE)
TDD mandatory: Tests written → validation criteria defined → tests fail → then implement. Red-Green-Refactor cycle strictly enforced. All container interactions must be tested with mocks.

### IV. Integration Testing
Focus areas requiring integration tests: Container launch workflows, Docker API interactions, VS Code extension host communication, Error recovery scenarios, Cross-platform compatibility.

### V. Observability & Simplicity
Structured logging required for all operations. Performance metrics must be captured for container launches. Start simple, YAGNI principles apply - avoid over-engineering diagnostic solutions.

## Development Standards

### Technology Stack
TypeScript 5.3+ with Node.js 18+ required for all extensions. VS Code Extension API must be used for all editor interactions. Docker operations must use dockerode or official Docker APIs.

### Performance Requirements
Container launch operations must complete within 5 minutes for standard configurations. Restart operations must complete within 30 seconds using cached layers. Error diagnosis must provide actionable guidance within 10 seconds.

### Security Requirements
Docker socket access must be explicitly requested and justified. All user data must remain local unless explicitly exported. Extension permissions must follow principle of least privilege.

## Quality Gates

### Pre-Implementation Requirements
- Constitution compliance check must pass for all plans
- All functional requirements must have measurable success criteria
- Edge cases must be explicitly addressed in specifications
- Performance targets must be defined and testable

### Pre-Release Requirements
- All user stories must be independently testable
- Integration tests must cover Docker API interactions
- Error scenarios must have documented recovery paths
- Performance targets must be validated on target platforms

### Documentation Requirements
- Quickstart guide must enable first-time users within 10 minutes
- API documentation must be complete and accurate
- Troubleshooting guide must cover common failure scenarios
- All public interfaces must have examples

## Governance

### Amendment Process
Constitution supersedes all other practices. Amendments require:
1. Issue documentation describing proposed change
2. Impact analysis on existing features
3. Team review and approval
4. Migration plan for affected artifacts
5. Version bump according to semantic versioning

### Compliance Requirements
All PRs must verify constitution compliance. Complexity must be justified with business value. Use AGENTS.md for runtime development guidance. Quality gates must pass before merge.

### Version Policy
MAJOR: Backward incompatible governance changes or principle removals
MINOR: New principles or materially expanded guidance
PATCH: Clarifications, wording fixes, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2025-11-29 | **Last Amended**: 2025-11-29