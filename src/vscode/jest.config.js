module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/vscode'],
  testMatch: [
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/vscode/**/*.{ts,tsx}'
  ],
  coverageDirectory: '<rootDir>/coverage/vscode',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/vscode/setup.ts']
};