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
export async function getConfig(): Promise<EnvConfig> {
  return configInstance.load();
}

// Synchronous version for internal use only (requires config to be loaded first)
export function getConfigSync(): EnvConfig {
  const config = configInstance.getUnsafe();
  if (!config) {
    throw new Error('Configuration not loaded. Call getConfig() first.');
  }
  return config;
}

// Helper function for checking if path is within CONTEXT_ROOT
export function isWithinContextRoot(targetPath: string): boolean {
  const config = configInstance.getUnsafe();
  if (!config) {
    throw new Error('Configuration not loaded. Call getConfig() first.');
  }
  return isWithinRootPath(targetPath, config.contextRoot);
}
