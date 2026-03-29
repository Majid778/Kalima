import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { ArabicText } from './src/components/ArabicText';
import { colors } from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Kalima — Arabic Rendering Test</Text>

        <Text style={styles.label}>Bismillah (large):</Text>
        <ArabicText size="large" color={colors.primary}>
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
        </ArabicText>

        <Text style={styles.label}>Al-Fatiha verse 2 (medium):</Text>
        <ArabicText size="medium">
          ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَـٰلَمِينَ
        </ArabicText>

        <Text style={styles.label}>Single word (small):</Text>
        <ArabicText size="small">
          ٱللَّهِ
        </ArabicText>

        <Text style={styles.label}>Diacritics stress test — stacked marks:</Text>
        <ArabicText size="medium">
          وَمَآ أَرۡسَلۡنَـٰكَ إِلَّا رَحۡمَةٗ لِّلۡعَـٰلَمِينَ
        </ArabicText>

        <Text style={styles.label}>This label should remain LTR (ARAB-03) ^</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  heading: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  label: { color: colors.textSecondary, fontSize: 14, marginTop: 12 },
});
