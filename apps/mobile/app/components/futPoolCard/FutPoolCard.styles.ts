import { Platform } from 'react-native';

import { createThemedStyleSheet } from '../../theme/createThemedStyleSheet';

const createStyles = (isDark = false) =>
  createThemedStyleSheet(
    {
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
        paddingBottom: Platform.OS === 'web' ? 0 : 128,
        gap: 16,
      },
      table: {
        borderWidth: Platform.OS === 'web' ? 1 : 0,
        borderColor: '#D8E1E1',
        backgroundColor: Platform.OS === 'web' ? '#FFFFFF' : 'transparent',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: Platform.OS === 'web' ? 8 : 0,
      },
      tableDisabled: {
        opacity: 0.95,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#D8E1E1',
        position: 'relative',
        gap: 10,
      },
      tableHeader: {
        minHeight: 42,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#D8E1E1',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      e8HeaderColumn: {
        width: 58,
        minHeight: 22,
        marginLeft: 10,
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#D8E1E1',
        alignItems: 'center',
        justifyContent: 'center',
      },
      tableHeaderTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#D71920',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
      },
      tableHeaderMeta: {
        fontSize: 12,
        fontWeight: '700',
        color: '#5F6B7A',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      },
      matchNumberBadge: {
        width: 34,
        minHeight: 30,
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 10,
        marginRight: 2,
        borderRightWidth: 1,
        borderRightColor: '#D8E1E1',
      },
      matchNumberText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#A81218',
        textAlign: 'center',
      },
      lastRow: {
        borderBottomWidth: 0,
      },
      full15Row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#D8E1E1',
        position: 'relative',
        gap: 10,
        backgroundColor: 'transparent',
      },
      full15ScorePanel: {
        flex: 1,
        minWidth: 0,
        gap: 8,
      },
      full15ScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      },
      full15ScoreLabel: {
        minWidth: 72,
        flex: 1,
        flexShrink: 1,
        color: '#17202A',
        fontSize: 13,
        fontWeight: '700',
      },
      full15OptionsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
      },
      full15OptionStack: {
        width: Platform.OS === 'android' ? 172 : 144,
      },
      full15UserInfo: {
        marginTop: 2,
      },
      matchInfoContainer: {
        flex: 1,
        paddingRight: 12,
        marginRight: 2,
        borderRightWidth: 1,
        borderRightColor: '#D8E1E1',
      },
      resultButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
      },
      resultButtonsWithE8Column: {
        paddingRight: 10,
        marginRight: 10,
        borderRightWidth: 1,
        borderRightColor: '#D8E1E1',
      },
      verticalResultButtonsContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      },
      actionsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 0,
      },
      e8Column: {
        width: 58,
        alignItems: 'center',
        justifyContent: 'center',
      },
      userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 4,
      },
      rowText: {
        color: '#17202A',
        fontSize: 13,
        fontWeight: '700',
        flexShrink: 1,
      },
      teamLines: {
        gap: 1,
      },
      elige8SwitchGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
      assigneeText: {
        color: '#5F6B7A',
        fontSize: 12,
        fontWeight: '600',
      },
      assigneeTextUnassigned: {
        color: '#8A5700',
      },
      optionSpacing: {
        marginRight: 12,
      },
      optionBox: {
        width: 34,
        height: 34,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#B9C7C6',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
      },
      optionBoxDisabled: {
        opacity: 0.7,
      },
      optionBoxSelectedNeutral: {
        backgroundColor: '#4B5563',
        borderColor: '#374151',
      },
      optionBoxSelectedSuccess: {
        backgroundColor: '#157F3B',
        borderColor: '#157F3B',
      },
      optionBoxSelectedFailure: {
        backgroundColor: '#B42318',
        borderColor: '#B42318',
      },
      optionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#25313F',
      },
      optionLabelDisabled: {
        color: '#8792A2',
      },
      optionLabelSelectedNeutral: {
        color: '#FFFFFF',
      },
      optionLabelSelectedSuccess: {
        color: '#FFFFFF',
      },
      optionLabelSelectedFailure: {
        color: '#FFFFFF',
      },
    },
    isDark,
  );

export { createStyles };
export default createStyles(false);
