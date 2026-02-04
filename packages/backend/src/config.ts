/**
 * Configuration module - MUST be imported first before any other modules
 * that depend on environment variables.
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from monorepo root - search upward from cwd
function findEnvFile(): string | undefined {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    dir = path.dirname(dir);
  }
  return undefined;
}

const envPath = findEnvFile();
if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`[Config] Loaded environment from ${envPath}`);
} else {
  console.warn('[Config] No .env file found');
}

// Export configuration values
export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  finnhubApiKey: process.env.FINNHUB_API_KEY ?? '',
  useRealData: process.env.USE_REAL_DATA === 'true',
  jobProcessingInterval: parseInt(process.env.JOB_PROCESSING_INTERVAL ?? '60000', 10),
};

console.log(`[Config] USE_REAL_DATA=${config.useRealData}, FINNHUB_API_KEY=${config.finnhubApiKey ? 'set' : 'not set'}`);
