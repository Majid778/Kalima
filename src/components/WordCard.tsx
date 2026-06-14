import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ArabicText } from './ArabicText';
import { VerseTokens } from './VerseTokens';
import { RootChips } from './RootChips';
import { useTheme } from '../theme/useTheme';
import type { ThemeTokens } from '../theme/theme';
import { useSettingsStore } from '../stores/settingsStore';
import type { RootSibling, WordWithVerses } from '../services/wordService';
import type { WordStrength } from '../services/wordStrengthService';
import { AyahAudioButton } from './audio/AyahAudioButton';

interface WordCardProps {
  word: WordWithVerses;
  showFront?: boolean; // false = front view; default true = show all learning fields
  knownMap?: Map<string, WordStrength>;
  cloze?: boolean;
  rootSiblings?: RootSibling[];
  onSelectWord?: (wordId: number) => void;
}

type ExampleVerse = WordWithVerses['verses'][number];

export function selectExampleVerses(
  verses: WordWithVerses['verses'],
  maxCount = 3,
): WordWithVerses['verses'] {
  return verses.slice(0, maxCount);
}

function ExampleVerseItem({
  verse,
  knownMap,
  cloze,
}: {
  verse: ExampleVerse;
  knownMap?: Map<string, WordStrength>;
  cloze?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.verseSection}>
      <VerseTokens
        verseText={verse.arabicText}
        targetPosition={verse.wordPosition}
        knownMap={knownMap}
        cloze={cloze}
        size="small"
      />

      <View style={styles.verseRefRow}>
        <Text style={styles.verseRef}>
          {verse.surahNumber}:{verse.ayahNumber}
        </Text>
        <AyahAudioButton
          surahNumber={verse.surahNumber}
          ayahNumber={verse.ayahNumber}
          size={36}
        />
      </View>

      <Text style={styles.verseTranslation}>{verse.translation}</Text>
    </View>
  );
}

export function WordCard({
  word,
  showFront = true,
  knownMap,
  cloze = false,
  rootSiblings,
  onSelectWord,
}: WordCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const exampleVerses = selectExampleVerses(word.verses);
  const hasExampleVerses = exampleVerses.length > 0;

  // Arabic word is always shown
  const arabicSection = (
    <View style={styles.arabicContainer}>
      <ArabicText style={styles.arabicWord}>{word.arabic}</ArabicText>
    </View>
  );

  const verseExamplesSection = hasExampleVerses ? (
    <>
      <View style={styles.divider} />

      <View style={styles.verseList}>
        {exampleVerses.map((exampleVerse, index) => (
          <ExampleVerseItem
            key={`${exampleVerse.surahNumber}:${exampleVerse.ayahNumber}:${exampleVerse.wordPosition ?? 'plain'}:${index}`}
            verse={exampleVerse}
            knownMap={knownMap}
            cloze={cloze}
          />
        ))}
      </View>
    </>
  ) : null;

  if (!showFront) {
    return (
      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            !hasExampleVerses && styles.centeredContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {arabicSection}
          {verseExamplesSection}
        </ScrollView>
      </View>
    );
  }

  // Full card: all fields per D-02 order
  const rootPosText = [
    word.root ? `Root: ${word.root}` : null,
    word.partOfSpeech ?? null,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <View style={styles.card}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {arabicSection}

        {showTransliteration && (
          <Text style={styles.transliteration}>{word.transliteration}</Text>
        )}

        <Text style={styles.meaning}>{word.meaning}</Text>

        {rootPosText.length > 0 && (
          <Text style={styles.rootPos}>{rootPosText}</Text>
        )}

        <RootChips
          root={word.root}
          siblings={rootSiblings ?? []}
          knownMap={knownMap}
          onSelectWord={onSelectWord}
        />

        <Text style={styles.occurrences}>
          Appears {word.occurrenceCount.toLocaleString()} times
        </Text>

        {verseExamplesSection}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.surfaces.surface,
    borderRadius: 12,
    padding: 24,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  arabicContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  arabicWord: {
    textAlign: 'center',
  },
  transliteration: {
    color: theme.text.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  meaning: {
    color: theme.text.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  rootPos: {
    color: theme.text.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  occurrences: {
    color: theme.text.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: theme.surfaces.border,
    marginVertical: 16,
  },
  verseList: {
    width: '100%',
    gap: 16,
  },
  verseSection: {
    width: '100%',
    alignItems: 'center',
  },
  verseRefRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  verseRef: {
    color: theme.text.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  verseTranslation: {
    color: theme.text.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
