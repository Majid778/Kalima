import React from 'react';
import Svg, { Path, Circle, Rect, G, LinearGradient, Stop } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'book'
  | 'person'
  | 'clock'
  | 'flame'
  | 'star'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'gear'
  | 'arrow-right'
  | 'heart'
  | 'speaker'
  | 'lock'
  | 'dots'
  | 'diamond-logo';

export interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 24, color = '#000', strokeWidth = 1.7 }) => {
  const iconSize = size;

  switch (name) {
    case 'home':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 11l9-8 9 8" />
          <Path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" />
        </Svg>
      );

    case 'book':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 6C10 4.5 7 4.5 5 6v12c2-1.5 5-1.5 7 0" />
          <Path d="M12 6c2-1.5 5-1.5 7 0v12c-2-1.5-5-1.5-7 0z" />
        </Svg>
      );

    case 'person':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="8.5" r="4" />
          <Path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" />
        </Svg>
      );

    case 'clock':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </Svg>
      );

    case 'flame':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 3c0 4-4 5-4 9a4 4 0 008 0c0-2-1-3-1-5 2 1 3 3 3 5a6 6 0 11-12 0c0-5 6-6 6-9z" />
        </Svg>
      );

    case 'star':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 2l2.4 6.9H22l-6 4.4 2.3 7-6.3-4.6L5.7 20l2.3-7-6-4.4h7.6z" />
        </Svg>
      );

    case 'check':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 6L9 17l-5-5" />
        </Svg>
      );

    case 'chevron-left':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 18l-6-6 6-6" />
        </Svg>
      );

    case 'chevron-right':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      );

    case 'gear':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="3.1" />
          <Path d="M19.4 13a7.6 7.6 0 000-2l2-1.5-2-3.4-2.4 1a7.6 7.6 0 00-1.7-1l-.4-2.6h-3.8l-.4 2.6a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 000 2l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 001.7 1l.4 2.6h3.8l.4-2.6a7.6 7.6 0 001.7-1l2.4 1 2-3.4z" />
        </Svg>
      );

    case 'arrow-right':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12h13M13 6l6 6-6 6" />
        </Svg>
      );

    case 'heart':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 21C5 16 3 12 3 8.5A3.5 3.5 0 0112 6a3.5 3.5 0 019 2.5C21 12 19 16 12 21z" />
        </Svg>
      );

    case 'speaker':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M11 5L6 9H3v6h3l5 4V5z" />
          <Path d="M16 9a4 4 0 010 6" />
        </Svg>
      );

    case 'lock':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="5" y="11" width="14" height="9" rx="2" />
          <Path d="M8 11V8a4 4 0 018 0v3" />
        </Svg>
      );

    case 'dots':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={color}>
          <Circle cx="12" cy="5" r="1.4" />
          <Circle cx="12" cy="12" r="1.4" />
          <Circle cx="12" cy="19" r="1.4" />
        </Svg>
      );

    case 'diamond-logo':
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
          <Rect x="3" y="8" width="9" height="9" rx="2" transform="rotate(45 7.5 12.5)" />
          <Rect x="12" y="8" width="9" height="9" rx="2" transform="rotate(-45 16.5 12.5)" />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
        </Svg>
      );

    default:
      return null;
  }
};
