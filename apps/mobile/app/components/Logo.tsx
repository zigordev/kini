import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { palette } from '../theme/design';

interface LogoProps {
  size?: number;
  style?: any;
}

const Logo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Circle cx="100" cy="100" r="100" fill={palette.primaryDark} />
        <Rect x="54" y="42" width="24" height="116" rx="8" fill="#FFFFFF" />
        <Path
          d="M82 97L128 42H158L108 98L160 158H130L82 105Z"
          fill="#FFFFFF"
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
