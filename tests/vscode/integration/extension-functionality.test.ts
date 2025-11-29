import { ExtensionLoader } from '../../../src/vscode/testing/extensions/loader';
import { ExtensionCompatibilityChecker } from '../../../src/vscode/testing/extensions/compatibility';
import { TestConfigurationManager } from '../../../src/vscode/testing/config/manager';
import { MockFactory, AssertionHelpers } from '../utils/test-helpers';
import { TestLogger } from '../../../src/vscode/utils/logger';

describe('Extension Functionality Integration Tests', () => {
  let extensionLoader: ExtensionLoader;
  let compatibilityChecker: ExtensionCompatibilityChecker;
  let configManager: TestConfigurationManager;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Set test environment to reduce delays
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    configManager = new TestConfigurationManager();
    await configManager.saveConfiguration(MockFactory.createMockTestConfig());
    extensionLoader = new ExtensionLoader(configManager.getCurrentConfiguration());
    compatibilityChecker = new ExtensionCompatibilityChecker(
      configManager.getCurrentConfiguration()
    );
  });

  afterEach(() => {
    extensionLoader.dispose?.();
    compatibilityChecker.dispose?.();
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Extension Loading and Activation', () => {
    it('should load and activate extensions successfully', async () => {
      // Arrange
      const extensions = MockFactory.createValidExtensions();

      // Act
      const loadResults = await extensionLoader.loadExtensions(extensions);
      const activationResults = await extensionLoader.activateExtensions();

      // Assert
      expect(loadResults).toHaveLength(extensions.length);
      const successfulLoads = loadResults.filter(r => r.status === 'loaded');
      expect(successfulLoads.length).toBeGreaterThan(0);

      expect(activationResults).toHaveLength(successfulLoads.length);
      activationResults.forEach(result => {
        expect(result.status).toBe('passed');
      });
    });

    it('should handle extension lifecycle correctly', async () => {
      // Arrange
      const extensions = MockFactory.createValidExtensions();

      // Act
      await extensionLoader.loadExtensions(extensions);
      await extensionLoader.activateExtensions();
      await extensionLoader.applyExtensionSettings();
      const deactivationResults = await extensionLoader.deactivateExtensions();

      // Assert
      deactivationResults.forEach(result => {
        expect(result.status).toBe('passed');
      });
    });

    it('should measure extension performance metrics', async () => {
      // Arrange
      const extensions = MockFactory.createPerformanceTestExtensions();

      // Act
      const loadResults = await extensionLoader.loadExtensions(extensions);
      const activationResults = await extensionLoader.activateExtensions();

      // Assert
      const totalLoadTime = loadResults.reduce((sum, r) => sum + (r.loadTime || 0), 0);
      const totalActivationTime = activationResults.reduce((sum, r) => sum + (r.duration || 0), 0);

      expect(totalLoadTime).toBeGreaterThan(0);
      expect(totalActivationTime).toBeGreaterThan(0);

      // Performance should be reasonable
      expect(totalLoadTime).toBeLessThan(10000); // 10 seconds max
      expect(totalActivationTime).toBeLessThan(15000); // 15 seconds max
    });
  });

  describe('Extension Compatibility Integration', () => {
    it('should validate compatibility across multiple VS Code versions', async () => {
      // Arrange
      const extensions = MockFactory.createMatrixTestExtensions();
      const vscodeVersions = ['1.80.0', '1.85.0', '1.90.0'];

      // Act
      const matrix = await compatibilityChecker.generateCompatibilityMatrix(
        extensions,
        vscodeVersions
      );

      // Assert
      expect(matrix.extensions).toEqual(extensions.map(e => e.id));
      expect(matrix.versions).toEqual(vscodeVersions);

      // Check that matrix has results for all combinations
      extensions.forEach(extension => {
        vscodeVersions.forEach(version => {
          const result = matrix.matrix[extension.id][version];
          expect(result).toBeDefined();
          expect(typeof result.compatible).toBe('boolean');
          expect(['passed', 'failed', 'warning']).toContain(result.status);
        });
      });

      // Check statistics
      expect(matrix.statistics.totalExtensions).toBe(extensions.length);
      expect(matrix.statistics.totalVersions).toBe(vscodeVersions.length);
      expect(matrix.statistics.overallCompatibilityRate).toBeGreaterThanOrEqual(0);
      expect(matrix.statistics.overallCompatibilityRate).toBeLessThanOrEqual(1);
    });

    it('should handle complex dependency scenarios', async () => {
      // Arrange
      const extensions = MockFactory.createExtensionsWithComplexDependencies();
      const availableExtensions = MockFactory.createAvailableExtensions();

      // Act
      const dependencyResults = await compatibilityChecker.checkDependencyCompatibility(
        extensions,
        availableExtensions
      );

      // Assert
      expect(dependencyResults).toHaveLength(extensions.length);

      // Should identify dependency issues
      const hasDependencyIssues = dependencyResults.some(
        r => r.issues && r.issues.some(issue => issue.includes('dependency'))
      );
      expect(hasDependencyIssues).toBe(true);
    });

    it('should detect API compatibility issues', async () => {
      // Arrange
      const apiExtensions = MockFactory.createDeprecatedAPIExtensions();
      const vscodeVersion = '1.85.0';

      // Act
      const apiResults = await compatibilityChecker.checkAPICompatibility(
        apiExtensions,
        vscodeVersion
      );

      // Assert
      expect(apiResults).toHaveLength(apiExtensions.length);

      // Should detect deprecated API usage
      const deprecatedResults = apiResults.filter(
        r => r.apiCompatibility && r.apiCompatibility.deprecatedAPIs.length > 0
      );
      expect(deprecatedResults.length).toBeGreaterThan(0);

      deprecatedResults.forEach(result => {
        expect(result.status).toBe('warning');
        expect(result.recommendedAction).toBeDefined();
      });
    });
  });

  describe('Extension Performance Integration', () => {
    it('should assess performance impact accurately', async () => {
      // Arrange
      const extensions = MockFactory.createHighImpactExtensions();

      // Act
      const performanceResults = await compatibilityChecker.assessPerformanceImpact(extensions);

      // Assert
      expect(performanceResults).toHaveLength(extensions.length);

      // Should identify high impact extensions
      const highImpactResults = performanceResults.filter(
        r => r.performanceImpact && r.performanceImpact.overallImpact === 'high'
      );
      expect(highImpactResults.length).toBeGreaterThan(0);

      highImpactResults.forEach(result => {
        expect(result.status).toBe('warning');
        expect(result.recommendedAction).toBeDefined();
        expect(result.recommendedAction!.length).toBeGreaterThan(0);
      });
    });

    it('should provide performance recommendations', async () => {
      // Arrange
      const extensions = [
        ...MockFactory.createPerformanceTestExtensions(),
        ...MockFactory.createHighImpactExtensions(),
      ];

      // Act
      const performanceResults = await compatibilityChecker.assessPerformanceImpact(extensions);

      // Assert
      const extensionsWithRecommendations = performanceResults.filter(
        r => r.recommendedAction && r.recommendedAction!.length > 0
      );
      expect(extensionsWithRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Extension Error Recovery', () => {
    it('should recover from extension loading failures', async () => {
      // Arrange
      const mixedExtensions = [
        ...MockFactory.createValidExtensions(),
        ...MockFactory.createInvalidExtensions(),
      ];

      // Act
      const loadResults = await extensionLoader.loadExtensions(mixedExtensions);

      // Assert
      expect(loadResults).toHaveLength(mixedExtensions.length);

      const successfulLoads = loadResults.filter(r => r.status === 'loaded');
      const failedLoads = loadResults.filter(r => r.status === 'failed');

      expect(successfulLoads.length).toBeGreaterThan(0);
      expect(failedLoads.length).toBeGreaterThan(0);

      // Should continue with successful extensions
      const activationResults = await extensionLoader.activateExtensions();
      expect(activationResults).toHaveLength(successfulLoads.length);
    });

    it('should handle malformed extension data gracefully', async () => {
      // Arrange
      const malformedExtensions = MockFactory.createMalformedExtensions();

      // Act
      const loadResults = await extensionLoader.loadExtensions(malformedExtensions);

      // Assert
      expect(loadResults).toHaveLength(malformedExtensions.length);

      const failedLoads = loadResults.filter(r => r.status === 'failed');
      expect(failedLoads.length).toBeGreaterThan(0);

      failedLoads.forEach(result => {
        expect(result.error).toBeDefined();
        expect(result.error!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Extension Configuration Integration', () => {
    it('should apply extension settings correctly', async () => {
      // Arrange
      const extensions = MockFactory.createExtensionsWithSettings();

      // Act
      await extensionLoader.loadExtensions(extensions);
      const settingsResults = await extensionLoader.applyExtensionSettings();

      // Assert
      expect(settingsResults).toHaveLength(extensions.length);
      settingsResults.forEach(result => {
        expect(result.status).toBe('passed');
      });
    });

    it('should validate extension configuration', async () => {
      // Arrange
      const extensions = MockFactory.createExtensionsWithVersionRequirements();
      const vscodeVersion = '1.85.0';

      // Act
      await extensionLoader.loadExtensions(extensions);
      const compatibilityResults = await extensionLoader.checkVersionCompatibility(vscodeVersion);

      // Assert
      expect(compatibilityResults).toHaveLength(extensions.length);

      const compatibleExtensions = compatibilityResults.filter(r => r.compatible);
      expect(compatibleExtensions.length).toBeGreaterThan(0);
    });
  });

  describe('Extension Resource Management', () => {
    it('should manage memory usage efficiently', async () => {
      // Arrange
      const extensions = MockFactory.createPerformanceTestExtensions();
      const initialMemory = process.memoryUsage().heapUsed;

      // Act
      await extensionLoader.loadExtensions(extensions);
      await extensionLoader.activateExtensions();
      const finalMemory = process.memoryUsage().heapUsed;

      // Assert
      expect(finalMemory).toBeGreaterThan(initialMemory);
      expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    it('should handle resource cleanup properly', async () => {
      // Arrange
      const extensions = MockFactory.createValidExtensions();

      // Act
      await extensionLoader.loadExtensions(extensions);
      await extensionLoader.activateExtensions();
      await extensionLoader.deactivateExtensions();

      // Check resource cleanup
      const loadedExtensionsAfterCleanup = extensionLoader.getLoadedExtensions();
      expect(loadedExtensionsAfterCleanup.length).toBe(0);
    });
  });

  describe('Extension Multi-Version Support', () => {
    it('should support multiple VS Code versions', async () => {
      // Arrange
      const extensions = MockFactory.createVersionTestExtensions();
      const vscodeVersions = ['1.80.0', '1.85.0', '1.90.0'];

      // Act
      const compatibilityMatrix = await compatibilityChecker.generateCompatibilityMatrix(
        extensions,
        vscodeVersions
      );

      // Assert
      expect(compatibilityMatrix.versions).toEqual(vscodeVersions);

      // Each extension should have compatibility info for each version
      extensions.forEach(extension => {
        vscodeVersions.forEach(version => {
          const result = compatibilityMatrix.matrix[extension.id][version];
          expect(result).toBeDefined();
          expect(typeof result.compatible).toBe('boolean');
        });
      });
    });

    it('should handle version-specific features', async () => {
      // Arrange
      const versionSpecificExtensions = MockFactory.createBoundaryVersionExtensions();
      const vscodeVersions = ['1.84.0', '1.85.0', '1.86.0'];

      // Act
      const compatibilityMatrix = await compatibilityChecker.generateCompatibilityMatrix(
        versionSpecificExtensions,
        vscodeVersions
      );

      // Assert
      // Extensions with min version 1.85.0 should not work with 1.84.0
      const incompatibleWith184 = compatibilityMatrix.matrix['boundary-min']?.['1.84.0'];
      expect(incompatibleWith184?.compatible).toBe(false);

      // Extensions with min version 1.85.0 should work with 1.85.0
      const compatibleWith185 = compatibilityMatrix.matrix['boundary-min']?.['1.85.0'];
      expect(compatibleWith185?.compatible).toBe(true);

      // Extensions with max version 1.85.0 should not work with 1.86.0
      const incompatibleWith186 = compatibilityMatrix.matrix['boundary-max']?.['1.86.0'];
      expect(incompatibleWith186?.compatible).toBe(false);
    });
  });

  describe('Extension Reporting and Analytics', () => {
    it('should generate comprehensive extension reports', async () => {
      // Arrange
      const extensions = [
        ...MockFactory.createValidExtensions(),
        ...MockFactory.createInvalidExtensions(),
        ...MockFactory.createPerformanceTestExtensions(),
      ];

      // Act
      const loadResults = await extensionLoader.loadExtensions(extensions);
      const compatibilityResults = await compatibilityChecker.checkCompatibility(
        extensions,
        '1.85.0'
      );
      const performanceResults = await compatibilityChecker.assessPerformanceImpact(extensions);

      // Generate report
      const totalExtensions = extensions.length;
      const successfulLoads = loadResults.filter((r: any) => r.status === 'loaded').length;
      const failedLoads = loadResults.filter((r: any) => r.status === 'failed').length;
      const compatibleExtensions = compatibilityResults.filter((r: any) => r.compatible).length;

      // Assert
      expect(totalExtensions).toBe(extensions.length);
      expect(successfulLoads).toBeGreaterThan(0);
      expect(failedLoads).toBeGreaterThan(0);
      expect(compatibleExtensions).toBeGreaterThan(0);
    });

    it('should export reports in multiple formats', async () => {
      // Arrange
      const extensions = MockFactory.createValidExtensions();
      const loadResults = await extensionLoader.loadExtensions(extensions);

      // Act
      const matrix = await compatibilityChecker.generateCompatibilityMatrix(extensions, ['1.85.0']);

      // Test different export formats
      const jsonExport = matrix.toJSON();
      const csvExport = matrix.toCSV();

      // Assert
      expect(typeof jsonExport).toBe('string');
      expect(JSON.parse(jsonExport)).toBeDefined();

      expect(typeof csvExport).toBe('string');
      expect(csvExport.split('\n').length).toBeGreaterThan(1); // Header + data
    });
  });
});
