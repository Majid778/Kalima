import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getLevelProgressList, type LevelProgressView } from '../../services/progressService';
import { colors } from '../../theme/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function QuizHomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [levels, setLevels] = useState<LevelProgressView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLevels = useCallback(async () => {
    try {
      const levelList = await getLevelProgressList(db);
      setLevels(levelList);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadLevels();
    }, [loadLevels]),
  );

  const handleLevelPress = (level: LevelProgressView) => {
    if (!level.unlocked) return;
    navigation.navigate('QuizSession', { levelId: level.id, levelName: level.name });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderLevel = ({ item: level }: { item: LevelProgressView }) => {
    const isLocked = !level.unlocked;
    const bestScorePercent = level.bestQuizScore ? Math.round(level.bestQuizScore * 100) : null;

    return (
      <Pressable
        style={[
          styles.levelCard,
          isLocked && styles.levelCardLocked,
        ]}
        onPress={() => handleLevelPress(level)}
        disabled={isLocked}
      >
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelName}>{level.name}</Text>
            <Text style={styles.wordCount}>{level.wordCount} words</Text>
          </View>
          {isLocked && (
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={24} color={colors.textMuted} />
            </View>
          )}
          {!isLocked && level.completed && (
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
          )}
        </View>

        {!isLocked && bestScorePercent !== null && (
          <View style={styles.scoreBar}>
            <View style={styles.scoreBarBg}>
              <View
                style={[
                  styles.scoreBarFill,
                  { width: `${bestScorePercent}%` },
                  { backgroundColor: bestScorePercent >= 80 ? colors.success : colors.warning },
                ]}
              />
            </View>
            <Text style={styles.scoreText}>{bestScorePercent}%</Text>
          </View>
        )}

        {isLocked && <Text style={styles.lockedText}>Complete the previous level to unlock</Text>}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Mode</Text>
        <Text style={styles.subtitle}>Test your knowledge of each level</Text>
      </View>

      <FlatList
        data={levels}
        renderItem={renderLevel}
        keyExtractor={item => item.id.toString()}
        scrollEnabled={true}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  levelCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelCardLocked: {
    opacity: 0.6,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  wordCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  lockIcon: {
    marginLeft: 12,
  },
  completeIcon: {
    marginLeft: 12,
  },
  scoreBar: {
    marginTop: 8,
  },
  scoreBarBg: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  scoreBarFill: {
    height: '100%',
  },
  scoreText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  lockedText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
