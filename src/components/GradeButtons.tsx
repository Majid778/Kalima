import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Grade } from '../services/sm2';
import { colors } from '../theme/colors';

interface GradeButtonsProps {
  intervals: Record<Grade, string>;
  onGrade: (grade: Grade) => void;
}

const GRADE_CONFIG: { grade: Grade; label: string; color: string }[] = [
  { grade: 'again', label: 'Again', color: colors.error },
  { grade: 'hard', label: 'Hard', color: colors.warning },
  { grade: 'good', label: 'Good', color: colors.primary },
  { grade: 'easy', label: 'Easy', color: '#3b82f6' },
];

export function GradeButtons({ intervals, onGrade }: GradeButtonsProps) {
  const handlePress = (grade: Grade) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGrade(grade);
  };

  return (
    <View style={styles.container}>
      {GRADE_CONFIG.map(({ grade, label, color }) => (
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

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sublabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
});
