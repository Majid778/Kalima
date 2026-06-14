import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ArabicText } from './ArabicText';
import { classifyVerseTokens, type TokenStatus } from '../services/arabicNormalize';
import type { WordStrength } from '../services/wordStrengthService';
import type { ArabicFontSize } from '../theme/typography';
import { useTheme } from '../theme/useTheme';
import type { ThemeTokens } from '../theme/theme';

interface VerseTokensProps {
  verseText: string;
  targetPosition: number | null;
  knownMap?: Map<string, WordStrength>;
  cloze?: boolean;
  size?: ArabicFontSize;
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
}: VerseTokensProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const statusColors = React.useMemo(() => getStatusColors(theme), [theme]);
  const emptyKnownMap = React.useMemo(() => new Map<string, WordStrength>(), []);
  const tokens = classifyVerseTokens(verseText, targetPosition, knownMap ?? emptyKnownMap);

  return (
    <View style={styles.container}>
      {tokens.map(({ token, status }, index) => {
        const key = `${token}:${index}`;

        if (cloze && status === 'target') {
          return (
            <View
              key={key}
              accessibilityLabel="blank"
              style={[styles.clozeBlank, { width: clozeWidth(token) }]}
            />
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