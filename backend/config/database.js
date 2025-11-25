import dotenv from 'dotenv';
// Load environment variables FIRST before creating the pool
dotenv.config();

import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const buildSslConfig = () => {
  if (process.env.DB_SSL !== 'true') {
    return false;
  }

  const sslConfig = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  const caPath = process.env.DB_CA_CERT_PATH;
  if (caPath) {
    try {
      sslConfig.ca = fs.readFileSync(path.resolve(caPath)).toString();
    } catch (error) {
      logger.warn(`Unable to read DB_CA_CERT_PATH (${caPath}): ${error.message}`);
    }
  }

  // For cloud databases, allow more lenient SSL if no CA cert is provided
  if (!caPath && process.env.DB_SSL === 'true') {
    sslConfig.rejectUnauthorized = false;
  }

  return sslConfig;
};

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'mentor_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: buildSslConfig(),
});

// Handle pool errors - don't exit, just log and try to recover
pool.on('error', (err, client) => {
  logger.error('Database pool error (non-fatal)', err);
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('Database connected successfully', { timestamp: result.rows[0].now });
    client.release();
    return true;
  } catch (err) {
    logger.error('Database connection failed', err);
    return false;
  }
};

// Query helper function
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        duration,
        query: text.substring(0, 100),
        params: params ? params.length : 0
      });
    }
    
    return res;
  } catch (error) {
    logger.error('Database query error', error, {
      query: text.substring(0, 100),
      params: params ? params.length : 0
    });
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export { pool };

