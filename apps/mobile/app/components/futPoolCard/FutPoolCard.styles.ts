import { createThemedStyleSheet } from '../../theme/createThemedStyleSheet';
import { palette } from '../../theme/design';

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
        paddingBottom: 12,
        gap: 16,
      },
      table: {
        borderWidth: 1,
        borderColor: '#D8E1E1',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 8,
      },
      tableDisabled: {
        opacity: 0.95,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#D8E1E1',
        position: 'relative',
        gap: 12,
      },
      rowSuccess: {
        borderLeftWidth: 4,
        borderLeftColor: '#157F3B',
        backgroundColor: '#F3FBF5',
      },
      rowFailure: {
        borderLeftWidth: 4,
        borderLeftColor: '#D71920',
        backgroundColor: '#FFF5F5',
      },
      tableHeader: {
        minHeight: 42,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#D8E1E1',
        backgroundColor: '#D71920',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      tableHeaderTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
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
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F3F6F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D8E1E1',
      },
      matchNumberBadgeNeutral: {
        backgroundColor: '#F3F6F6',
        borderColor: '#B9C7C6',
      },
      matchNumberBadgeSuccess: {
        backgroundColor: '#E7F6EC',
        borderColor: '#157F3B',
      },
      matchNumberBadgeFailure: {
        backgroundColor: '#FDEDEC',
        borderColor: '#B42318',
      },
      matchNumberText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#5F6B7A',
      },
      matchNumberTextNeutral: {
        color: '#5F6B7A',
      },
      matchNumberTextSuccess: {
        color: '#157F3B',
      },
      matchNumberTextFailure: {
        color: '#B42318',
      },
      lastRow: {
        borderBottomWidth: 0,
      },
      full15Row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#D8E1E1',
        position: 'relative',
        gap: 12,
        backgroundColor: '#FFFFFF',
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
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '700',
      },
      full15OptionsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
      },
      full15UserInfo: {
        marginTop: 2,
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
        gap: 5,
        marginTop: 4,
      },
      rowText: {
        fontSize: 15,
        color: '#17202A',
        lineHeight: 21,
        fontWeight: '700',
        flexShrink: 1,
      },
      elige8Badge: {
        minWidth: 24,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: palette.accent,
        color: palette.white,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        overflow: 'hidden',
      },
      elige8Toggle: {
        minWidth: 34,
        height: 24,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#8CBFE2',
        backgroundColor: palette.white,
        alignItems: 'center',
        justifyContent: 'center',
      },
      elige8ToggleActive: {
        borderColor: palette.accent,
        backgroundColor: palette.accent,
      },
      elige8ToggleDisabled: {
        opacity: 0.6,
      },
      elige8ToggleText: {
        color: '#5F6B7A',
        fontSize: 12,
        fontWeight: '800',
      },
      elige8ToggleTextActive: {
        color: '#FFFFFF',
      },
      elige8SwitchGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      elige8SwitchLabel: {
        color: '#17202A',
        fontSize: 12,
        fontWeight: '800',
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
