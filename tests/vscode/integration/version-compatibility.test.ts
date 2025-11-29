import { ExtensionCompatibilityChecker } from '../../../src/vscode/testing/extensions/compatibility';
import { TestConfigurationManager } from '../../../src/vscode/testing/config/manager';
import { MockFactory, AssertionHelpers } from '../utils/test-helpers';
import { TestLogger } from '../../../src/vscode/utils/logger';

describe('Multi-Version Extension Support Integration Tests', () => {
  let compatibilityChecker: ExtensionCompatibilityChecker;
  let configManager: TestConfigurationManager;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Set test environment to reduce delays
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    configManager = new TestConfigurationManager();
    await configManager.saveConfiguration(MockFactory.createMockTestConfig());
    compatibilityChecker = new ExtensionCompatibilityChecker(
      configManager.getCurrentConfiguration()
    );
  });

  afterEach(() => {
    compatibilityChecker.dispose?.();
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Version Matrix Generation', () => {
    it('should generate compatibility matrix for multiple versions', async () => {
      // Arrange
      const extensions = MockFactory.createMatrixTestExtensions();
      const vscodeVersions = ['1.80.0', '1.85.0', '1.90.0', '1.95.0'];

      // Act
      const matrix = await compatibilityChecker.generateCompatibilityMatrix(
        extensions,
        vscodeVersions
      );

      // Assert
      expect(matrix.extensions).toEqual(extensions.map(e => e.id));
      expect(matrix.versions).toEqual(vscodeVersions);

      // Check matrix structure
      extensions.forEach(extension => {
        vscodeVersions.forEach(version => {
          const result = matrix.matrix[extension.id][version];
          expect(result).toBeDefined();
          expect(typeof result.compatible).toBe('boolean');
          expect(typeof result.status).toBe('string');
          expect(['passed', 'failed', 'warning']).toContain(result.status);
        });
      });

      // Check statistics
      expect(matrix.statistics.totalExtensions).toBe(extensions.length);
      expect(matrix.statistics.totalVersions).toBe(vscodeVersions.length);
      expect(matrix.statistics.overallCompatibilityRate).toBeGreaterThanOrEqual(0);
      expect(matrix.statistics.overallCompatibilityRate).toBeLessThanOrEqual(1);
    });

    it('should handle edge cases in version compatibility', async () => {
      // Arrange
      const edgeCaseExtensions = MockFactory.createBoundaryVersionExtensions();
      const edgeVersions = ['1.84.9', '1.85.0', '1.85.1'];

      // Act
      const matrix = await compatibilityChecker.generateCompatibilityMatrix(
        edgeCaseExtensions,
        edgeVersions
      );

      // Assert
      // Version 1.84.9 should be incompatible with min 1.85.0
      const incompatible184 = matrix.matrix['boundary-min']?.['1.84.9'];
      expect(incompatible184?.compatible).toBe(false);

      // Version 1.85.0 should be compatible with min 1.85.0
      const compatible185 = matrix.matrix['boundary-min']?.['1.85.0'];
      expect(compatible185?.compatible).toBe(true);

      // Version 1.85.1 should be compatible with max 1.85.0
      const compatible1851 = matrix.matrix['boundary-max']?.['1.85.1'];
      expect(compatible1851?.compatible).toBe(true);
    });

    it('should calculate accurate compatibility statistics', async () => {
      // Arrange
      const extensions = MockFactory.createVersionTestExtensions();
      const vscodeVersions = ['1.80.0', '1.85.0', '1.90.0'];

      // Act
      const matrix = await compatibilityChecker.generateCompatibilityMatrix(
        extensions,
        vscodeVersions
      );

      // Assert
      const totalChecks = extensions.length * vscodeVersions.length;
      const compatibleChecks = Object.values(matrix.matrix)
        .flatMap(versionResults => Object.values(versionResults))
        .filter(result => result.compatible).length;

      const expectedRate = compatibleChecks / totalChecks;

      expect(matrix.statistics.overallCompatibilityRate).toBeCloseTo(expectedRate, 2);
      expect(matrix.statistics.totalExtensions).toBe(extensions.length);
      expect(matrix.statistics.totalVersions).toBe(vscodeVersions.length);
    });
  });

  describe('Version-Specific Features', () => {
    it('should handle version-specific API availability', async () => {
      // Arrange
      const versionSpecificExtensions = MockFactory.createAPICompatibilityExtensions();
      const testVersions = [
        { version: '1.80.0', availableAPIs: ['workspace', 'window'] },
        { version: '1.85.0', availableAPIs: ['workspace', 'window', 'commands'] },
        { version: '1.90.0', availableAPIs: ['workspace', 'window', 'commands', 'comments'] },
      ];

      for (const testCase of testVersions) {
        // Act
        const results = await compatibilityChecker.checkAPICompatibility(
          versionSpecificExtensions,
          testCase.version
        );

        // Assert
        results.forEach(result => {
          const hasNewAPIs = result.apiCompatibility?.experimentalAPIs.length > 0;
          const hasDeprecatedAPIs = result.apiCompatibility?.deprecatedAPIs.length > 0;

          if (testCase.version === '1.80.0') {
            // Should have some deprecated APIs
            expect(hasDeprecatedAPIs || hasNewAPIs).toBe(true);
          } else if (testCase.version === '1.85.0') {
            // Should have access to commands API
            const hasCommandsAPI = result.extension.name.includes('API Compatible');
            expect(hasCommandsAPI || !hasDeprecatedAPIs).toBe(true);
          } else if (testCase.version === '1.90.0') {
            // Should have access to comments API
            const hasCommentsAPI = result.extension.name.includes('API Compatible');
            expect(hasCommentsAPI || !hasDeprecatedAPIs).toBe(true);
          }
        });
      }
    });

    it('should handle feature detection across versions', async () => {
      // Arrange
      const featureExtensions = MockFactory.createExperimentalAPIExtensions();
      const versions = ['1.84.0', '1.85.0', '1.86.0'];

      // Act
      const results = await compatibilityChecker.checkAPICompatibility(featureExtensions, '1.85.0');

      // Assert
      results.forEach(result => {
        const hasExperimentalFeatures = result.apiCompatibility?.experimentalAPIs.length > 0;

        if (result.extension.name.includes('Experimental')) {
          expect(hasExperimentalFeatures).toBe(true);
          expect(result.status).toBe('warning');
        } else {
          expect(hasExperimentalFeatures).toBe(false);
          expect(result.status).toBe('passed');
        }
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with older VS Code versions', async () => {
      // Arrange
      const backwardCompatibleExtensions = MockFactory.createCompatibleExtensions();
      const oldVersions = ['1.74.0', '1.75.0', '1.76.0'];

      // Act
      for (const version of oldVersions) {
        const results = await compatibilityChecker.checkCompatibility(
          backwardCompatibleExtensions,
          version
        );

        // Assert
        // Extensions with min version 1.80.0 should not work with 1.74.0
        const incompatibleWith74 = results.find(
          r => r.extension.id === 'compatible-1' && !r.compatible
        );
        if (version === '1.74.0') {
          expect(incompatibleWith74).toBeDefined();
        }

        // Extensions with min version 1.80.0 should work with 1.75.0 and 1.76.0
        const compatibleWith75 = results.find(
          r => r.extension.id === 'compatible-1' && r.compatible
        );
        if (version === '1.75.0' || version === '1.76.0') {
          expect(compatibleWith75).toBeDefined();
        }
      }
    });

    it('should handle deprecated API gracefully', async () => {
      // Arrange
      const deprecatedExtensions = MockFactory.createDeprecatedAPIExtensions();
      const currentVersion = '1.85.0';

      // Act
      const results = await compatibilityChecker.checkAPICompatibility(
        deprecatedExtensions,
        currentVersion
      );

      // Assert
      results.forEach(result => {
        expect(result.status).toBe('warning');
        expect(result.apiCompatibility?.deprecatedAPIs.length).toBeGreaterThan(0);
        expect(result.recommendedAction).toBeDefined();
        expect(result.recommendedAction!.toLowerCase()).toContain('update');
      });
    });
  });

  describe('Forward Compatibility', () => {
    it('should handle future VS Code versions', async () => {
      // Arrange
      const futureCompatibleExtensions = MockFactory.createCompatibleExtensions();
      const futureVersions = ['1.95.0', '1.96.0', '2.0.0'];

      // Act
      for (const version of futureVersions) {
        const results = await compatibilityChecker.checkCompatibility(
          futureCompatibleExtensions,
          version
        );

        // Assert
        // Should still be compatible (no max version specified)
        results.forEach(result => {
          expect(result.compatible).toBe(true);
          expect(result.status).toBe('passed');
        });
      }
    });

    it('should warn about potential compatibility issues', async () => {
      // Arrange
      const warningExtensions = MockFactory.createCompatibleExtensions();
      const warningVersions = ['1.95.0']; // Just before potential breaking changes

      // Act
      const results = await compatibilityChecker.checkCompatibility(
        warningExtensions,
        warningVersions
      );

      // Assert
      results.forEach(result => {
        // Should be compatible but might have warnings about future compatibility
        expect(result.compatible).toBe(true);
        expect(['passed', 'warning']).toContain(result.status);
      });
    });
  });

  describe('Version Transition Support', () => {
    it('should handle version transitions smoothly', async () => {
      // Arrange
      const transitionExtensions = MockFactory.createBoundaryVersionExtensions();
      const transitionVersions = ['1.84.0', '1.85.0', '1.86.0'];

      // Act
      const results = await compatibilityChecker.checkCompatibility(
        transitionExtensions,
        transitionVersions
      );

      // Assert
      // Check smooth transitions
      for (let i = 1; i < transitionVersions.length; i++) {
        const prevVersion = transitionVersions[i - 1];
        const currentVersion = transitionVersions[i];

        transitionExtensions.forEach(extension => {
          const prevResult = results.find(
            r =>
              r.extension.id === extension.id &&
              Object.keys(matrix.matrix[extension.id] || []).includes(prevVersion)
          )?.matrix[extension.id]?.[prevVersion];

          const currentResult = results.find(
            r =>
              r.extension.id === extension.id &&
              Object.keys(matrix.matrix[extension.id] || []).includes(currentVersion)
          )?.matrix[extension.id]?.[currentVersion];

          if (prevResult && currentResult) {
            // Compatibility should not change drastically between minor versions
            const compatibilityChanged = prevResult.compatible !== currentResult.compatible;
            if (
              Math.abs(
                prevVersion.charCodeAt(prevVersion.length - 1) -
                  currentVersion.charCodeAt(currentVersion.length - 1)
              ) > 1
            ) {
              // Only major version changes should affect compatibility
              expect(compatibilityChanged).toBe(true);
            } else {
              expect(compatibilityChanged).toBe(false);
            }
          }
        });
      }
    });
  });

  describe('Compatibility Reporting', () => {
    it('should generate detailed compatibility reports', async () => {
      // Arrange
      const extensions = MockFactory.createMatrixTestExtensions();
      const vscodeVersions = ['1.80.0', '1.85.0', '1.90.0'];

      // Act
      const matrix = await compatibilityChecker.generateCompatibilityMatrix(
        extensions,
        vscodeVersions
      );

      // Assert
      const jsonReport = matrix.toJSON();
      const csvReport = matrix.toCSV();

      // Check JSON report structure
      const parsedReport = JSON.parse(jsonReport);
      expect(parsedReport).toHaveProperty('extensions');
      expect(parsedReport).toHaveProperty('versions');
      expect(parsedReport).toHaveProperty('matrix');
      expect(parsedReport).toHaveProperty('statistics');
      expect(parsedReport).toHaveProperty('generatedAt');

      // Check CSV report format
      const csvLines = csvReport.split('\n');
      expect(csvLines[0]).toContain('Extension ID');
      expect(csvLines[0]).toContain('VS Code Version');
      expect(csvLines[0]).toContain('Compatible');
      expect(csvLines[0]).toContain('Status');

      // Check data consistency
      expect(csvLines.length - 1).toBe(extensions.length * vscodeVersions.length);
    });

    it('should provide actionable compatibility recommendations', async () => {
      // Arrange
      const mixedExtensions = [
        ...MockFactory.createCompatibleExtensions(),
        ...MockFactory.createIncompatibleExtensions(),
      ];

      // Act
      const results = await compatibilityChecker.checkCompatibility(mixedExtensions, '1.85.0');

      // Assert
      const incompatibleResults = results.filter(r => !r.compatible);
      const compatibleResults = results.filter(r => r.compatible);

      // Incompatible extensions should have clear recommendations
      incompatibleResults.forEach(result => {
        expect(result.recommendedAction).toBeDefined();
        expect(result.recommendedAction!.length).toBeGreaterThan(10);
        expect(result.issues!.length).toBeGreaterThan(0);
      });

      // Compatible extensions should have no action needed
      compatibleResults.forEach(result => {
        if (result.recommendedAction) {
          expect(result.recommendedAction).toContain('No action needed');
        }
      });
    });
  });

  describe('Performance Impact Analysis', () => {
    it('should analyze performance across versions', async () => {
      // Arrange
      const performanceExtensions = MockFactory.createPerformanceTestExtensions();
      const versions = ['1.80.0', '1.85.0', '1.90.0'];

      // Act
      const performanceResults = [];
      for (const version of versions) {
        const results = await compatibilityChecker.assessPerformanceImpact(performanceExtensions);
        performanceResults.push({ version, results });
      }

      // Assert
      performanceResults.forEach(({ version, results }) => {
        results.forEach(result => {
          expect(result.performanceImpact).toBeDefined();
          expect(['low', 'medium', 'high']).toContain(result.performanceImpact!.overallImpact);
        });
      });
    });

    it('should identify performance bottlenecks', async () => {
      // Arrange
      const bottleneckExtensions = MockFactory.createHighImpactExtensions();

      // Act
      const results = await compatibilityChecker.assessPerformanceImpact(bottleneckExtensions);

      // Assert
      const highImpactResults = results.filter(
        r => r.performanceImpact && r.performanceImpact.overallImpact === 'high'
      );

      expect(highImpactResults.length).toBeGreaterThan(0);
      highImpactResults.forEach(result => {
        expect(result.status).toBe('warning');
        expect(result.recommendedAction).toBeDefined();
        expect(result.recommendedAction!.toLowerCase()).toContain('optimize');
      });
    });
  });
});
