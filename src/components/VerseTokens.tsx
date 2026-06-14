import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ArabicText } from './ArabicText';
import { classifyVerseTokens, type TokenStatus } from '../services/arabicNormalize';
import type { WordStrength } from '../services/wordStrengthService';
import type { ArabicFontSize } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import type { ThemeTokens } from '../theme/theme';
import { hapticLight } from '../theme/motion';
import { playAyah } from '../services/audio/audioRuntime';
import { wbwAudioUrl } from '../services/audio/audioSource';

interface VerseTokensProps {
  verseText: string;
  targetPosition: number | null;
  knownMap?: Map<string, WordStrength>;
  cloze?: boolean;
  size?: ArabicFontSize;
  surahNumber?: number;
  ayahNumber?: number;
}

const getStatusColors = (theme: ThemeTokens): Record<TokenStatus, string> => ({
  target: theme.sacred.sacred,
  mastered: theme.learningState.mastery,
  strong: theme.learningState.mastery,
  shaky: theme.learningState.learning,
  new: theme.learningState.learning,
  neutral: theme.text.textPrimary,
});

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 6,
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  token: {
    textAlign: 'right',
    textShadowRadius: 0,
  },
  targetToken: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    textShadowColor: theme.sacred.sacred,
    textShadowRadius: 8,
  },
  glowToken: {
    textShadowColor: theme.learningState.mastery,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  clozeBlank: {
    height: 24,
    borderBottomWidth: 2,
    borderBottomColor: theme.action.action,
    marginTop: 8,
    marginBottom: 8,
  },
  targetTokenPressable: {
    padding: 2,
  },
});

const glowingStatuses = new Set<TokenStatus>(['target', 'mastered', 'strong', 'shaky', 'new']);

function clozeWidth(token: string): number {
  return Math.max(34, Math.min(104, token.length * 16));
}

export function VerseTokens({
  verseText,
  targetPosition,
  knownMap,
  cloze = false,
  size = 'small',
  surahNumber,
  ayahNumber,
}: VerseTokensProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const statusColors = React.useMemo(() => getStatusColors(theme), [theme]);
  const emptyKnownMap = React.useMemo(() => new Map<string, WordStrength>(), []);
  const tokens = classifyVerseTokens(verseText, targetPosition, knownMap ?? emptyKnownMap);

  const canPlayWord = surahNumber !== undefined && ayahNumber !== undefined;

  const handlePlayWord = React.useCallback(async () => {
    if (!canPlayWord || targetPosition === null) return;
    await hapticLight();
    const url = wbwAudioUrl(surahNumber, ayahNumber, targetPosition + 1);
    await playAyah(url);
  }, [canPlayWord, surahNumber, ayahNumber, targetPosition]);

  return (
    <View style={styles.container}>
      {tokens.map(({ token, status }, index) => {
        const key = `${token}:${index}`;
        const isTarget = status === 'target' && targetPosition !== null;

        if (cloze && status === 'target') {
          return (
            <View
              key={key}
              accessibilityLabel="blank"
              style={[styles.clozeBlank, { width: clozeWidth(token) }]}
            />
          );
        }

        if (isTarget && canPlayWord) {
          return (
            <Pressable
              key={key}
              onPress={handlePlayWord}
              accessibilityLabel="Play word recitation"
              accessible={true}
              style={styles.targetTokenPressable}
            >
              <ArabicText
                size={size}
                color={statusColors[status]}
                style={[
                  styles.token,
                  glowingStatuses.has(status) ? styles.glowToken : null,
                  status === 'target' ? styles.targetToken : null,
                ]}
              >
                {token}
              </ArabicText>
            </Pressable>
          );
        }

        return (
          <ArabicText
            key={key}
            size={size}
            color={statusColors[status]}
            style={[
              styles.token,
              glowingStatuses.has(status) ? styles.glowToken : null,
              status === 'target' ? styles.targetToken : null,
            ]}
          >
            {token}
          </ArabicText>
        );
      })}
    </View>
  );
}
