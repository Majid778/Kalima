import { Platform } from 'react-native';
import * as schema from './schema';

let db: any;

if (Platform.OS !== 'web') {
  const { drizzle } = require('drizzle-orm/expo-sqlite');
  const { openDatabaseSync } = require('expo-sqlite');
  const expo = openDatabaseSync('kalima.db', { enableChangeListener: true });
  db = drizzle(expo, { schema });
}

export { db };
