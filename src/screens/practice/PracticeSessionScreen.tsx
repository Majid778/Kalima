import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
  type ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { db } from '../../data/database';
import { getDueCards, gradeCard, DueCard } from '../../services/practiceService';
import { getLocalToday, SM2State, Grade } from '../../services/sm2';
import { AppIcon } from '../../components/AppIcon';
import { Chip } from '../../components/Chip';
import { ArabicText } from '../../components/ArabicText';
import { useStreakStore } from '../../stores/streakStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ayahAudioUrl, getReciterById } from '../../services/audio/audioSource';
import { playAyah, stopAudio } from '../../services/audio/audioRuntime';
import { display, naskh } from '../../theme/typography';
import { mushafPalette } from '../../theme/palette';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type PracticeVerse = DueCard['verses'][number];

const SESSION_LIGHT = '#e9dcb6';
const SESSION_DARK = '#241a0d';
const SESSION_BG = '#221809';
const SESSION_RADIAL_STYLE = Platform.select({
  web: {
    backgroundImage: 'radial-gradient(135% 80% at 50% 0%, #3a2a12, #221809)',
  } as ViewStyle,
  default: null,
});

const SURAH_NAMES: Record<number, string> = {
  1: 'Al-Fatihah',
  2: 'Al-Baqarah',
  3: 'Ali Imran',
  4: 'An-Nisa',
  5: "Al-Ma'idah",
  6: "Al-An'am",
  7: "Al-A'raf",
  8: 'Al-Anfal',
  9: 'At-Tawbah',
  10: 'Yunus',
  11: 'Hud',
  12: 'Yusuf',
  13: "Ar-Ra'd",
  14: 'Ibrahim',
  15: 'Al-Hijr',
  16: 'An-Nahl',
  17: 'Al-Isra',
  18: 'Al-Kahf',
  19: 'Maryam',
  20: 'Taha',
  21: 'Al-Anbiya',
  22: 'Al-Hajj',
  23: "Al-Mu'minun",
  24: 'An-Nur',
  25: 'Al-Furqan',
  26: "Ash-Shu'ara",
  27: 'An-Naml',
  28: 'Al-Qasas',
  29: 'Al-Ankabut',
  30: 'Ar-Rum',
  31: 'Luqman',
  32: 'As-Sajdah',
  33: 'Al-Ahzab',
  34: 'Saba',
  35: 'Fatir',
  36: 'Ya-Sin',
  37: 'As-Saffat',
  38: 'Sad',
  39: 'Az-Zumar',
  40: 'Ghafir',
  41: 'Fussilat',
  42: 'Ash-Shura',
  43: 'Az-Zukhruf',
  44: 'Ad-Dukhan',
  45: 'Al-Jathiyah',
  46: 'Al-Ahqaf',
  47: 'Muhammad',
  48: 'Al-Fath',
  49: 'Al-Hujurat',
  50: 'Qaf',
  51: 'Adh-Dhariyat',
  52: 'At-Tur',
  53: 'An-Najm',
  54: 'Al-Qamar',
  55: 'Ar-Rahman',
  56: "Al-Waqi'ah",
  57: 'Al-Hadid',
  58: 'Al-Mujadilah',
  59: 'Al-Hashr',
  60: 'Al-Mumtahanah',
  61: 'As-Saff',
  62: "Al-Jumu'ah",
  63: 'Al-Munafiqun',
  64: 'At-Taghabun',
  65: 'At-Talaq',
  66: 'At-Tahrim',
  67: 'Al-Mulk',
  68: 'Al-Qalam',
  69: 'Al-Haqqah',
  70: "Al-Ma'arij",
  71: 'Nuh',
  72: 'Al-Jinn',
  73: 'Al-Muzzammil',
  74: 'Al-Muddaththir',
  75: 'Al-Qiyamah',
  76: 'Al-Insan',
  77: 'Al-Mursalat',
  78: 'An-Naba',
  79: "An-Nazi'at",
  80: 'Abasa',
  81: 'At-Takwir',
  82: 'Al-Infitar',
  83: 'Al-Mutaffifin',
  84: 'Al-Inshiqaq',
  85: 'Al-Buruj',
  86: 'At-Tariq',
  87: "Al-A'la",
  88: 'Al-Ghashiyah',
  89: 'Al-Fajr',
  90: 'Al-Balad',
  91: 'Ash-Shams',
  92: 'Al-Layl',
  93: 'Ad-Duha',
  94: 'Ash-Sharh',
  95: 'At-Tin',
  96: 'Al-Alaq',
  97: 'Al-Qadr',
  98: 'Al-Bayyinah',
  99: 'Az-Zalzalah',
  100: 'Al-Adiyat',
  101: "Al-Qari'ah",
  102: 'At-Takathur',
  103: 'Al-Asr',
  104: 'Al-Humazah',
  105: 'Al-Fil',
  106: 'Quraysh',
  107: "Al-Ma'un",
  108: 'Al-Kawthar',
  109: 'Al-Kafirun',
  110: 'An-Nasr',
  111: 'Al-Masad',
  112: 'Al-Ikhlas',
  113: 'Al-Falaq',
  114: 'An-Nas',
};

