import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { getLevelProgressList, type LevelProgressView } from '../../services/progressService';
import { db } from '../../data/database';
import { colors } from '../../theme/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function LevelListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [levels, setLevels] = useState<LevelProgressView[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLevels = useCallback(async () => {
    try {
      const data = await getLevelProgressList(db);
      setLevels(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLevels();
    }, [loadLevels]),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: LevelProgressView }) => {
    const coverageText = (item.cumulativeCoverage * 100).toFixed(1) + '%';
    const bestScore = item.bestQuizScore === null
      ? null
      : `Best ${Math.round(item.bestQuizScore * 100)}%`;

    return (
      <TouchableOpacity
        style={[styles.row, !item.unlocked && styles.rowLocked]}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('WordCard', {
            levelId: item.id,
            levelName: item.name,
          })
        }
      >
        <View style={styles.levelNumber}>
          <Text style={styles.levelNumberText}>{item.id}</Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.levelName}>{item.name}</Text>
          <Text style={styles.wordCount}>{item.wordCount} words</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.coverage}>{coverageText}</Text>
          {item.completed ? (
            <View style={styles.status}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              {bestScore && <Text style={styles.bestScore}>{bestScore}</Text>}
            </View>
          ) : !item.unlocked ? (
            <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={levels}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  rowLocked: {
    opacity: 0.6,
  },
  levelNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelNumberText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
  },
  levelName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  wordCount: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  meta: {
    alignItems: 'flex-end',
    marginLeft: 12,
    gap: 4,
  },
  coverage: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestScore: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
