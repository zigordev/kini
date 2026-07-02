import { Platform, StyleSheet } from 'react-native';
import { palette } from '../../theme/design';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'center',
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    zIndex: 9999,
  },
  toast: {
    width: Platform.OS === 'web' ? 420 : undefined,
    maxWidth: '92%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingRight: 16,
    overflow: 'hidden',
    shadowColor: palette.black,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 10,
  },
  accent: {
    width: 5,
    alignSelf: 'stretch',
  },
  iconShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  errorAccent: {
    backgroundColor: palette.danger,
  },
  infoAccent: {
    backgroundColor: palette.accent,
  },
  successAccent: {
    backgroundColor: palette.success,
  },
  warningAccent: {
    backgroundColor: palette.warning,
  },
  errorIconShell: {
    backgroundColor: palette.dangerSoft,
  },
  infoIconShell: {
    backgroundColor: palette.accentSoft,
  },
  successIconShell: {
    backgroundColor: palette.successSoft,
  },
  warningIconShell: {
    backgroundColor: palette.warningSoft,
  },
});

export default styles;
