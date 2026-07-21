// theme/tokens.js
// Single source of truth for the visual language.
// Every screen and component pulls from here — never hardcode a color or
// spacing value inline. This is what keeps the app feeling like one product.

export const colors = {
  // Base surfaces
  bgBase: '#08090A',        // matte black, the canvas
  bgElevated: '#0F1113',    // slightly lifted panels (bottom nav, sheets)
  bgCard: 'rgba(255,255,255,0.045)',   // glass card fill
  borderGlass: 'rgba(255,255,255,0.09)',
  borderGlassStrong: 'rgba(255,255,255,0.16)',

  // Emerald system — the "intelligence" signal
  emerald: '#12E19B',       // primary accent, bright / active states
  emeraldDeep: '#0B9E6D',   // pressed / secondary accent
  emeraldGlow: 'rgba(18,225,155,0.35)',
  emeraldFaint: 'rgba(18,225,155,0.10)',

  // Typography
  textPrimary: '#F5F7F6',
  textSecondary: '#9AA3A0',
  textTertiary: '#5F6764',
  textOnEmerald: '#02120C',

  // Status
  live: '#FF5A5F',
  liveGlow: 'rgba(255,90,95,0.25)',
};

export const gradients = {
  // Ambient background wash behind the whole screen
  ambient: ['#0B1210', '#08090A', '#08090A'],
  // Used on the primary CTA
  cta: ['#1BFFB0', '#0B9E6D'],
  // Subtle sheen on glass cards
  cardSheen: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.00)'],
  // Avatar core
  avatarCore: ['#3CFFC4', '#0B9E6D'],
};

export const type = {
  // Display: for greetings, big scores, headline numbers
  display: { fontFamily: 'SpaceGrotesk-Medium', letterSpacing: -0.5 },
  displaySemiBold: { fontFamily: 'SpaceGrotesk-SemiBold', letterSpacing: -0.5 },
  // Body: everyday UI text
  body: { fontFamily: 'Inter-Regular' },
  bodyMedium: { fontFamily: 'Inter-Medium' },
  bodySemiBold: { fontFamily: 'Inter-SemiBold' },
  // Mono: scores, timestamps, odds-adjacent data — gives a "system" feel
  mono: { fontFamily: 'JetBrainsMono-Medium' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  glowEmerald: {
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
};
