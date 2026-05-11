export const colors = {
  // Auth gradient (linear 180deg, top → bottom)
  gradientAuthColors: ['#6A7472', '#D7E0DD', '#FEFFFF'] as const,
  gradientAuthLocations: [0.1683, 0.8702, 1.0] as const,

  // Backgrounds
  backgroundApp: '#E8EAEC',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#0A0A0A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textPlaceholder: '#808A88',
  textOnPrimary: '#FFF0F0',
  textInverted: '#FFFFFF',

  // Actions
  primary: '#151515',
  inputAuthBg: 'rgba(255,255,255,0.10)',
  inputAppBg: '#FFFFFF',
  divider: 'rgba(0,0,0,0.08)',

  // States
  success: '#22C55E',
  successBg: '#DCFCE7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  pending: '#6B7280',
  pendingBg: '#F3F4F6',
} as const;

export const typography = {
  display: {
    fontSize: 40,
    fontWeight: '400' as const,
    letterSpacing: -2,
    lineHeight: 40,
  },
  h1: {
    fontSize: 30,
    fontWeight: '400' as const,
    letterSpacing: -1,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
  },
  price: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 38,
  },
  link: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.48,
    lineHeight: 22,
    textDecorationLine: 'underline' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  full: 9999,
  xl: 16,
  lg: 12,
  md: 8,
  sm: 4,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Font families — loaded via @expo-google-fonts/inter
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
