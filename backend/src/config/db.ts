import mongoose from 'mongoose';
import config from './environment';

export type DatabaseStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'not_configured'
  | 'error';

let isConnecting = false;

/**
 * Get current database connection status
 */
export function getDatabaseStatus(): DatabaseStatus {
  if (!config.mongoUri || config.mongoUri.trim() === '') {
    return 'not_configured';
  }

  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnected';
    case 0:
    default:
      return isConnecting ? 'connecting' : 'disconnected';
  }
}

/**
 * Initialize MongoDB connection via Mongoose
 * Gracefully handles missing URI without throwing fatal errors.
 */
export async function connectDB(): Promise<boolean> {
  const uri = config.mongoUri;

  if (!uri || uri.trim() === '') {
    console.log('[Database] MONGODB_URI not configured. Operating in zero-db mode.');
    return false;
  }

  // Prevent multiple connection attempts if already connected or connecting
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  try {
    isConnecting = true;
    console.log('[Database] Connecting to MongoDB...');

    // Event listeners
    mongoose.connection.on('connected', () => {
      console.log('[Database] Successfully connected to MongoDB.');
      isConnecting = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err.message);
      isConnecting = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[Database] MongoDB disconnected.');
      isConnecting = false;
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    return true;
  } catch (error: any) {
    isConnecting = false;
    console.error('[Database] Failed to connect to MongoDB:', error.message);
    // Non-fatal: server continues running even if connection fails
    return false;
  }
}

/**
 * Gracefully close MongoDB connection
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Mongoose disconnected gracefully.');
  }
}
