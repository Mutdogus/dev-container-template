import { ExtensionLoader } from '../../../src/vscode/testing/extensions/loader';
import { TestConfigurationManager } from '../../../src/vscode/testing/config/manager';
import { MockFactory, AssertionHelpers } from '../utils/test-helpers';
import { TestLogger } from '../../../src/vscode/utils/logger';

describe('Extension Loader', () => {
  let extensionLoader: ExtensionLoader;
  let configManager: TestConfigurationManager;
  let logger: TestLogger;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Set test environment to reduce delays
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    logger = new TestLogger();
    configManager = new TestConfigurationManager();
    await configManager.saveConfiguration(MockFactory.createMockTestConfig());
    extensionLoader = new ExtensionLoader(configManager.getCurrentConfiguration());
  });

  afterEach(() => {
    extensionLoader.dispose?.();
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Extension Loading', () => {
    it('should load valid extensions successfully', async () => {
      // Arrange
      const validExtensions = MockFactory.createValidExtensions();

      // Act
      const results = await extensionLoader.loadExtensions(validExtensions);

      // Assert
      expect(results).toHaveLength(validExtensions.length);
      results.forEach((result, index) => {
        expect(result.status).toBe('loaded');
        expect(result.extension.name).toBe(validExtensions[index].name);
      });
    });

    it('should handle extension loading failures gracefully', async () => {
      // Arrange
      const invalidExtensions = MockFactory.createInvalidExtensions();

      // Act
      const results = await extensionLoader.loadExtensions(invalidExtensions);

      // Assert
      expect(results).toHaveLength(invalidExtensions.length);
      results.forEach((result, index) => {
        if (invalidExtensions[index].shouldFail) {
          expect(result.status).toBe('failed');
          expect(result.error).toContain('Failed to load extension');
        } else {
          expect(result.status).toBe('loaded');
        }
      });
    });

    it('should validate extension dependencies', async () => {
      // Arrange
      const extensionsWithDeps = MockFactory.createExtensionsWithDependencies();

      // Act
      const results = await extensionLoader.loadExtensions(extensionsWithDeps);

      // Assert
      expect(results).toHaveLength(extensionsWithDeps.length);
      const failedResults = results.filter(r => r.status === 'failed');
      expect(failedResults.length).toBeGreaterThan(0);
      failedResults.forEach(result => {
        expect(result.error).toContain('Extension not found');
      });
    });

    it('should measure extension loading performance', async () => {
      // Arrange
      const extensions = MockFactory.createValidExtensions();
      const startTime = Date.now();

      // Act
      await extensionLoader.loadExtensions(extensions);
      const loadingTime = Date.now() - startTime;

      // Assert
      expect(loadingTime).toBeLessThan(30000); // Should load within 30 seconds
    });
  });

  describe('Extension Lifecycle Management', () => {
    it('should activate extensions correctly', async () => {
      // Arrange
      const extensions = MockFactory.createValidExtensions();
      await extensionLoader.loadExtensions(extensions);

      // Act
      const activationResults = await extensionLoader.activateExtensions();

      // Assert
      expect(activationResults).toHaveLength(extensions.length);
      activationResults.forEach(result => {
        AssertionHelpers.assertTestPassed(result);
        expect(result.metrics?.activationTime).toBeGreaterThan(0);
      });
    });

    it('should handle extension activation failures', async () => {
      // Arrange
      const extensions = MockFactory.createExtensionsWithActivationFailure();
      await extensionLoader.loadExtensions(extensions);

      // Act
      const activationResults = await extensionLoader.activateExtensions();

      // Assert
      const failedActivations = activationResults.filter(r => r.status === 'failed');
      expect(failedActivations.length).toBeGreaterThan(0);
      failedActivations.forEach(result => {
        expect(result.error).toContain('Activation failed');
      });
    });

    it('should deactivate extensions cleanly', async () => {
      // Arrange
      const extensions = MockFactory.createValidExtensions();
      await extensionLoader.loadExtensions(extensions);
      await extensionLoader.activateExtensions();

      // Act
      const deactivationResults = await extensionLoader.deactivateExtensions();

      // Assert - only loaded extensions can be deactivated
      const loadedExtensions = extensionLoader
        .getLoadedExtensions()
        .filter(ext => ext.status === 'loaded');
      expect(deactivationResults).toHaveLength(loadedExtensions.length);
      deactivationResults.forEach(result => {
        expect(result.status).toBe('passed');
      });
    });
  });

  describe('Extension Configuration', () => {
    it('should apply extension settings correctly', async () => {
      // Arrange
      const extensions = MockFactory.createExtensionsWithSettings();
      await extensionLoader.loadExtensions(extensions);

      // Act
      const configResults = await extensionLoader.applyExtensionSettings();

      // Assert
      expect(configResults).toHaveLength(extensions.length);
      configResults.forEach(result => {
        expect(result.status).toBe('passed');
      });
    });

    it('should validate extension compatibility with VS Code version', async () => {
      // Arrange
      const extensions = MockFactory.createExtensionsWithVersionRequirements();
      const vscodeVersion = '1.85.0';

      // Load extensions first
      await extensionLoader.loadExtensions(extensions);

      // Act
      const compatibilityResults = await extensionLoader.checkVersionCompatibility(vscodeVersion);

      // Assert
      expect(compatibilityResults).toHaveLength(extensions.length);
      compatibilityResults.forEach(result => {
        if (result.compatible) {
          expect(result.status).toBe('passed');
        } else {
          expect(['failed', 'warning']).toContain(result.status);
        }
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle missing extension files gracefully', async () => {
      // Arrange
      const missingExtensions = MockFactory.createMissingExtensions();

      // Act
      const results = await extensionLoader.loadExtensions(missingExtensions);

      // Assert
      results.forEach(result => {
        expect(result.status).toBe('failed');
        expect(result.error).toContain('Extension not found');
      });
    });

    it('should recover from partial extension loading failures', async () => {
      // Arrange
      const mixedExtensions = [
        ...MockFactory.createValidExtensions(),
        ...MockFactory.createInvalidExtensions(),
      ];

      // Act
      const results = await extensionLoader.loadExtensions(mixedExtensions);

      // Assert
      expect(results).toHaveLength(mixedExtensions.length);
      const passedCount = results.filter(r => r.status === 'loaded').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      expect(passedCount).toBeGreaterThan(0);
      expect(failedCount).toBeGreaterThan(0);
      expect(passedCount + failedCount).toBe(mixedExtensions.length);
    });

    it('should provide detailed error reporting', async () => {
      // Arrange
      const problematicExtensions = MockFactory.createProblematicExtensions();

      // Act
      const results = await extensionLoader.loadExtensions(problematicExtensions);

      // Assert
      const failedResults = results.filter(r => r.status === 'failed');
      failedResults.forEach(result => {
        expect(result.error).toBeDefined();
        expect(result.error?.length).toBeGreaterThan(10);
      });
    });
  });
});
