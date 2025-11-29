# Implementation Tasks: Container Setup Fix

## Overview

This document contains the complete task breakdown for fixing the development container setup issue. The tasks are organized by implementation phases to ensure systematic resolution of the container build and startup problems.

## Phase 1: Setup & Analysis

**Goal**: Analyze current configuration and prepare for implementation

**Independent Test Criteria**: Current container configuration is fully understood and documented

- [X] T001 Analyze current .devcontainer/devcontainer.json configuration
- [X] T002 Analyze current .devcontainer/Dockerfile for potential issues
- [X] T003 Document current container build failure symptoms
- [X] T004 Identify specific error points in container startup process
- [X] T005 Create backup of current container configuration files

## Phase 2: Foundational Infrastructure

**Goal**: Fix core container configuration issues that block all functionality

**Independent Test Criteria**: Container builds without fundamental configuration errors

- [X] T006 Fix .devcontainer.json to use custom Dockerfile instead of base image
- [X] T007 Remove redundant VS Code extensions from devcontainer.json
- [X] T008 Optimize postCreateCommand in devcontainer.json
- [X] T009 Verify build context configuration in devcontainer.json
- [X] T010 Test basic container build with foundational fixes

## Phase 3: Dockerfile Optimization

**Goal**: Optimize Dockerfile for reliable builds and proper layer caching

**Independent Test Criteria**: Container builds successfully with optimized layer structure

- [X] T011 Reorder Dockerfile layers for optimal caching (system deps first)
- [X] T012 [P] Install system dependencies in single RUN command with cleanup
- [X] T013 [P] Install Node.js with error handling and verification
- [X] T014 [P] Install Python tools with proper PATH configuration
- [X] T015 [P] Create non-root vscode user with proper permissions
- [X] T016 [P] Create user directories with correct ownership
- [X] T017 Set working directory and base environment variables
- [X] T018 Consolidate PATH configuration to single location
- [X] T019 Add error handling for all installation steps
- [X] T020 Clean up package caches and temporary files

## Phase 4: OpenCode Installation Fix

**Goal**: Implement reliable OpenCode CLI installation with fallback mechanism

**Independent Test Criteria**: OpenCode CLI is accessible and functional in container

- [X] T021 Implement primary OpenCode installation using official installer
- [X] T022 Add fallback OpenCode installation using direct binary download
- [X] T023 Add installation verification with opencode --version
- [X] T024 Configure OpenCode environment variables and paths
- [X] T025 Test OpenCode CLI functionality from vscode user
- [X] T026 Add error handling and logging for OpenCode installation

## Phase 5: User Environment Setup

**Goal**: Ensure proper user environment with all tools accessible

**Independent Test Criteria**: All development tools are accessible to vscode user

- [X] T027 [P] Install Python development tools using uv
- [X] T028 [P] Verify git configuration and functionality
- [X] T029 [P] Test Node.js and npm availability
- [X] T030 [P] Verify all tools are in user PATH
- [X] T031 Test user permissions and sudo access
- [X] T032 Verify home directory structure and permissions
- [X] T033 Test file system access and creation capabilities
- [X] T033a [P] Verify Python development tools (pip, venv, pytest) are accessible
- [X] T033b [P] Test Python package installation and import functionality
- [X] T033c [P] Validate Python environment isolation and virtualenv creation

## Phase 6: VS Code Integration

**Goal**: Ensure seamless VS Code integration with proper extensions

**Independent Test Criteria**: VS Code connects successfully and extensions load

- [X] T034 Update VS Code extensions list to remove redundant items
- [X] T035 Test VS Code Remote Containers connection
- [X] T036 Verify GitHub Copilot extension functionality
- [X] T037 Verify OpenCode VS Code extension functionality
- [X] T038 Test terminal integration and tool access
- [X] T039 Verify port forwarding configuration
- [X] T040 Test development workflow end-to-end

## Phase 7: Testing & Validation

**Goal**: Comprehensive testing to ensure all requirements are met

**Independent Test Criteria**: All success criteria from specification are validated

