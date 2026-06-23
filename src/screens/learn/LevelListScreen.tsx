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
import Svg, { Path, Circle, G } from 'react-native-svg';
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
            <Text style={styles.title}>Your ascent</Text>
            <Chip label={progressText} />
          </View>
        </View>

        <View
          style={[
            styles.pathStage,
            { width: pathWidth, height: pathLayout.contentHeight },
          ]}
        >
          {/* Light halo at the summit */}
          <View style={styles.lightHalo} />

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
                d={`M${pathLayout.stations[pathLayout.stations.length - 1].centerX} ${
                  pathLayout.stations[pathLayout.stations.length - 1].centerY
                } Q90 ${pathLayout.contentHeight / 2} ${pathLayout.stations[0].centerX} ${
                  pathLayout.stations[0].centerY
                }`}
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

  useEffect(() => {
    if (state !== 'current' || reduceMotion) {
      cancelAnimation(breath);
      breath.value = 0;
      return;
    }

    breath.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(breath);
    };
  }, [breath, reduceMotion, state]);

  const nodeAnimatedStyle = useAnimatedStyle(() => {
    const breathingScale = state === 'current'
      ? interpolate(breath.value, [0, 1], [1, 1.035])
      : 1;

    return {
      opacity: state === 'current'
        ? interpolate(breath.value, [0, 1], [0.96, 1])
        : 1,
      transform: [{ scale: pressScale.value * breathingScale }],
    };
  });

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
      <Animated.View style={nodeAnimatedStyle}>
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
          {state === 'completed' && (
            <LinearGradient
              colors={['#e9cf83', '#c8973a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.nodeCompletedGradient}
            >
              <AppIcon
                name="check"
                size={26}
                color="#241a0d"
                strokeWidth={2.4}
              />
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
              size={22}
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
            <Text style={styles.levelName}>
              {level.name}
            </Text>
            <Text style={styles.levelMeta}>
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
    top: -140,
    left: '50%',
    marginLeft: -140,
    width: 280,
    height: 200,
    borderRadius: 140,
    backgroundColor: 'rgba(255,252,238,.15)',
    shadowColor: 'rgba(255,252,238,.08)',
    zIndex: 1,
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
  stationPressable: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
  },
  stationCompleted: {
    backgroundColor: mushafPalette.gold,
    borderColor: mushafPalette.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCompletedGradient: {
    width: '100%',
    height: '100%',
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationCurrent: {
    backgroundColor: '#fdf6e6',
    borderColor: mushafPalette.gold,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  stationUnlocked: {
    backgroundColor: mushafPalette.paper,
    borderColor: mushafPalette.gold,
  },
  stationLocked: {
    backgroundColor: 'rgba(255,255,255,.5)',
    borderColor: 'rgba(255,255,255,.8)',
    opacity: 1,
  },
  levelNumber: {
    color: mushafPalette.goldDeep,
    fontSize: 30,
    fontWeight: '700',
    fontFamily: display.bold,
  },
  stationLabel: {
    width: 168,
    marginTop: 10,
    alignItems: 'center',
  },
  stationLabelLeft: {
    alignItems: 'flex-start',
  },
  stationLabelRight: {
    alignItems: 'flex-end',
  },
  levelName: {
    color: mushafPalette.ink,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: display.bold,
    lineHeight: 19,
    textAlign: 'center',
  },
  levelNameLocked: {
    color: mushafPalette.ink2,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: display.bold,
    lineHeight: 19,
    textAlign: 'center',
  },
  levelMeta: {
    color: mushafPalette.ink2,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: display.semibold,
    marginTop: 4,
    textAlign: 'center',
  },
  levelMetaLocked: {
    color: mushafPalette.muted,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: display.semibold,
    marginTop: 4,
    textAlign: 'center',
  },
  masteryText: {
    color: mushafPalette.gold,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: display.bold,
    marginTop: 4,
  },
  inlineHint: {
    color: mushafPalette.ink2,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: display.semibold,
    marginTop: 6,
    textAlign: 'center',
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
