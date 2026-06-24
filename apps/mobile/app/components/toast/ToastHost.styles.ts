import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    maxWidth: '90%',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Toast type styles
  error: {
    backgroundColor: '#d93025',
  },
  info: {
    backgroundColor: '#2d6cdf',
  },
  success: {
    backgroundColor: '#34a853',
  },
  warning: {
    backgroundColor: '#fbbc05',
  },
});

export default styles;
