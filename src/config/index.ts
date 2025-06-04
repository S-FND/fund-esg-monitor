

// Synchronous config loading based on environment
const env = import.meta.env.VITE_APP_ENV || 'dev';

// Import configs synchronously
import { config as devConfig } from './env.dev';
import { config as stageConfig } from './env.stage';
import { config as preprodConfig } from './env.preprod';
import { config as prodConfig } from './env.prod';

const getConfig = () => {
  switch (env) {
    case 'stage':
      return stageConfig;
    case 'preprod':
      return preprodConfig;
    case 'prod':
      return prodConfig;
    default:
      return devConfig;
  }
};

export const config = getConfig();

// Async function for dynamic loading if needed
export const getEnvironmentConfig = async () => {
  try {
    switch (env) {
      case 'stage':
        return (await import('./env.stage')).config;
      case 'preprod':
        return (await import('./env.preprod')).config;
      case 'prod':
        return (await import('./env.prod')).config;
      default:
        return (await import('./env.dev')).config;
    }
  } catch (error) {
    console.warn(`Failed to load environment config for ${env}, falling back to dev`);
    return (await import('./env.dev')).config;
  }
};

// Types for better TypeScript support
export type Environment = 'development' | 'staging' | 'preproduction' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppConfig {
  apiUrl: string;
  environment: Environment;
  supabaseUrl: string;
  supabaseKey: string;
  debug: boolean;
  logLevel: LogLevel;
}

