import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f2ff', // More purple, less pink
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 24,
    backgroundColor: '#f5f2ff', // More purple, less pink
    position: 'relative',
  },
  tableContainer: {
    width: '100%',
  },
  tableScrollView: {
    flex: 1,
  },
  tableContent: {
    minWidth: 800, // Ensure minimum width for proper table display
    flex: 1, // Allow content to expand
  },
  stickyLeftContainer: {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A1A7A', // Brand purple
    marginBottom: 20,
    paddingLeft: 8,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3a52',
    marginBottom: 12,
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#47536b',
  },
  listContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#ede5ff', // More purple, less pink
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  position: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A1A7A', // Brand purple
    textAlign: 'center',
  },
  resultKey: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A1A7A', // Brand purple
    textAlign: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2a4b',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  successMetric: {
    fontSize: 16,
    fontWeight: '600',
    color: '#47536b',
    textAlign: 'center',
  },
  labelCell: {
    paddingHorizontal: 12,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2a4b',
  },
  valuePositive: {
    color: '#1db954',
  },
  valueNegative: {
    color: '#e53935',
  },
  metricCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    backgroundColor: '#f8fafc',
  },
  totalText: {
    fontWeight: '700',
  },
  columnDivider: {
    borderRightWidth: 1,
    borderRightColor: '#e1e6f3',
    paddingRight: 0,
    marginRight: 0,
  },
  balance: {
    width: 100,
    fontSize: 16,
    fontWeight: '600',
    color: '#47536b',
    textAlign: 'center',
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3a52',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerLabelPositive: {
    color: '#1db954',
  },
  headerLabelNegative: {
    color: '#e53935',
  },
  separator: {
    height: 1,
    backgroundColor: '#e1e6f3',
    marginHorizontal: 20,
  },
  elige8Badge: {
    backgroundColor: '#2d6cdf',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elige8BadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 15,
    color: '#6b7693',
  },
  webContent: {
    flexGrow: 1,
  },
  mobileScrollView: {
    flex: 1,
  },
  mobileContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding to extend below tabs
  },
  userCapsule: {
    backgroundColor: '#d6c6f7', // lilac
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999, // capsule effect
    alignSelf: 'center', // center within the cell container
    marginTop: 2,
    marginBottom: 2,
  },
  userCapsuleText: {
    color: '#4b2773', // dark lilac for contrast
    fontWeight: '500',
    fontSize: 13,
  },
  balanceContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  balancePositive: {
    color: '#1db954', // green
  },
  balanceNegative: {
    color: '#e53935', // red
  },
  balanceBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  balanceBadgePositive: {
    backgroundColor: '#1db954',
  },
  balanceBadgeNegative: {
    backgroundColor: '#e53935',
  },
  balanceBadgeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  balanceBadgeGlow: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(45,108,223,0.25)',
    zIndex: 40,
  },

  balanceBadgeRing: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    zIndex: 45,
  },
  headerUserBadge: {
    backgroundColor: '#fff5f2', // light orange background
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35', // logo orange border
    alignSelf: 'center',
  },
});

export default styles;
