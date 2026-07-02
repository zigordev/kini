import { Platform } from 'react-native';
import { createThemedStyleSheet } from '../theme/createThemedStyleSheet';
import { palette, radius, shadow } from '../theme/design';

const createStyles = (isDark = false) =>
  createThemedStyleSheet(
    {
      safeArea: {
        flex: 1,
        backgroundColor: palette.background,
      },
      scroll: {
        flex: 1,
        backgroundColor: palette.background,
      },
      content: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: Platform.OS === 'web' ? 32 : 20,
        paddingBottom: 48,
        gap: 24,
      },
      contentCompact: {
        paddingHorizontal: 18,
      },
      loadingContainer: {
        flex: 1,
        minHeight: 420,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      },
      loadingText: {
        fontSize: 15,
        color: palette.inkMuted,
      },
      hero: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: 18,
      },
      heroCompact: {
        flexDirection: 'column',
      },
      heroCopy: {
        flex: 1,
        maxWidth: 760,
        gap: 8,
      },
      eyebrow: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: palette.primarySoft,
        color: palette.primaryDark,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
      },
      title: {
        fontSize: 34,
        lineHeight: 40,
        fontWeight: '800',
        color: palette.ink,
      },
      subtitle: {
        fontSize: 16,
        lineHeight: 23,
        color: palette.inkMuted,
      },
      balanceCard: {
        minWidth: 240,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 18,
        gap: 8,
        ...shadow.card,
      },
      balanceValue: {
        fontSize: 36,
        fontWeight: '800',
        color: palette.ink,
      },
      balanceHelp: {
        fontSize: 13,
        color: palette.inkMuted,
      },
      summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
      },
      summaryCard: {
        flexGrow: 1,
        flexBasis: 180,
        minHeight: 116,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 16,
        gap: 8,
        justifyContent: 'space-between',
        ...shadow.card,
      },
      summaryLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: palette.inkMuted,
        textTransform: 'uppercase',
      },
      summaryValue: {
        fontSize: 24,
        fontWeight: '800',
        color: palette.ink,
      },
      valuePositive: {
        color: palette.success,
      },
      valueNegative: {
        color: palette.danger,
      },
      section: {
        gap: 12,
      },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 16,
        flexWrap: 'wrap',
      },
      sectionTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: palette.ink,
      },
      sectionHint: {
        maxWidth: 460,
        fontSize: 13,
        lineHeight: 19,
        color: palette.inkMuted,
      },
      leaderGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
      },
      leaderCard: {
        flexGrow: 1,
        flexBasis: 220,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 16,
        gap: 10,
      },
      leaderPosition: {
        fontSize: 13,
        fontWeight: '800',
        color: palette.primary,
      },
      leaderRate: {
        fontSize: 28,
        fontWeight: '800',
        color: palette.ink,
      },
      leaderMeta: {
        fontSize: 13,
        color: palette.inkMuted,
      },
      rankingPanel: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        overflow: 'hidden',
      },
      rankingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.backgroundSubtle,
        flexWrap: 'wrap',
      },
      rankCell: {
        width: 36,
        height: 36,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.primarySoft,
      },
      rankNumber: {
        fontSize: 14,
        fontWeight: '800',
        color: palette.primaryDark,
      },
      playerCell: {
        flex: 1,
        minWidth: 160,
      },
      userPill: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: radius.pill,
      },
      userPillText: {
        fontSize: 13,
        fontWeight: '800',
      },
      metricCell: {
        minWidth: 92,
        alignItems: 'flex-end',
      },
      metricValue: {
        fontSize: 17,
        fontWeight: '800',
        color: palette.ink,
      },
      metricLabel: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '700',
        color: palette.inkMuted,
        textTransform: 'uppercase',
      },
      breakdownGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
      },
      breakdownCard: {
        flexGrow: 1,
        flexBasis: 190,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 16,
        gap: 12,
      },
      breakdownCardTotal: {
        borderColor: palette.primary,
        backgroundColor: palette.primarySofter,
      },
      breakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      },
      breakdownKey: {
        fontSize: 20,
        fontWeight: '800',
        color: palette.ink,
      },
      breakdownRate: {
        fontSize: 18,
        fontWeight: '800',
        color: palette.primary,
      },
      progressTrack: {
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: palette.backgroundSubtle,
        overflow: 'hidden',
      },
      progressFill: {
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: palette.primary,
      },
      breakdownMeta: {
        gap: 4,
      },
      breakdownMetaText: {
        fontSize: 13,
        color: palette.inkMuted,
      },
      emptyText: {
        width: '100%',
        padding: 24,
        textAlign: 'center',
        fontSize: 15,
        color: palette.inkMuted,
      },
    },
    isDark,
  );

export { createStyles };
export default createStyles(false);
