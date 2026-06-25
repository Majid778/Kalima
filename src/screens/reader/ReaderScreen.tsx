import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Chip, EmptyState, Skeleton } from '../../components/ui';
import { AyahAudioButton } from '../../components/audio/AyahAudioButton';
import { VerseTokens } from '../../components/VerseTokens';
import { WordStrengthBadge } from '../../components/WordStrengthBadge';
import { db } from '../../data/database';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { AppIcon } from '../../components/AppIcon';
import { buildKnownWordMap, classifyVerseTokens } from '../../services/arabicNormalize';
import {
  getLearnedWordStatuses,
  getReaderEntries,
  type ReaderEntry,
  type ReaderVerse,
} from '../../services/practiceService';
import { getWordStrength, type StrengthInput } from '../../services/wordStrengthService';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
import { mushafPalette } from '../../theme/palette';
import { display } from '../../theme/typography';

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

  const knownTally = useMemo(() => {
    let known = 0;
    let total = 0;
    for (const entry of entries) {
      const verse = entry.verses[0];
      if (!verse) continue;
      const tokens = classifyVerseTokens(verse.arabicText, verse.wordPosition, knownMap);
      for (const { status } of tokens) {
        total += 1;
        if (status !== 'neutral') known += 1;
      }
    }
    return { known, total };
  }, [entries, knownMap]);

  const firstVerse = entries.find((entry) => entry.verses[0])?.verses[0];

  if (isLoading) {
    return (
      <ReaderShell
        counter="Loading"
        onBack={() => navigation.goBack()}
        styles={styles}
      >
        <ReaderSkeleton styles={styles} />
      </ReaderShell>
    );
  }

  return (
    <ReaderShell
      counter={`${entries.length} ${entries.length === 1 ? 'word' : 'words'}`}
      onBack={() => navigation.goBack()}
      styles={styles}
    >
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
        ListFooterComponent={
          entries.length > 0 && knownTally.total > 0 ? (
            <View style={styles.hintCard}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={mushafPalette.goldDeep} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 16v-4M12 8h.01" />
              </Svg>
              <Text style={styles.hintText}>
                {`Gold words are ones you have learned. ${knownTally.known} of ${knownTally.total} here are known to you.`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={(
          <EmptyState
            title="Your reading path will open here."
            message="Start a session to begin seeing Qur'anic words in context."
            action={{
              label: 'Start a session',
              onPress: () =>
                navigation.navigate('TodaySession'),
            }}
          />
        )}
      />
      {entries.length > 0 && firstVerse ? (
        <Pressable
          style={styles.footer}
          accessibilityRole="button"
          accessibilityLabel="Open the recitation player"
          onPress={() =>
            navigation.navigate('NowPlaying', {
              surahNumber: firstVerse.surahNumber,
              ayahNumber: firstVerse.ayahNumber,
              arabicText: firstVerse.arabicText,
              translation: firstVerse.translation,
            })
          }
        >
          <Text style={styles.footerHint}>Tap to open the player</Text>
          <View style={styles.footerRight}>
            <Text style={styles.footerPosition}>
              {`${entries.length} of ${knownRows.length}`}
            </Text>
            <AyahAudioButton
              surahNumber={firstVerse.surahNumber}
              ayahNumber={firstVerse.ayahNumber}
              size={42}
            />
          </View>
        </Pressable>
      ) : null}
    </ReaderShell>
  );
}

function ReaderShell({
  children,
  counter,
  onBack,
  styles,
}: {
  children: React.ReactNode;
  counter: string;
  onBack: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
            <AppIcon
              name="chevron-left"
              size={22}
              color={mushafPalette.ink}
              strokeWidth={1.8}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.headerTitle}>Reader</Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>Words in context</Text>
          </View>
        </View>
        <Chip tone="sacred">{counter}</Chip>
      </View>
      {children}
    </SafeAreaView>
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
            <WordStrengthBadge strength={strength} />
            <View style={styles.ayahChipRow}>
              {primaryVerse ? (
                <AyahAudioButton
                  surahNumber={primaryVerse.surahNumber}
                  ayahNumber={primaryVerse.ayahNumber}
                  size={32}
                />
              ) : null}
              <Chip tone="sacred" style={styles.ayahChip}>
                {primaryVerse ? verseRef(primaryVerse) : 'No verse'}
              </Chip>
            </View>
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
              <Text style={styles.wordMeta}>{entry.root ? `Root ${entry.root}` : 'Root unavailable'}</Text>

              {remainingVerses.map((verse, index) => (
                <View key={`${verseRef(verse)}:${index}`} style={styles.extraVerse}>
                  <View style={styles.ayahChipRow}>
                    <AyahAudioButton
                      surahNumber={verse.surahNumber}
                      ayahNumber={verse.ayahNumber}
                      size={32}
                    />
                    <Chip tone="sacred" style={styles.ayahChip}>{verseRef(verse)}</Chip>
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
  container: {
    backgroundColor: mushafPalette.parchment,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: mushafPalette.parchment,
    borderBottomColor: mushafPalette.goldLine,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: mushafPalette.ink,
    fontFamily: display.extrabold,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  headerSubtitle: {
    color: mushafPalette.muted,
    fontFamily: display.regular,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  listContent: {
    backgroundColor: mushafPalette.parchment,
    paddingHorizontal: 18,
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
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  rowPressed: {
    backgroundColor: mushafPalette.paper2,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  ayahChipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ayahChip: {
    minHeight: 24,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  wordMeta: {
    color: mushafPalette.muted,
    fontFamily: display.regular,
    fontSize: 12,
    marginTop: 4,
  },
  noVerseText: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  reveal: {
    borderTopColor: mushafPalette.goldLine,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  meaning: {
    color: mushafPalette.ink,
    fontFamily: display.bold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  transliteration: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 4,
  },
  extraVerse: {
    marginTop: 16,
  },
  translation: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  skeletonContainer: {
    backgroundColor: mushafPalette.parchment,
    flex: 1,
    padding: 18,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldLine,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  skeletonLineWide: {
    alignSelf: 'flex-end',
  },
  skeletonLine: {
    alignSelf: 'flex-end',
  },
  hintCard: {
    alignItems: 'center',
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.goldSoft,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  hintText: {
    color: mushafPalette.ink2,
    flex: 1,
    fontFamily: display.regular,
    fontSize: 11.5,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: mushafPalette.parchment,
    borderTopColor: mushafPalette.goldLine,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  footerHint: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 11.5,
  },
  footerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  footerPosition: {
    color: mushafPalette.muted,
    fontFamily: display.regular,
    fontSize: 11,
  },
});
