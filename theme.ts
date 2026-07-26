export const colors = {
  bgPrimary: "#FAF8F5",
  bgSecondary: "#F2EFEB",
  bgSurface: "#FFFFFF",
  bgSurfaceElevated: "#FAFAF8",
  bgInput: "#F0EDE8",
  accentBlue: "#003153",
  accentVolt: "#88BB00",
  accentCoral: "#E62E50",
  accentAmber: "#D4952B",
  textPrimary: "#111110",
  textSecondary: "#6B6B6B",
  textTertiary: "#9E9E9E",
  borderDefault: "#E8E5E0",
  borderSubtle: "#F0EEE9",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const typography = {
  displayHero: {
    fontSize: 48,
    fontWeight: "900" as const,
    lineHeight: 1.2 * 48,
  },
  displayLarge: {
    fontSize: 36,
    fontWeight: "800" as const,
    lineHeight: 1.2 * 36,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 1.2 * 28,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 1.3 * 20,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 1.5 * 16,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 1.5 * 16,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 1.4 * 13,
  },
  captionMono: {
    fontSize: 12,
    fontWeight: "400" as const,
    fontFamily: undefined as string | undefined,
    lineHeight: 1.4 * 12,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 1.3 * 11,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 1.3 * 16,
  },
} as const;

export const runTypeColors: Record<string, string> = {
  easy: "#4A9E7B",
  tempo: colors.accentBlue,
  long: colors.accentAmber,
  race: "#DC2626",
};

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  runTypeColors,
} as const;
