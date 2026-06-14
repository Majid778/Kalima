import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
import { hapticLight, hapticSelection, motionValue, SPRINGS } from '../../theme/motion';
import type { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
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
    ? '0%'
    : `${Math.round((completedCount / levels.length) * 100)}%`;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: motionValue(
          reduceMotion,
          interpolate(scrollY.value, [0, 700], [0, -72], 'clamp'),
          0,
        ),
      },
    ],
  }));

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
      <View style={styles.container}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, backdropStyle]}>
          <BackdropGeometry styles={styles} />
        </Animated.View>
        <View style={styles.loadingContent}>
          <Skeleton width={180} height={20} radius={8} />
          <Skeleton width="100%" height={88} radius={18} style={styles.loadingPath} />
          <Skeleton width="76%" height={88} radius={18} />
          <Skeleton width="92%" height={88} radius={18} style={styles.loadingPath} />
        </View>
      </View>
    );
  }

  if (levels.length === 0) {
    return (
      <View style={styles.container}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, backdropStyle]}>
          <BackdropGeometry styles={styles} />
        </Animated.View>
        <EmptyState
          icon="◌"
          title="The path is quiet"
          message="Your learning stations will appear here when levels are available."
          style={styles.emptyState}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View pointerEvents="none" style={[styles.backdrop, backdropStyle]}>
        <BackdropGeometry styles={styles} />
      </Animated.View>

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
          <Text style={styles.kicker}>Learn</Text>
          <Text style={styles.title}>A path through Kalima</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${levels.length === 0 ? 0 : (completedCount / levels.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progressText}</Text>
          </View>
        </View>

        <View
          style={[
            styles.pathStage,
            { width: pathWidth, height: pathLayout.contentHeight },
          ]}
        >
          {pathLayout.stations.slice(0, -1).map((station, index) => (
            <PathSegment
              key={`segment-${station.index}`}
              from={station}
              to={pathLayout.stations[index + 1]}
              theme={theme}
            />
          ))}

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
    </View>
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
          <View style={[
            styles.nodeHalo,
            state === 'completed' && styles.nodeHaloCompleted,
            state === 'current' && styles.nodeHaloCurrent,
            state === 'locked' && styles.nodeHaloLocked,
          ]}>
            <Ionicons
              name={getStationIcon(state)}
              size={state === 'locked' ? 23 : 27}
              color={getStationIconColor(theme, state)}
            />
          </View>
          <Text
            style={[
              styles.levelNumber,
              state === 'locked' && styles.levelNumberLocked,
            ]}
          >
            {level.id}
          </Text>
        </Pressable>
      </Animated.View>

      <View style={[
        styles.stationLabel,
        station.alignment === 'left' && styles.stationLabelLeft,
        station.alignment === 'right' && styles.stationLabelRight,
      ]}>
        <Text
          style={[
            styles.levelName,
            state === 'locked' && styles.levelNameLocked,
          ]}
          numberOfLines={2}
        >
          {level.name}
        </Text>
        <Text style={[
          styles.levelMeta,
          state === 'locked' && styles.levelMetaLocked,
        ]}>
          {state === 'locked'
            ? 'Not yet revealed'
            : `${level.wordCount} words · ${coverageText}`}
        </Text>
        {bestScore && state === 'completed' ? (
          <Text style={styles.masteryText}>{bestScore}</Text>
        ) : null}
        {showHint ? (
          <Text style={styles.inlineHint}>Continue your journey...</Text>
        ) : null}
      </View>
    </View>
  );
}

function PathSegment({
  from,
  to,
  theme,
}: {
  from: PathStationLayout;
  to: PathStationLayout;
  theme: ThemeTokens;
}) {
  const dx = to.centerX - from.centerX;
  const dy = to.centerY - from.centerY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const left = (from.centerX + to.centerX) / 2 - length / 2;
  const top = (from.centerY + to.centerY) / 2 - 1;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top,
        width: length,
        height: 2,
        borderRadius: 999,
        backgroundColor: theme.surfaces.border,
        opacity: 0.9,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

function BackdropGeometry({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <>
      <View style={styles.backdropPanelTop} />
      <View style={styles.backdropPanelBottom} />
      <View style={styles.backdropLineOne} />
      <View style={styles.backdropLineTwo} />
    </>
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

function getStationIcon(state: StationState): keyof typeof Ionicons.glyphMap {
  switch (state) {
    case 'completed':
      return 'checkmark-circle';
    case 'current':
      return 'sparkles';
    case 'locked':
      return 'eye-off-outline';
    case 'unlocked':
    default:
      return 'ellipse-outline';
  }
}

function getStationIconColor(theme: ThemeTokens, state: StationState): string {
  switch (state) {
    case 'completed':
      return theme.text.onSacred;
    case 'current':
      return theme.text.onAction;
    case 'locked':
      return theme.text.textMuted;
    case 'unlocked':
    default:
      return theme.action.action;
  }
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaces.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backdropPanelTop: {
    position: 'absolute',
    top: 30,
    right: -34,
    width: 172,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.sacred.sacredMuted,
    opacity: 0.12,
    transform: [{ rotate: '-16deg' }],
  },
  backdropPanelBottom: {
    position: 'absolute',
    top: 518,
    left: -46,
    width: 188,
    height: 112,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.action.action,
    opacity: 0.08,
    transform: [{ rotate: '18deg' }],
  },
  backdropLineOne: {
    position: 'absolute',
    top: 168,
    left: -40,
    width: 220,
    height: 1,
    backgroundColor: theme.surfaces.border,
    opacity: 0.42,
    transform: [{ rotate: '-18deg' }],
  },
  backdropLineTwo: {
    position: 'absolute',
    top: 368,
    right: -54,
    width: 260,
    height: 1,
    backgroundColor: theme.surfaces.border,
    opacity: 0.34,
    transform: [{ rotate: '22deg' }],
  },
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  kicker: {
    color: theme.sacred.sacred,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    color: theme.text.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.surfaces.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.sacred.sacred,
  },
  progressText: {
    color: theme.text.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 42,
    textAlign: 'right',
  },
  pathStage: {
    alignSelf: 'center',
    position: 'relative',
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
    backgroundColor: theme.surfaces.surface,
    borderWidth: 1,
    borderColor: theme.surfaces.border,
  },
  stationCompleted: {
    backgroundColor: theme.sacred.sacred,
    borderColor: theme.sacred.sacred,
  },
  stationCurrent: {
    backgroundColor: theme.action.action,
    borderColor: theme.action.action,
  },
  stationUnlocked: {
    backgroundColor: theme.surfaces.surface,
    borderColor: theme.action.action,
  },
  stationLocked: {
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.surfaces.border,
    opacity: 0.72,
  },
  nodeHalo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaces.surfaceElevated,
    marginBottom: 3,
  },
  nodeHaloCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  nodeHaloCurrent: {
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  nodeHaloLocked: {
    backgroundColor: theme.surfaces.background,
  },
  levelNumber: {
    color: theme.text.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  levelNumberLocked: {
    color: theme.text.textMuted,
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
    color: theme.text.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'center',
  },
  levelNameLocked: {
    color: theme.text.textSecondary,
  },
  levelMeta: {
    color: theme.text.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  levelMetaLocked: {
    color: theme.text.textMuted,
  },
  masteryText: {
    color: theme.sacred.sacred,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  inlineHint: {
    color: theme.text.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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