import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from './AppIcon';
import { display } from '../theme/typography';

export interface PrimaryCTAProps {
  label: string;
  onPress: () => void;
  arrow?: boolean;
  style?: ViewStyle;
}

export const PrimaryCTA: React.FC<PrimaryCTAProps> = ({
  label,
  onPress,
  arrow = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={onPress} style={styles.pressable}>
        <LinearGradient
          colors={['#caa033', '#a9760d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={[styles.label, { fontFamily: display.bold }]}>{label}</Text>
            {arrow && (
              <View style={styles.arrowContainer}>
                <AppIcon name="arrow-right" size={20} color="#fffaf0" />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    shadowColor: 'rgba(168, 118, 13, 1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 5,
  },
  pressable: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  label: {
    fontSize: 20,
    color: '#fffaf0',
    fontWeight: '700',
  },
  arrowContainer: {
    position: 'absolute',
    right: 20,
  },
});
