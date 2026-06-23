import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { RootStackParamList } from '../../navigation/RootStackNavigator';
import { getLevelProgressList, type LevelProgressView } from '../../services/progressService';
import { db } from '../../data/database';
import { EmptyState, Skeleton } from '../../components/ui';
import { AppIcon } from '../../components/AppIcon';
import { Chip } from '../../components/Chip';
import { hapticLight, hapticSelection, motionValue, SPRINGS } from '../../theme/motion';
import type { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
import { mushafPalette } from '../../theme/palette';
import { display } from '../../theme/typography';
import { buildPathLayout, type PathStationLayout } from './pathLayout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type StationState = 'completed' | 'current' | 'unlocked' | 'locked';

const NODE_SIZE = 84;
const STATION_SPACING = 138;
const TOP_PADDING = 42;
const BOTTOM_PADDING = 104;

export function LevelListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [levels, setLevels] = useState<LevelProgressView[]>([]);
  const [loading, setLoading] = useState(true);
  const [hintLevelId, setHintLevelId] = useState<number | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollY = useSharedValue(0);

  const loadLevels = useCallback(async () => {
    try {
      const data = await getLevelProgressList(db);
      setLevels(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLevels();
    }, [loadLevels]),
  );

  useEffect(() => () => {
    if (hintTimer.current) {
      clearTimeout(hintTimer.current);
    }
  }, []);

  const pathWidth = Math.max(width, 320);
  const pathLayout = useMemo(
    () => buildPathLayout(levels.length, {
      width: pathWidth,
      nodeSize: NODE_SIZE,
      amplitude: Math.min(pathWidth * 0.26, 118),
      spacing: STATION_SPACING,
      topPadding: TOP_PADDING,
      bottomPadding: BOTTOM_PADDING,
    }),
    [levels.length, pathWidth],
  );
  const currentIndex = useMemo(() => getCurrentIndex(levels), [levels]);
  const completedCount = levels.filter((level) => level.completed).length;
  const progressText = levels.length === 0
    ? '0 of 0'
    : `${completedCount} of ${levels.length}`;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleLockedPress = useCallback((levelId: number) => {
    void hapticSelection();
    setHintLevelId(levelId);

    if (hintTimer.current) {
      clearTimeout(hintTimer.current);
    }

    hintTimer.current = setTimeout(() => {
      setHintLevelId((activeLevelId) => (activeLevelId === levelId ? null : activeLevelId));
    }, 1800);
  }, []);

  const handleEnter = useCallback((level: LevelProgressView) => {
    void hapticLight();
    navigation.navigate('WordCard', {
      levelId: level.id,
      levelName: level.name,
    });
  }, [navigation]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#241a0b', '#5a4218', '#9a7117', '#d7b659', '#f4e7c0', '#fdf8ee']}
        locations={[0, 0.26, 0.5, 0.72, 0.9, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={styles.container}
      >
        <View style={styles.loadingContent}>
          <Skeleton width={180} height={20} radius={8} />
          <Skeleton width="100%" height={88} radius={18} style={styles.loadingPath} />
          <Skeleton width="76%" height={88} radius={18} />
          <Skeleton width="92%" height={88} radius={18} style={styles.loadingPath} />
        </View>
      </LinearGradient>
    );
  }

  if (levels.length === 0) {
    return (
      <LinearGradient
        colors={['#241a0b', '#5a4218', '#9a7117', '#d7b659', '#f4e7c0', '#fdf8ee']}
        locations={[0, 0.26, 0.5, 0.72, 0.9, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={styles.container}
      >
        <EmptyState
          icon="circle-outline"
          title="The path is quiet"
          message="Your learning stations will appear here when levels are available."
          style={styles.emptyState}
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#241a0b', '#5a4218', '#9a7117', '#d7b659', '#f4e7c0', '#fdf8ee']}
      locations={[0, 0.26, 0.5, 0.72, 0.9, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={styles.container}
    >
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: pathLayout.contentHeight + 48 },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Your journey</Text>
            <Chip label={progressText} />
          </View>
        </View>

        <View
          style={[
            styles.pathStage,
            { width: pathWidth, height: pathLayout.contentHeight },
          ]}
        >
          {/* Light halo at the summit (radial glow into the light) */}
          <Svg
            width={320}
            height={230}
            viewBox="0 0 320 230"
            style={styles.lightHalo}
            pointerEvents="none"
          >
            <Defs>
              <RadialGradient id="summitHalo" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#fffcee" stopOpacity={0.95} />
                <Stop offset="45%" stopColor="#fff8e0" stopOpacity={0.35} />
                <Stop offset="70%" stopColor="#fff8e0" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse cx={160} cy={115} rx={160} ry={115} fill="url(#summitHalo)" />
          </Svg>

          {/* Faint rays SVG */}
          <Svg
            width={pathWidth}
            height={220}
            viewBox={`0 0 ${pathWidth} 220`}
            style={styles.raysSvg}
          >
            <G stroke="#fff6d8" strokeWidth="1.5">
              <Path d={`M${pathWidth / 2} 30 L${pathWidth / 2 - 54} 0`} />
              <Path d={`M${pathWidth / 2} 30 L${pathWidth / 2} -10`} />
              <Path d={`M${pathWidth / 2} 30 L${pathWidth / 2 + 54} 0`} />
              <Path d={`M${pathWidth / 2} 30 L${pathWidth / 2 - 94} 18`} />
              <Path d={`M${pathWidth / 2} 30 L${pathWidth / 2 + 94} 18`} />
            </G>
          </Svg>

          {/* Curved dotted path */}
          {pathLayout.stations.length > 1 && (
            <Svg
              width={pathWidth}
              height={pathLayout.contentHeight}
              viewBox={`0 0 ${pathWidth} ${pathLayout.contentHeight}`}
              style={styles.pathSvg}
              pointerEvents="none"
            >
              <Path
                d={buildDottedPath(pathLayout.stations)}
                fill="none"
                stroke="rgba(255,250,230,.55)"
                strokeWidth="6"
                strokeDasharray="1 15"
                strokeLinecap="round"
              />
            </Svg>
          )}

          {/* Render stations in ascending order (reverse) */}
          {pathLayout.stations.map((station, index) => {
            const level = levels[index];
            const state = getStationState(level, index, currentIndex);

            return (
              <StationNode
                key={level.id}
                level={level}
                station={station}
                stageWidth={pathWidth}
                state={state}
                showHint={hintLevelId === level.id}
                onEnter={handleEnter}
                onLockedPress={handleLockedPress}
              />
            );
          })}
        </View>
      </Animated.ScrollView>
    </LinearGradient>
  );
}

function StationNode({
  level,
  station,
  stageWidth,
  state,
  showHint,
  onEnter,
  onLockedPress,
}: {
  level: LevelProgressView;
  station: PathStationLayout;
  stageWidth: number;
  state: StationState;
  showHint: boolean;
  onEnter: (level: LevelProgressView) => void;
  onLockedPress: (levelId: number) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const reduceMotion = useReducedMotion();
  const pressScale = useSharedValue(1);
  const breath = useSharedValue(0);

  // Slow, calm pulse on the current station: a gentle scale loop (1.0 to 1.06
  // over ~2.4s, ease-in-out) plus a soft pulsing glow ring behind the node.
  // Reduced motion holds it static.
  useEffect(() => {
    if (state !== 'current' || reduceMotion) {
      cancelAnimation(breath);
      breath.value = 0;
      return;
    }

    breath.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(breath);
    };
  }, [breath, reduceMotion, state]);

  const nodeAnimatedStyle = useAnimatedStyle(() => {
    const pulseScale = state === 'current'
      ? interpolate(breath.value, [0, 1], [1, 1.06])
      : 1;

    return {
      transform: [{ scale: pressScale.value * pulseScale }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.45, 0.9]),
    transform: [{ scale: interpolate(breath.value, [0, 1], [1, 1.18]) }],
  }));

  const handlePressIn = () => {
    pressScale.value = motionValue(
      reduceMotion,
      withSpring(0.96, SPRINGS.snappy),
      1,
    );
  };

  const handlePressOut = () => {
    pressScale.value = motionValue(
      reduceMotion,
      withSpring(1, SPRINGS.gentle),
      1,
    );
  };

  const handlePress = () => {
    if (!level.unlocked) {
      onLockedPress(level.id);
      return;
    }

    pressScale.value = motionValue(
      reduceMotion,
      withSequence(
        withSpring(0.94, SPRINGS.snappy),
        withSpring(1, SPRINGS.gentle),
      ),
      1,
    );
    onEnter(level);
  };

  const coverageText = `${(level.cumulativeCoverage * 100).toFixed(1)}%`;
  const bestScore = level.bestQuizScore === null
    ? null
    : `${Math.round(level.bestQuizScore * 100)}% mastery`;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.stationWrap,
        {
          left: Math.max(0, Math.min(station.x - 42, stageWidth - station.size - 84)),
          top: station.y - 8,
          width: station.size + 84,
        },
      ]}
    >
      <Animated.View style={[styles.nodeWrap, nodeAnimatedStyle]}>
        {state === 'current' && !reduceMotion && (
          <Animated.View
            pointerEvents="none"
            style={[styles.currentGlowRing, glowAnimatedStyle]}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${level.name}, ${state === 'locked' ? 'not yet revealed' : 'enter level'}`}
          accessibilityState={{ disabled: !level.unlocked, selected: state === 'current' }}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.stationPressable,
            state === 'completed' && styles.stationCompleted,
            state === 'current' && styles.stationCurrent,
            state === 'unlocked' && styles.stationUnlocked,
            state === 'locked' && styles.stationLocked,
          ]}
        >
          {(state === 'completed' || state === 'unlocked') && (
            <LinearGradient
              colors={['#e9cf83', '#c8973a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.nodeCompletedGradient}
            >
              {state === 'completed' ? (
                <AppIcon
                  name="check"
                  size={24}
                  color="#241a0d"
                  strokeWidth={2.4}
                />
              ) : (
                <Text style={styles.unlockedNumber}>{level.id}</Text>
              )}
            </LinearGradient>
          )}

          {state === 'current' && (
            <Text style={styles.levelNumber}>
              {level.id}
            </Text>
          )}

          {state === 'locked' && (
            <AppIcon
              name="lock"
              size={20}
              color="#9a7117"
              strokeWidth={1.8}
            />
          )}
        </Pressable>
      </Animated.View>

      <View style={[
        styles.stationLabel,
        station.alignment === 'left' && styles.stationLabelLeft,
        station.alignment === 'right' && styles.stationLabelRight,
      ]}>
        {state === 'current' && (
          <>
            <Text style={styles.currentName}>
              {level.name}
            </Text>
            <Text style={styles.currentCount}>
              {level.wordCount}/{Math.round(level.cumulativeCoverage * 100)}
            </Text>
          </>
        )}

        {state === 'completed' && (
          <>
            <Text style={styles.levelName}>
              {level.name}
            </Text>
            <Text style={styles.levelMeta}>
              {level.wordCount} words
            </Text>
            {bestScore && (
              <Text style={styles.masteryText}>{bestScore}</Text>
            )}
          </>
        )}

        {state === 'unlocked' && (
          <>
            <Text style={styles.levelName}>
              {level.name}
            </Text>
            <Text style={styles.levelMeta}>
              {level.wordCount} words
            </Text>
          </>
        )}

        {state === 'locked' && (
          <>
            <Text style={styles.levelNameLocked}>
              {level.name}
            </Text>
            <Text style={styles.levelMetaLocked}>
              Not yet revealed
            </Text>
          </>
        )}

        {showHint && (
          <Text style={styles.inlineHint}>Continue your journey...</Text>
        )}
      </View>
    </View>
  );
}

function getCurrentIndex(levels: LevelProgressView[]): number {
  const next = levels.findIndex((level) => level.unlocked && !level.completed);
  if (next !== -1) return next;

  for (let index = levels.length - 1; index >= 0; index -= 1) {
    if (levels[index].unlocked) return index;
  }

  return -1;
}

// Build a smooth dotted path that weaves through every station center,
// ascending from the bottom-most station up to the summit. Uses each
// station center as a smooth knot (quadratic segments through midpoints)
// so the curve passes through every node like the mockup's serpentine.
function buildDottedPath(stations: PathStationLayout[]): string {
  if (stations.length < 2) return '';

  // Stations are laid out top (index 0) to bottom (last); draw upward by
  // starting from the bottom-most center and curving up to the summit.
  const points = stations
    .map((station) => ({ x: station.centerX, y: station.centerY }))
    .reverse();

  let d = `M${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  d += ` Q${last.x} ${last.y} ${last.x} ${last.y}`;

  return d;
}

function getStationState(
  level: LevelProgressView,
  index: number,
  currentIndex: number,
): StationState {
  if (!level.unlocked) return 'locked';
  if (index === currentIndex && !level.completed) return 'current';
  if (level.completed) return 'completed';
  return 'unlocked';
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#3a2a12',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: display.bold,
    letterSpacing: 0,
  },
  pathStage: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  lightHalo: {
    position: 'absolute',
    top: -40,
    left: '50%',
    marginLeft: -160,
    width: 320,
    height: 230,
    zIndex: 0,
  },
  raysSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.35,
  },
  pathSvg: {
    position: 'absolute',
    inset: 0,
  },
  stationWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  nodeWrap: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentGlowRing: {
    position: 'absolute',
    width: NODE_SIZE + 18,
    height: NODE_SIZE + 18,
    borderRadius: (NODE_SIZE + 18) / 2,
    backgroundColor: 'rgba(255,238,190,.35)',
  },
  stationPressable: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mushafPalette.paper,
    borderWidth: 1.5,
    borderColor: mushafPalette.goldLine,
  },
  stationCompleted: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nodeCompletedGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationCurrent: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fdf6e6',
    borderColor: mushafPalette.gold,
    borderWidth: 3,
    shadowColor: 'rgba(120,80,10,.4)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 12,
  },
  stationUnlocked: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  stationLocked: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,.9)',
    opacity: 1,
    shadowColor: 'rgba(255,250,230,.9)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 0,
  },
  levelNumber: {
    color: mushafPalette.goldDeep,
    fontSize: 30,
    fontWeight: '700',
    fontFamily: display.bold,
  },
  unlockedNumber: {
    color: '#241a0d',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: display.bold,
  },
  stationLabel: {
    width: 168,
    marginTop: 8,
    alignItems: 'center',
  },
  stationLabelLeft: {
    alignItems: 'center',
  },
  stationLabelRight: {
    alignItems: 'center',
  },
  currentName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: display.bold,
    lineHeight: 17,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  currentCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: display.bold,
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  levelName: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: display.bold,
    lineHeight: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  levelNameLocked: {
    color: 'rgba(255,255,255,.85)',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: display.bold,
    lineHeight: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  levelMeta: {
    color: 'rgba(255,255,255,.85)',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: display.semibold,
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  levelMetaLocked: {
    color: 'rgba(255,255,255,.7)',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: display.semibold,
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  masteryText: {
    color: mushafPalette.goldSoft,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: display.bold,
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  inlineHint: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: display.semibold,
    marginTop: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 18,
  },
  loadingPath: {
    alignSelf: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
});
