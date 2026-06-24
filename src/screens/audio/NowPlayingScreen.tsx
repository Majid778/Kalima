import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, Circle, Path } from 'react-native-svg';
import { AppIcon } from '../../components/AppIcon';
import { ArabicText } from '../../components/ArabicText';
import { useAudioPlayback, playAyah } from '../../services/audio/audioRuntime';
import { getReciterById, ayahAudioUrl } from '../../services/audio/audioSource';
import { useSettingsStore } from '../../stores/settingsStore';
import { display } from '../../theme/typography';

/**
 * Route params for the pushed Now Playing screen.
 * The orchestrator registers `NowPlaying` in RootStackParamList; this type
 * documents the shape the screen reads so it compiles standalone.
 */
export type NowPlayingParams = {
  surahNumber: number;
  ayahNumber: number;
  surahName?: string;
  arabicText?: string;
  translation?: string;
  highlightToken?: string;
};

// Dark Mushaf hero stops from the mockup (locked hex).
const BG_TOP = '#2a2415';
const BG_BOTTOM = '#1c180e';
const HALO_INNER = '#3a3018';
const HALO_OUTER = '#211c10';
const RING_FROM = '#e7d29a';
const RING_TO = '#946c10';
const GOLD_TEXT = '#f3ead4';
const GOLD_SUBTLE = '#bca875';
const GOLD_LABEL = '#cdb87f';
const GOLD_BRIGHT = '#f0d98a';
const GOLD_DISC = '#b8860b';
const CARD_BG = 'rgba(243,234,212,0.05)';
const CARD_BORDER = 'rgba(231,210,154,0.22)';
const SCRUBBER_BG = 'rgba(231,210,154,0.16)';
const HIGHLIGHT_BG = 'rgba(184,134,11,0.45)';

