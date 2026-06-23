import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { display } from '../theme/typography';

interface Segment<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  segments,
  selectedValue,
  onValueChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isSelected = segment.value === selectedValue;
        return (
          <TouchableOpacity
            key={segment.value}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            onPress={() => onValueChange(segment.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.label,
                { fontFamily: display.semibold },
                isSelected && styles.labelSelected,
              ]}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fbf6ea',
    borderWidth: 1,
    borderColor: '#ddc893',
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  segmentSelected: {
    backgroundColor: '#b8860b',
  },
  label: {
    color: '#5c4e30',
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: '#fffaf0',
  },
});
