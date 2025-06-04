
export interface EnvironmentConfig {
  env: string;
  apiUrl: string;
  appName: string;
  showEnvInHeader: boolean;
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const appName = import.meta.env.VITE_APP_NAME || 'Fandoro ESG Platform';
  
  return {
    env,
    apiUrl,
    appName,
    showEnvInHeader: env !== 'production'
  };
};

export const config = getEnvironmentConfig();
