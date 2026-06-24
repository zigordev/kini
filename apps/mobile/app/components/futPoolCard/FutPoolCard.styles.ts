import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: '100%',
  },
  cardScroll: {
    flex: 1,
    height: '100%',
  },
  cardScrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 110,
    gap: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#d7deeb',
    backgroundColor: '#ffffff',
    overflow: 'visible',
    position: 'relative',
  },
  tableDisabled: {
    opacity: 0.95,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#c7d0e6',
    position: 'relative',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  matchInfoContainer: {
    flex: 1,
    paddingRight: 16,
  },
  resultButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  verticalResultButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  rowText: {
    fontSize: 16,
    color: '#24304e',
    lineHeight: 22,
    flexShrink: 1,
  },
  elige8Badge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#2d6cdf',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    overflow: 'hidden',
  },
  assignedBadge: {
    backgroundColor: '#fff5f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b35',
    marginLeft: 4,
  },
  optionSpacing: {
    marginRight: 12,
  },
  optionBox: {
    width: 35,
    height: 35,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7d0e6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  optionBoxDisabled: {
    opacity: 0.7,
  },
  optionBoxSelected: {
    backgroundColor: '#2d6cdf',
    borderColor: '#2d6cdf',
  },
  optionBoxSuccess: {
    backgroundColor: '#178e3d',
    borderColor: '#178e3d',
  },
  optionBoxFailure: {
    backgroundColor: '#c41e3a',
    borderColor: '#c41e3a',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3a52',
  },
  optionLabelDisabled: {
    color: '#7a86aa',
  },
  optionLabelSelected: {
    color: '#ffffff',
  },
  menuOption: {
    paddingVertical: 6,
  },
  menuOptionLabel: {
    fontSize: 14,
    color: '#1f2a4b',
    fontWeight: '600',
  },
  menuModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 22, 45, 0.12)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuModalCard: {
    position: 'absolute',
    width: 220,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 32,
    gap: 8,
  },
  userCapsule: {
    backgroundColor: '#d6c6f7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 2,
  },
  userCapsuleText: {
    color: '#4b2773',
    fontWeight: '500',
    fontSize: 13,
  },
  nativeContextMenuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.04)',
  },
  nativeContextMenuButtonPressed: {
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    transform: [{ scale: 0.95 }],
  },
});

export default styles;
