import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Grade } from '../services/sm2';
import { useTheme } from '../theme/useTheme';
import type { ThemeTokens } from '../theme/theme';

interface GradeButtonsProps {
  intervals: Record<Grade, string>;
  onGrade: (grade: Grade) => void;
}

const getGradeConfig = (theme: ThemeTokens): { grade: Grade; label: string; color: string }[] => [
  { grade: 'again', label: 'Again', color: theme.feedback.error },
  { grade: 'hard', label: 'Hard', color: theme.feedback.warning },
  { grade: 'good', label: 'Good', color: theme.action.action },
  { grade: 'easy', label: 'Easy', color: theme.learningState.due },
];

export function GradeButtons({ intervals, onGrade }: GradeButtonsProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const gradeConfig = useMemo(() => getGradeConfig(theme), [theme]);

  const handlePress = (grade: Grade) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGrade(grade);
  };

  return (
    <View style={styles.container}>
      {gradeConfig.map(({ grade, label, color }) => (
        <Pressable
          key={grade}
          style={[styles.button, { backgroundColor: color }]}
          onPress={() => handlePress(grade)}
        >
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.sublabel}>{intervals[grade]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  label: {
    color: theme.text.onAction,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sublabel: {
    color: theme.text.onAction,
    fontSize: 12,
    marginTop: 2,
  },
});
