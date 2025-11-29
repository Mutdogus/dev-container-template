import { DiagnosticLogger, DiagnosticUtils } from '../../../src/vscode/utils/diagnostics';
import { MockFactory } from '../utils/test-helpers';

describe('Diagnostic System', () => {
  let logger: DiagnosticLogger;

  beforeEach(() => {
    logger = DiagnosticLogger.getInstance();
    logger.clearLogs();
  });

  describe('Basic Logging', () => {
    it('should log info messages correctly', () => {
      // Act
      logger.info('Test info message', 'test-source', { key: 'value' });

      // Assert
      const logs = logger.getLogs('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test info message');
      expect(logs[0].source).toBe('test-source');
      expect(logs[0].details).toEqual({ key: 'value' });
    });

    it('should log warning messages correctly', () => {
      // Act
      logger.warning('Test warning message', 'test-source');

      // Assert
      const logs = logger.getLogs('warning');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test warning message');
      expect(logs[0].source).toBe('test-source');
    });

    it('should log error messages correctly', () => {
      // Act
      logger.error('Test error message', 'test-source', { error: 'details' });

      // Assert
      const logs = logger.getLogs('error');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error message');
      expect(logs[0].source).toBe('test-source');
      expect(logs[0].details).toEqual({ error: 'details' });
    });

    it('should log debug messages correctly', () => {
      // Arrange
      const originalDebug = process.env.DEBUG_TESTS;
      process.env.DEBUG_TESTS = 'true';

      // Act
      logger.debug('Test debug message', 'test-source');

      // Assert
      const logs = logger.getLogs('debug');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test debug message');
      expect(logs[0].source).toBe('test-source');

      // Cleanup
      if (originalDebug) {
        process.env.DEBUG_TESTS = originalDebug;
      } else {
        delete process.env.DEBUG_TESTS;
      }
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter logs based on log level', () => {
      // Arrange
      logger.setLogLevel('warning');

      // Act
      logger.info('Info message', 'test');
      logger.warning('Warning message', 'test');
      logger.error('Error message', 'test');

      // Assert
      const allLogs = logger.getLogs();
      expect(allLogs).toHaveLength(2); // Only warning and error
      expect(allLogs.filter(log => log.level === 'info')).toHaveLength(0);
      expect(allLogs.filter(log => log.level === 'warning')).toHaveLength(1);
      expect(allLogs.filter(log => log.level === 'error')).toHaveLength(1);
    });
  });

  describe('Log Statistics', () => {
    it('should provide accurate log statistics', () => {
      // Act
      logger.info('Info message', 'test');
      logger.warning('Warning message', 'test');
      logger.error('Error message', 'test');
      logger.error('Another error', 'test');

      // Assert
      expect(logger.getErrorCount()).toBe(2);
      expect(logger.getWarningCount()).toBe(1);
      expect(logger.hasErrors()).toBe(true);
      expect(logger.hasWarnings()).toBe(true);
    });

    it('should export logs to JSON', () => {
      // Arrange
      logger.info('Test message', 'test', { data: 'value' });

      // Act
      const exported = logger.exportLogs();

      // Assert
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test message');
      expect(parsed[0].details).toEqual({ data: 'value' });
    });
  });

  describe('Log Management', () => {
    it('should clear logs correctly', () => {
      // Arrange
      logger.info('Test message', 'test');
      expect(logger.getLogs()).toHaveLength(1);

      // Act
      logger.clearLogs();

      // Assert
      expect(logger.getLogs()).toHaveLength(0);
    });
  });
});

describe('Diagnostic Utils', () => {
  let logger: DiagnosticLogger;

  beforeEach(() => {
    logger = DiagnosticLogger.getInstance();
    logger.clearLogs();
  });

  describe('Test Logging Utilities', () => {
    it('should log test start correctly', () => {
      // Act
      DiagnosticUtils.logTestStart('test-name', { detail: 'value' });

      // Assert
      const logs = logger.getLogs('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Starting test: test-name');
      expect(logs[0].source).toBe('test-runner');
      expect(logs[0].details).toEqual({ detail: 'value' });
    });

    it('should log test end correctly', () => {
      // Act
      DiagnosticUtils.logTestEnd('test-name', 1500, true);

      // Assert
      const logs = logger.getLogs('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test test-name PASSED in 1500ms');
      expect(logs[0].source).toBe('test-runner');
      expect(logs[0].details).toEqual({ duration: 1500, passed: true });
    });
  });

  describe('Container Logging Utilities', () => {
    it('should log container actions correctly', () => {
      // Act
      DiagnosticUtils.logContainerAction('started', 'container-123', { image: 'test-image' });

      // Assert
      const logs = logger.getLogs('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Container started: container-123');
      expect(logs[0].source).toBe('container');
      expect(logs[0].details).toEqual({ image: 'test-image' });
    });
  });

  describe('Extension Logging Utilities', () => {
    it('should log extension actions correctly', () => {
      // Act
      DiagnosticUtils.logExtensionAction('loaded', 'ext-123', { version: '1.0.0' });

      // Assert
      const logs = logger.getLogs('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Extension loaded: ext-123');
      expect(logs[0].source).toBe('extension');
      expect(logs[0].details).toEqual({ version: '1.0.0' });
    });
  });

  describe('Performance Logging Utilities', () => {
    it('should log performance metrics correctly', () => {
      // Act
      DiagnosticUtils.logPerformanceMetric('memory', 1024, 'MB');

      // Assert
      const logs = logger.getLogs('info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Performance: memory = 1024MB');
      expect(logs[0].source).toBe('performance');
      expect(logs[0].details).toEqual({ metric: 'memory', value: 1024, unit: 'MB' });
    });
  });

  describe('Error Logging Utilities', () => {
    it('should log errors with context correctly', () => {
      // Arrange
      const testError = new Error('Test error message');

      // Act
      DiagnosticUtils.logError(testError, 'test-context', { additional: 'info' });

      // Assert
      const logs = logger.getLogs('error');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('test-context: Test error message');
      expect(logs[0].source).toBe('test-context');
      expect(logs[0].details).toEqual({
        error: 'Test error message',
        stack: expect.any(String),
        additional: 'info',
      });
    });
  });
});
