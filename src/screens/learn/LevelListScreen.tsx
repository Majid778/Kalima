import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { getLevels } from '../../services/wordService';
import { db } from '../../data/database';
import { colors } from '../../theme/colors';

type Level = {
  id: number;
  name: string;
  wordCount: number;
  cumulativeCoverage: number;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function LevelListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getLevels(db);
        if (mounted) {
          setLevels(data as Level[]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Level }) => {
    const coverageText = (item.cumulativeCoverage * 100).toFixed(1) + '%';

    return (
      <TouchableOpacity
        style={styles.row}
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
        <Text style={styles.coverage}>{coverageText}</Text>
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
  coverage: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
