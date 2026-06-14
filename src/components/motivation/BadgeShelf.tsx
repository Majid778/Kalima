import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge as BadgePill, Card } from '../ui';
import type { Badge as MotivationBadge } from '../../services/motivation/badges';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

interface BadgeShelfProps {
  badges: MotivationBadge[];
}

export function BadgeShelf({ badges }: BadgeShelfProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (badges.length === 0) {
    return (
      <Card style={styles.emptyCard} testID="badge-shelf-empty">
        <Text style={styles.emptyTitle}>Badges will reflect steady learning</Text>
        <Text style={styles.emptyText}>
          Each return to Qur'anic Arabic is recorded with gratitude.
        </Text>
      </Card>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.shelf}
      testID="badge-shelf"
    >
      {badges.map(badge => (
        <Card key={badge.id} style={styles.tile}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={badge.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={theme.sacred.sacred}
            />
          </View>
          <BadgePill tone="sacred">Earned</BadgePill>
          <Text style={styles.title}>{badge.title}</Text>
          <Text style={styles.description}>{badge.description}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  shelf: {
    gap: 12,
    paddingVertical: 2,
  },
  tile: {
    minHeight: 154,
    width: 172,
  },
  iconWrap: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.surfaces.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    marginBottom: 12,
    width: 36,
  },
  title: {
    color: theme.text.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  description: {
    color: theme.text.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  emptyCard: {
    gap: 6,
  },
  emptyTitle: {
    color: theme.text.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: theme.text.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});