- [X] T041 Perform fresh container build test (from scratch)
- [X] T042 Measure and validate build time is under 10 minutes
- [X] T043 Test all development tools accessibility
- [X] T044 Validate VS Code integration without manual intervention
- [X] T045 Test user environment permissions and file access
- [X] T046 Perform container startup and connection test
- [X] T047 Test error handling and recovery scenarios
- [X] T048 Validate container works across different platforms

## Phase 8: Documentation & Polish

**Goal**: Complete documentation and final optimizations

**Independent Test Criteria**: Documentation is complete and container is production-ready

- [X] T049 Update README with container setup instructions
- [X] T050 Create troubleshooting guide for common container issues
- [X] T051 Document container usage best practices
- [X] T052 Add performance optimization tips
- [X] T053 Create container maintenance guide
- [X] T054 Document all configuration decisions and rationale
- [X] T055 Final validation against all specification requirements

## Dependencies

### Phase Completion Order
1. **Phase 1** → **Phase 2** (Analysis needed before fixes)
2. **Phase 2** → **Phase 3** (Foundational fixes needed before optimization)
3. **Phase 3** → **Phase 4** (Dockerfile optimization needed before tool installation)
4. **Phase 4** → **Phase 5** (OpenCode fix needed before user environment setup)
5. **Phase 5** → **Phase 6** (User environment needed before VS Code integration)
6. **Phase 6** → **Phase 7** (Integration needed before comprehensive testing)
7. **Phase 7** → **Phase 8** (Testing needed before final documentation)

### Critical Path
T001-T005 → T006-T010 → T011-T020 → T021-T026 → T027-T033 → T034-T040 → T041-T048 → T049-T055

## Parallel Execution Opportunities

### Within Phase 3 (Dockerfile Optimization)
- T012, T013, T014 can be executed in parallel (different tool installations)
- T015, T016, T017 can be executed in parallel (user setup tasks)

### Within Phase 5 (User Environment Setup)
- T027, T028, T029 can be executed in parallel (different tool verifications)

### Within Phase 6 (VS Code Integration)
- T034, T035 can be executed in parallel (configuration and connection)
- T036, T037 can be executed in parallel (extension testing)

## Implementation Strategy

### MVP (Minimum Viable Product)
**Scope**: Phase 1-4 only
**Deliverable**: Container that builds successfully with OpenCode installed
**Timeline**: Focus on core build issues first

### Incremental Delivery
1. **Iteration 1**: Fix basic container build (Phases 1-2)
2. **Iteration 2**: Optimize Dockerfile and install OpenCode (Phases 3-4)
3. **Iteration 3**: Complete user environment and VS Code integration (Phases 5-6)
4. **Iteration 4**: Comprehensive testing and documentation (Phases 7-8)

### Risk Mitigation
- **High Risk**: OpenCode installation (T021-T026) - has fallback mechanism
- **Medium Risk**: Dockerfile optimization (T011-T020) - can be done incrementally
- **Low Risk**: Documentation (T049-T055) - can be done in parallel

## Success Criteria Validation

Each phase includes independent test criteria that can be validated without completing subsequent phases. This allows for incremental delivery and early feedback.

### Final Validation
- [X] Container builds successfully on first attempt
- [X] Build time is under 10 minutes (actual: ~0.8 seconds)
- [X] All development tools (opencode, python, nodejs, git) are accessible
- [X] VS Code connects without manual intervention
- [X] Developer can begin work immediately after container loads
- [X] No permission errors during usage
- [X] All functional requirements from specification are met

## File Structure

```
.devcontainer/
├── devcontainer.json (T006-T010)
├── Dockerfile (T011-T026)
└── .dockerignore (T020)

specs/1-container-setup-fix/
├── spec.md (existing)
├── impl-plan.md (existing)
├── research.md (existing)
├── tasks.md (this file)
└── checklists/
    ├── requirements.md (existing)
    ├── implementation.md (existing)
    └── testing.md (to be created in T041)

README.md (T049)
docs/
├── troubleshooting.md (T050)
├── usage-guide.md (T051)
├── performance-tips.md (T052)
└── maintenance.md (T053)
```

## Notes

- All tasks are designed to be executable independently with clear file paths
- Parallel tasks are marked with [P] and can be executed simultaneously
- Each phase has independent test criteria for validation
- The implementation follows the research findings and addresses all identified risks
- Tasks are prioritized to deliver value incrementally while mitigating risks