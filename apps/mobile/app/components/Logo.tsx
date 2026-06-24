import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Polygon } from 'react-native-svg';

interface LogoProps {
  size?: number;
  style?: any;
}

const Logo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Deep purple background circle */}
        <Circle cx="100" cy="100" r="100" fill="#4A1A7A" />

        {/* Orange uppercase K */}
        {/* Vertical stroke */}
        <Rect x="70" y="60" width="12" height="80" fill="#FF6B35" />

        {/* Upper diagonal */}
        <Polygon
          points="82,60 82,90 120,60 132,60 94,90 132,100 120,100"
          fill="#FF6B35"
        />

        {/* Lower diagonal */}
        <Polygon
          points="82,100 120,100 132,140 120,140 82,110"
          fill="#FF6B35"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Logo;
