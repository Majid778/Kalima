import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, EmptyState, Skeleton } from '../../components/ui';
import { AyahAudioButton } from '../../components/audio/AyahAudioButton';
import { VerseTokens } from '../../components/VerseTokens';
import { WordStrengthBadge } from '../../components/WordStrengthBadge';
import { db } from '../../data/database';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { buildKnownWordMap } from '../../services/arabicNormalize';
import {
  getLearnedWordStatuses,
  getReaderEntries,
  type ReaderEntry,
  type ReaderVerse,
} from '../../services/practiceService';
import { getWordStrength, type StrengthInput } from '../../services/wordStrengthService';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function toProgressStatus(status: string): StrengthInput['status'] {
  if (status === 'new' || status === 'learning' || status === 'review') {
    return status;
  }

  return 'review';
}

function strengthForEntry(entry: ReaderEntry) {
  return getWordStrength({
    status: toProgressStatus(entry.status),
    interval: entry.interval,
    repetitions: entry.repetitions,
  });
}

function verseRef(verse: ReaderVerse): string {
  return `${verse.surahNumber}:${verse.ayahNumber}`;
}

export function ReaderScreen() {
  const navigation = useNavigation<NavProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [entries, setEntries] = useState<ReaderEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWordIds, setExpandedWordIds] = useState<Set<number>>(() => new Set());
  const [knownRows, setKnownRows] = useState<Awaited<ReturnType<typeof getLearnedWordStatuses>>>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadReader() {
      try {
        const [readerEntries, learnedRows] = await Promise.all([
          getReaderEntries(db),
          getLearnedWordStatuses(db),
        ]);

        if (!isMounted) return;
        setEntries(readerEntries);
        setKnownRows(learnedRows);
      } catch (error) {
        console.error('Failed to load reader entries:', error);
        if (isMounted) {
          setEntries([]);
          setKnownRows([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReader();

    return () => {
      isMounted = false;
    };
  }, []);

  const knownMap = useMemo(() => buildKnownWordMap(knownRows), [knownRows]);

  const toggleExpanded = (wordId: number) => {
    setExpandedWordIds((current) => {
      const next = new Set(current);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  if (isLoading) {
    return <ReaderSkeleton styles={styles} />;
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(entry) => String(entry.wordId)}
      renderItem={({ item }) => (
        <ReaderRow
          entry={item}
          expanded={expandedWordIds.has(item.wordId)}
          knownMap={knownMap}
          onPress={() => toggleExpanded(item.wordId)}
          styles={styles}
        />
      )}
      contentContainerStyle={[
        styles.listContent,
        entries.length === 0 ? styles.emptyListContent : null,
      ]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={(
        <EmptyState
          title="Your reading path will open here."
          message="Start a session to begin seeing Qur'anic words in context."
          action={{
            label: 'Start a session',
            onPress: () =>
              navigation.navigate('Tabs', { screen: 'Today' } as never),
          }}
        />
      )}
    />
  );
}

function ReaderSkeleton({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2, 3].map((index) => (
        <Card key={index} style={styles.skeletonCard}>
          <Skeleton height={28} width="84%" style={styles.skeletonLineWide} />
          <Skeleton height={24} width="64%" style={styles.skeletonLine} />
          <Skeleton height={16} width={88} />
        </Card>
      ))}
    </View>
  );
}

function ReaderRow({
  entry,
  expanded,
  knownMap,
  onPress,
  styles,
}: {
  entry: ReaderEntry;
  expanded: boolean;
  knownMap: Map<string, ReturnType<typeof getWordStrength>>;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const primaryVerse = entry.verses[0];
  const remainingVerses = entry.verses.slice(1);
  const strength = strengthForEntry(entry);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      {({ pressed }) => (
        <Card style={[styles.row, pressed ? styles.rowPressed : null]}>
          <View style={styles.rowHeader}>
            <View style={styles.referenceBlock}>
              <View style={styles.referenceLine}>
                <Text style={styles.reference}>
                  {primaryVerse ? verseRef(primaryVerse) : 'No verse'}
                </Text>
                {primaryVerse ? (
                  <AyahAudioButton
                    surahNumber={primaryVerse.surahNumber}
                    ayahNumber={primaryVerse.ayahNumber}
                    size={36}
                  />
                ) : null}
              </View>
              <Text style={styles.wordMeta}>{entry.root ? `Root ${entry.root}` : 'Root unavailable'}</Text>
            </View>
            <WordStrengthBadge strength={strength} />
          </View>

          {primaryVerse ? (
            <VerseTokens
              verseText={primaryVerse.arabicText}
              targetPosition={primaryVerse.wordPosition}
              knownMap={knownMap}
              size="medium"
              surahNumber={primaryVerse.surahNumber}
              ayahNumber={primaryVerse.ayahNumber}
            />
          ) : (
            <Text style={styles.noVerseText}>No example verse is available for this word yet.</Text>
          )}

          {expanded && (
            <View style={styles.reveal}>
              <Text style={styles.meaning}>{entry.meaning}</Text>
              <Text style={styles.transliteration}>{entry.transliteration}</Text>

              {remainingVerses.map((verse, index) => (
                <View key={`${verseRef(verse)}:${index}`} style={styles.extraVerse}>
                  <View style={styles.referenceLine}>
                    <Text style={styles.reference}>{verseRef(verse)}</Text>
                    <AyahAudioButton
                      surahNumber={verse.surahNumber}
                      ayahNumber={verse.ayahNumber}
                      size={36}
                    />
                  </View>
                  <VerseTokens
                    verseText={verse.arabicText}
                    targetPosition={verse.wordPosition}
                    knownMap={knownMap}
                    size="small"
                    surahNumber={verse.surahNumber}
                    ayahNumber={verse.ayahNumber}
                  />
                  <Text style={styles.translation}>{verse.translation}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}
    </Pressable>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  listContent: {
    backgroundColor: theme.surfaces.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 12,
  },
  row: {
    padding: 16,
  },
  rowPressed: {
    backgroundColor: theme.surfaces.surfaceElevated,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  referenceBlock: {
    flex: 1,
  },
  referenceLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  reference: {
    color: theme.action.action,
    fontSize: 13,
    fontWeight: '700',
  },
  wordMeta: {
    color: theme.text.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  noVerseText: {
    color: theme.text.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  reveal: {
    borderTopColor: theme.surfaces.border,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  meaning: {
    color: theme.text.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  transliteration: {
    color: theme.text.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 4,
  },
  extraVerse: {
    marginTop: 16,
  },
  translation: {
    color: theme.text.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  skeletonContainer: {
    backgroundColor: theme.surfaces.background,
    flex: 1,
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    gap: 12,
  },
  skeletonLineWide: {
    alignSelf: 'flex-end',
  },
  skeletonLine: {
    alignSelf: 'flex-end',
  },
});