// Default ayah used when the route hands us nothing real (web / preview / no params).
const FALLBACK_ARABIC = 'أُو۟لَـٰئِكَ عَلَىٰ هُدًۭى مِّن رَّبِّهِمْ';
const FALLBACK_HIGHLIGHT = 'هُدًۭى';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function NowPlayingScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, NowPlayingParams | undefined>, string>>();
  const params = route.params;

  const surahNumber = params?.surahNumber ?? 2;
  const ayahNumber = params?.ayahNumber ?? 5;
  const surahName = params?.surahName ?? `Surah ${surahNumber}`;

  // Prefer the real ayah handed in by the caller (e.g. the Reader); fall back to
  // a representative verse only when nothing was passed (web preview / no params).
  const usingFallback = !params?.arabicText;
  const ayahText = params?.arabicText ?? FALLBACK_ARABIC;
  const highlight = params?.highlightToken ?? (usingFallback ? FALLBACK_HIGHLIGHT : undefined);
  const glossWord = usingFallback ? 'hudan' : undefined;
  const glossMeaning = usingFallback ? 'guidance' : params?.translation;
  const ayahSegments: [string, string, string] =
    highlight && ayahText.includes(highlight)
      ? [
          ayahText.slice(0, ayahText.indexOf(highlight)),
          highlight,
          ayahText.slice(ayahText.indexOf(highlight) + highlight.length),
        ]
      : [ayahText, '', ''];

  const reciterId = useSettingsStore((s) => s.reciterId);
  const reciter = useMemo(() => getReciterById(reciterId), [reciterId]);

  const audioUrl = useMemo(
    () => ayahAudioUrl(reciter, surahNumber, ayahNumber),
    [reciter, surahNumber, ayahNumber],
  );

  // Playback state is a no-op on web / when expo-audio is missing: guard everything.
  const playback = useAudioPlayback();
  const isThisAyah = playback.playingUrl === audioUrl;
  const isLoading = isThisAyah && playback.isLoading;
  const isPlaying = isThisAyah && !playback.isLoading;

  // The runtime state does not surface elapsed/total duration, so we render
  // sensible zero defaults (the scrubber stays inert rather than crashing).
  const currentSeconds = 0;
  const totalSeconds = 0;
  const progress = totalSeconds > 0 ? Math.min(1, currentSeconds / totalSeconds) : 0;

  const handlePlayPause = useCallback(() => {
    // No pause primitive is exposed; (re)starting the ayah is the supported move.
    void playAyah(audioUrl);
  }, [audioUrl]);

  const handleAdjacent = useCallback(
    (delta: number) => {
      const nextAyah = Math.max(1, ayahNumber + delta);
      void playAyah(ayahAudioUrl(reciter, surahNumber, nextAyah));
    },
    [reciter, surahNumber, ayahNumber],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Deep radial gold backdrop behind everything. */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <RadialGradient id="np-bg" cx="50%" cy="0%" r="120%">
            <Stop offset="0" stopColor={BG_TOP} />
            <Stop offset="0.7" stopColor={BG_BOTTOM} />
            <Stop offset="1" stopColor={BG_BOTTOM} />
          </RadialGradient>
        </Defs>
        <Path d="M0 0 H1000 V2000 H0 Z" fill="url(#np-bg)" />
      </Svg>

      <View style={styles.content}>
        {/* Top bar: dark back button + Now Playing label. */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <AppIcon name="chevron-left" size={22} color={RING_FROM} strokeWidth={1.8} />
          </Pressable>
          <Text style={styles.eyebrow}>Now playing</Text>
          <View style={styles.topBarSpacer} />
        </View>

        {/* Glowing halo disc. */}
        <View style={styles.heroBlock}>
          <Svg width={158} height={158} viewBox="0 0 158 158">
            <Defs>
              <RadialGradient id="np-halo" cx="50%" cy="42%" r="60%">
                <Stop offset="0" stopColor={HALO_INNER} />
                <Stop offset="1" stopColor={HALO_OUTER} />
              </RadialGradient>
              <SvgLinearGradient id="np-ring" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={RING_FROM} />
                <Stop offset="1" stopColor={RING_TO} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={79} cy={79} r={74} fill="url(#np-halo)" stroke="url(#np-ring)" strokeWidth={1.5} />
            <Circle cx={79} cy={79} r={60} fill="none" stroke={GOLD_DISC} strokeWidth={1} opacity={0.45} />
            <Circle cx={79} cy={79} r={48} fill="none" stroke={GOLD_DISC} strokeWidth={1} opacity={0.3} />
          </Svg>
          <ArabicText size="hero" color={RING_FROM} style={styles.haloGlyph}>
            {'م'}
          </ArabicText>

          <Text style={styles.reciterName}>{reciter.name}</Text>
          <Text style={styles.surahLine}>
            {`${surahName}, ayah ${ayahNumber}`}
          </Text>
        </View>

        {/* Ayah card with a representative highlighted token. */}
        <View style={styles.ayahCard}>
          <View style={styles.ayahLine}>
            {ayahSegments[0] ? (
              <ArabicText size="medium" color="#e9dec1" style={styles.ayahText}>
                {ayahSegments[0]}
              </ArabicText>
            ) : null}
            {ayahSegments[1] ? (
              <ArabicText size="medium" color={GOLD_BRIGHT} style={[styles.ayahText, styles.highlightToken]}>
                {ayahSegments[1]}
              </ArabicText>
            ) : null}
            {ayahSegments[2] ? (
              <ArabicText size="medium" color="#e9dec1" style={styles.ayahText}>
                {ayahSegments[2]}
              </ArabicText>
            ) : null}
          </View>
          {glossMeaning ? (
            <Text style={styles.glossLine}>
              {glossWord ? <Text style={styles.glossWord}>{glossWord}</Text> : null}
              {glossWord ? '  ' : ''}
              {glossMeaning}
            </Text>
          ) : null}
        </View>

        {/* Scrubber + transport pinned to the bottom. */}
        <View style={styles.transportBlock}>
          <View style={styles.scrubberRow}>
            <Text style={styles.timeLabel}>{formatTime(currentSeconds)}</Text>
            <View style={styles.scrubberTrack}>
              <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.scrubberKnob, { left: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.timeLabel}>{formatTime(totalSeconds)}</Text>
          </View>

          <View style={styles.transportRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous ayah"
              onPress={() => handleAdjacent(-1)}
              hitSlop={12}
            >
              <Svg width={26} height={26} viewBox="0 0 24 24" fill={RING_FROM}>
                <Path d="M6 6v12l9-6zM17 6h2v12h-2z" />
              </Svg>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Restart ayah' : 'Play ayah'}
              accessibilityState={{ busy: isLoading }}
              onPress={handlePlayPause}
              style={styles.playButton}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="#241b0e">
                {isPlaying ? (
                  <Path d="M8 5h3v14H8zM13 5h3v14h-3z" />
                ) : (
                  <Path d="M8 5v14l11-7z" />
                )}
              </Svg>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next ayah"
              onPress={() => handleAdjacent(1)}
              hitSlop={12}
            >
              <Svg width={26} height={26} viewBox="0 0 24 24" fill={RING_FROM}>
                <Path d="M18 6v12l-9-6zM7 6v12H5V6z" />
              </Svg>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_BOTTOM,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  backButton: {
    alignItems: 'center',
    borderColor: CARD_BORDER,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  eyebrow: {
    color: GOLD_LABEL,
    fontFamily: display.semibold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  topBarSpacer: {
    width: 38,
  },
  heroBlock: {
    alignItems: 'center',
    marginTop: 18,
  },
  haloGlyph: {
    marginTop: -118,
    marginBottom: 56,
    textAlign: 'center',
  },
  reciterName: {
    color: GOLD_TEXT,
    fontFamily: display.bold,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  surahLine: {
    color: GOLD_SUBTLE,
    fontFamily: display.regular,
    fontSize: 12,
    marginTop: 3,
  },
  ayahCard: {
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 26,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  ayahLine: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ayahText: {
    fontSize: 25,
    lineHeight: 46,
    textAlign: 'center',
  },
  highlightToken: {
    backgroundColor: HIGHLIGHT_BG,
    fontWeight: '700',
  },
  glossLine: {
    color: GOLD_LABEL,
    fontFamily: display.regular,
    fontSize: 13,
    marginTop: 9,
    textAlign: 'center',
  },
  glossWord: {
    color: GOLD_BRIGHT,
    fontFamily: display.bold,
    fontWeight: '700',
  },
  transportBlock: {
    marginTop: 'auto',
    paddingBottom: 26,
    paddingHorizontal: 30,
  },
  scrubberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  timeLabel: {
    color: GOLD_SUBTLE,
    fontFamily: display.regular,
    fontSize: 11,
    minWidth: 30,
    textAlign: 'center',
  },
  scrubberTrack: {
    backgroundColor: SCRUBBER_BG,
    borderRadius: 999,
    flex: 1,
    height: 4,
    justifyContent: 'center',
  },
  scrubberFill: {
    backgroundColor: RING_FROM,
    borderRadius: 999,
    height: 4,
  },
  scrubberKnob: {
    backgroundColor: RING_FROM,
    borderRadius: 6,
    height: 12,
    marginLeft: -6,
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    width: 12,
  },
  transportRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 30,
    justifyContent: 'center',
    marginTop: 18,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: RING_FROM,
    borderRadius: 999,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
});
