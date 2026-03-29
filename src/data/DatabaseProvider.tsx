import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import migrations from './drizzle/migrations';
import { db } from './database';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider
      databaseName="kalima.db"
      assetSource={{ assetId: require('../../assets/db/kalima.db') }}
      options={{ enableChangeListener: true }}
    >
      <MigrationGate>{children}</MigrationGate>
    </SQLiteProvider>
  );
}

function MigrationGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Database Error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center', padding: 20 },
});