function formatVerseRef(verse?: PracticeVerse): string {
  if (!verse) return 'Verse context';
  const surahName = SURAH_NAMES[verse.surahNumber] ?? `Surah ${verse.surahNumber}`;
  return `${surahName} · ${verse.surahNumber}:${verse.ayahNumber}`;
}

export function PracticeSessionScreen() {
  const navigation = useNavigation<NavProp>();
  const styles = useMemo(() => makeStyles(), []);
  const reciterId = useSettingsStore((s) => s.reciterId);
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [today] = useState(() => getLocalToday());
  const completionActivityRecordedRef = useRef(false);

  const loadCards = useCallback(async () => {
    try {
      const dueCards = await getDueCards(db, today, 200);
      setCards(dueCards);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    loadCards();

    return () => {
      stopAudio();
    };
  }, [loadCards]);

  const currentCard = cards[currentIndex];
  const currentVerse = currentCard?.verses[0];
  const playCurrentAyah = useCallback(() => {
    if (!currentVerse) return;
    const reciter = getReciterById(reciterId);
    playAyah(ayahAudioUrl(reciter, currentVerse.surahNumber, currentVerse.ayahNumber));
  }, [currentVerse, reciterId]);

  const handleGrade = useCallback(
    async (grade: Grade) => {
      if (!currentCard) return;

      const currentSM2State: SM2State = {
        easeFactor: currentCard.easeFactor,
        interval: currentCard.interval,
        repetitions: currentCard.repetitions,
        status: currentCard.status as SM2State['status'],
      };

      await gradeCard(db, currentCard.id, currentSM2State, grade, today);

      setIsRevealed(false);

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        if (!completionActivityRecordedRef.current) {
          completionActivityRecordedRef.current = true;
          useStreakStore.getState().recordActivity(getLocalToday());
        }
        setIsComplete(true);
      }
    },
    [currentCard, currentIndex, cards.length, today],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, SESSION_RADIAL_STYLE]}>
        <View style={[styles.centered, SESSION_RADIAL_STYLE]}>
          <ActivityIndicator size="large" color={mushafPalette.goldSoft} />
        </View>
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, SESSION_RADIAL_STYLE]}>
        <View style={[styles.centered, SESSION_RADIAL_STYLE]}>
          <Text style={styles.emptyTitle}>No cards due</Text>
          <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
            <Text style={styles.doneButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView style={[styles.safeArea, SESSION_RADIAL_STYLE]}>
        <View style={[styles.centered, SESSION_RADIAL_STYLE]}>
          <Text style={styles.completeTitle}>Practice Complete</Text>
          <Text style={styles.completeSubtitle}>{cards.length} cards reviewed</Text>
          <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const verseRef = formatVerseRef(currentVerse);
  const ayahText = currentVerse?.arabicText ?? currentCard.arabic;
  const translation = currentVerse?.translation ?? '';
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <SafeAreaView style={[styles.safeArea, SESSION_RADIAL_STYLE]}>
      <View style={[styles.container, SESSION_RADIAL_STYLE]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.topIconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron-left" size={22} color={SESSION_LIGHT} />
          </Pressable>

          <Chip label={`${currentIndex + 1} of ${cards.length}`} dark />

          <View style={styles.topIconButton}>
            <AppIcon name="dots" size={22} color={SESSION_LIGHT} />
          </View>
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#dcb04a', '#e9d49a']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>

        <View style={styles.cardStage}>
          <Pressable
            onPress={() => setIsRevealed(true)}
            disabled={isRevealed}
            style={styles.floatingCard}
          >
            <View style={styles.cardHeaderRow}>
              <Pressable
                onPress={playCurrentAyah}
                style={styles.cardIconButton}
                accessibilityRole="button"
                accessibilityLabel="Play ayah audio"
              >
                <AppIcon name="speaker" size={20} color={mushafPalette.muted} />
              </Pressable>
              <Text style={styles.surahRef} numberOfLines={1}>{verseRef}</Text>
              <View style={styles.cardIconButton}>
                <AppIcon name="heart" size={20} color={mushafPalette.muted} />
              </View>
            </View>

            <ArabicText style={styles.ayahText} color={mushafPalette.ink}>
              {ayahText}
            </ArabicText>

            {translation.length > 0 && (
              <Text style={styles.translationText}>{translation}</Text>
            )}

            <View style={styles.divider} />

            <View style={styles.learningSection}>
              <Text style={styles.eyebrow}>{"the word you're learning"}</Text>
              <ArabicText style={styles.targetWord} color={mushafPalette.goldDeep}>
                {currentCard.arabic}
              </ArabicText>
              <Text style={styles.meaningText}>
                {isRevealed ? currentCard.meaning : 'Hidden'}
              </Text>
            </View>
          </Pressable>
        </View>

        {!isRevealed ? (
          <Pressable style={styles.revealButton} onPress={() => setIsRevealed(true)}>
            <Text style={styles.revealButtonText}>Reveal</Text>
          </Pressable>
        ) : (
          <View style={styles.buttonRow}>
            <Pressable style={styles.againButton} onPress={() => handleGrade('again')}>
              <Text style={styles.againButtonText}>Again</Text>
            </Pressable>

            <Pressable style={styles.knewItButtonOuter} onPress={() => handleGrade('good')}>
              <LinearGradient
                colors={['#e9cf83', '#c8973a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.knewItButton}
              >
                <Text style={styles.knewItButtonText}>I knew it</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SESSION_BG,
  },
  container: {
    flex: 1,
    backgroundColor: SESSION_BG,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    backgroundColor: SESSION_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  topIconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  cardStage: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  floatingCard: {
    backgroundColor: mushafPalette.paper,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.4,
    shadowRadius: 48,
    elevation: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahRef: {
    flex: 1,
    color: mushafPalette.ink,
    fontFamily: display.semibold,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  ayahText: {
    color: mushafPalette.ink,
    fontSize: 31,
    lineHeight: 52,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  translationText: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: mushafPalette.goldLine,
    marginTop: 20,
    marginBottom: 16,
  },
  learningSection: {
    alignItems: 'center',
  },
  eyebrow: {
    color: mushafPalette.muted,
    fontFamily: display.semibold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  targetWord: {
    color: mushafPalette.goldDeep,
    fontFamily: naskh.bold,
    fontSize: 26,
    lineHeight: 42,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  meaningText: {
    color: mushafPalette.ink2,
    fontFamily: display.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 4,
  },
  revealButton: {
    backgroundColor: 'rgba(255,255,255,.07)',
    borderWidth: 1,
    borderColor: 'rgba(233,212,154,.22)',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },
  revealButtonText: {
    color: SESSION_LIGHT,
    fontFamily: display.semibold,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  againButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,.07)',
    borderWidth: 1,
    borderColor: 'rgba(233,212,154,.22)',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  againButtonText: {
    color: SESSION_LIGHT,
    fontFamily: display.semibold,
    fontSize: 16,
    fontWeight: '600',
  },
  knewItButtonOuter: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  knewItButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knewItButtonText: {
    color: SESSION_DARK,
    fontFamily: display.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyTitle: {
    color: SESSION_LIGHT,
    fontFamily: display.bold,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  completeTitle: {
    color: SESSION_LIGHT,
    fontFamily: display.bold,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  completeSubtitle: {
    color: SESSION_LIGHT,
    fontFamily: display.regular,
    fontSize: 16,
    marginBottom: 32,
    opacity: 0.78,
  },
  doneButton: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,.07)',
    borderWidth: 1,
    borderColor: 'rgba(233,212,154,.22)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: SESSION_LIGHT,
    fontFamily: display.bold,
    fontSize: 17,
    fontWeight: '700',
  },
});
