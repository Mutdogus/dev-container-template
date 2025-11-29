# VS Code Container Launch Fix Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-29

## Active Technologies

- **Language**: TypeScript 5.3+ with Node.js 18+
- **Primary Dependencies**: @types/vscode, @docker/extension-api-client, dockerode ^3.3.5
- **Testing**: Mocha + Chai + Sinon
- **Build Tools**: esbuild, @vscode/test-electron

## Project Structure

```text
src/
├── validation/
│   ├── devcontainer-validator.js
│   └── error-formatter.js
├── diagnostics/
│   ├── docker-checker.js
│   ├── network-checker.js
│   └── permission-checker.js
├── recovery/
│   ├── suggestion-engine.js
│   └── fix-templates.js
└── utils/
    ├── logger.js
    └── config-parser.js

tests/
├── unit/
├── integration/
└── fixtures/
    ├── valid-devcontainers/
    └── invalid-devcontainers/
```

## Commands

### Development
```bash
npm run compile          # Compile TypeScript
npm run watch           # Watch for changes
npm run test            # Run tests
npm run test:integration # Run integration tests
```

### VS Code Extension
```bash
npm run package         # Package extension
code --install-extension *.vsix  # Install extension
```

### Docker
```bash
docker version          # Check Docker version
docker system df        # Check disk usage
docker images           # List available images
```

## Code Style

### TypeScript
- Use strict TypeScript checking
- Target ES2021 with CommonJS modules
- Include proper type definitions
- Use interfaces for data models
- Implement proper error handling

### VS Code Extension
- Follow VS Code extension API conventions
- Use proper command registration
- Implement proper error reporting
- Use async/await for asynchronous operations
- Provide user-friendly error messages

### Testing
- Write unit tests for all core functionality
- Use Sinon for mocking VS Code APIs
- Include integration tests for Docker interactions
- Test error scenarios and edge cases
- Maintain high test coverage

## Recent Changes

### Feature 001-fix-container (2025-11-29)
- Added TypeScript 5.3+ with Node.js 18+ for VS Code extension development
- Added Docker integration dependencies (@docker/extension-api-client, dockerode)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
