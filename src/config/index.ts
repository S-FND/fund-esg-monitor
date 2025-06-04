
// Dynamic import based on environment
const getEnvironmentConfig = async () => {
  const env = import.meta.env.VITE_APP_ENV || 'dev';
  
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

// For synchronous access, we'll use a static approach
const env = import.meta.env.VITE_APP_ENV || 'dev';

let config: any;

switch (env) {
  case 'stage':
    config = (await import('./env.stage')).config;
    break;
  case 'preprod':
    config = (await import('./env.preprod')).config;
    break;
  case 'prod':
    config = (await import('./env.prod')).config;
    break;
  default:
    config = (await import('./env.dev')).config;
    break;
}

export { config };
export { getEnvironmentConfig };

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
