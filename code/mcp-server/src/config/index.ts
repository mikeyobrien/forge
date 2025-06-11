// ABOUTME: Main export file for configuration module
// ABOUTME: Re-exports all configuration-related types and functions

import { configuration as configInstance, EnvironmentConfig as EnvConfig } from './environment';
import { isWithinRoot as isWithinRootPath } from './validation';

export {
  EnvironmentConfig,
  ConfigurationError,
  configuration,
  validateDirectory,
  isLogLevel,
  isNodeEnvironment,
} from './environment';

export {
  isWithinRoot,
  validatePathSecurity,
  ensureDirectory,
  fileExists,
  validatePort,
  validateEnvVarName,
  getEnvVar,
  requireEnvVar,
} from './validation';

// Helper function to get the configuration
export function getConfig(): EnvConfig {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return configInstance.get();
}

// Helper function for checking if path is within CONTEXT_ROOT
export function isWithinContextRoot(targetPath: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const config = configInstance.get();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  return isWithinRootPath(targetPath, config.contextRoot);
}
