import React from 'react';
import Svg, { Circle, LinearGradient, Stop } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { display } from '../theme/typography';

export interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  centerLabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ percent, size = 196, stroke = 13, centerLabel }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const displayLabel = centerLabel !== undefined ? centerLabel : `${Math.round(percent)}%`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.svg}>
        <defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#dcb04a" />
            <Stop offset="100%" stopColor="#946c10" />
          </LinearGradient>
        </defs>

        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e6d4a4" strokeWidth={stroke} />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <Text style={[styles.label, { fontFamily: display.extrabold }]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  label: {
    fontSize: 50,
    fontWeight: '800',
    color: '#946c10',
  },
});
