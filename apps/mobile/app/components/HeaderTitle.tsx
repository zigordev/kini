import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Logo from './Logo';

interface HeaderTitleProps {
  title: string;
}

const HeaderTitle: React.FC<HeaderTitleProps> = ({ title }) => {
  if (Platform.OS !== 'web') {
    return <Text style={styles.titleText}>{title}</Text>;
  }

  return (
    <View style={styles.container}>
      <Logo size={32} />
      <Text style={styles.titleText}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1f36',
  },
});

export default HeaderTitle;
