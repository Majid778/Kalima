import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ArabicText } from './ArabicText';
import { colors } from '../theme/colors';
import { useSettingsStore } from '../stores/settingsStore';
import { highlightWordInVerse } from '../services/wordService';
import type { WordWithVerses } from '../services/wordService';

interface WordCardProps {
  word: WordWithVerses;
  showFront?: boolean; // false = show only Arabic (flashcard front); default true = show all fields
}

export function WordCard({ word, showFront = true }: WordCardProps) {
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);

  // Arabic word is always shown
  const arabicSection = (
    <View style={styles.arabicContainer}>
      <ArabicText style={styles.arabicWord}>{word.arabic}</ArabicText>
    </View>
  );

  if (!showFront) {
    // Flashcard front: only Arabic word
    return (
      <View style={styles.card}>
        <View style={styles.centeredContent}>{arabicSection}</View>
      </View>
    );
  }

  // Full card: all fields per D-02 order
  const verse = word.verses.length > 0 ? word.verses[0] : null;
  const highlight = verse
    ? highlightWordInVerse(verse.arabicText, verse.wordPosition)
    : null;

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

        <Text style={styles.occurrences}>
          Appears {word.occurrenceCount.toLocaleString()} times
        </Text>

        {verse && (
          <>
            <View style={styles.divider} />

            <View style={styles.verseSection}>
              {highlight ? (
                <Text style={styles.verseText}>
                  {highlight.after.length > 0 && (
                    <ArabicText size="small" style={styles.verseArabicInline}>
                      {highlight.after + ' '}
                    </ArabicText>
                  )}
                  <ArabicText
                    size="small"
                    color={colors.primary}
                    style={styles.verseArabicInline}
                  >
                    {highlight.target}
                  </ArabicText>
                  {highlight.before.length > 0 && (
                    <ArabicText size="small" style={styles.verseArabicInline}>
                      {' ' + highlight.before}
                    </ArabicText>
                  )}
                </Text>
              ) : (
                <ArabicText size="small">{verse.arabicText}</ArabicText>
              )}

              <Text style={styles.verseRef}>
                {verse.surahNumber}:{verse.ayahNumber}
              </Text>

              <Text style={styles.verseTranslation}>{verse.translation}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  meaning: {
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  rootPos: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  occurrences: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  verseSection: {
    width: '100%',
    alignItems: 'center',
  },
  verseText: {
    writingDirection: 'rtl',
    textAlign: 'right',
    width: '100%',
    marginBottom: 8,
  },
  verseArabicInline: {
    textAlign: 'right',
  },
  verseRef: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  verseTranslation: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
