// Web-only DatabaseProvider.
// Native builds use src/data/DatabaseProvider.tsx

import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeDatabase } from './database.web';
import { computeLongest, computeStreak, useStreakStore } from '../stores/streakStore';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <MigrationGate>{children}</MigrationGate>
  );
}

function MigrationGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    initializeDatabase()
      .then(() => {
        seedStreakStore();
        if (mounted) {
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Database Error: {error.message}</Text>
      </View>
    );
  }

  if (!ready) {
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

function seedStreakStore(): void {
  const state = useStreakStore.getState();
  if (Object.keys(state.activityDates).length > 0) return;

  const today = getLocalDate();
  const activityDates: Record<string, number> = {};
  for (let offset = -4; offset <= 0; offset += 1) {
    activityDates[getLocalDate(offset)] = offset === 0 ? 2 : 1;
  }

  useStreakStore.setState({
    activityDates,
    currentStreak: computeStreak(activityDates, today),
    longestStreak: computeLongest(activityDates),
    graceTokens: 1,
    lastActivityDate: today,
    celebratedMilestones: [],
  });
}

function getLocalDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
