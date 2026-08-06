// ============================================================
// COLOUR PALETTE
// ============================================================
export const colors = {
  // ---- Brand ----
  primary: '#6c63ff',       // vibrant indigo-violet
  primaryLight: '#9b94ff',
  primaryDark: '#4a41d0',

  secondary: '#ff6584',     // coral-pink accent
  secondaryLight: '#ff8fa3',

  success: '#22c55e',
  successLight: '#4ade80',
  warning: '#f59e0b',
  warningLight: '#fcd34d',
  error: '#ef4444',
  errorLight: '#fca5a5',
  info: '#38bdf8',

  // ---- Dark theme (default) ----
  dark: {
    background: '#0f1117',
    surface: '#1a1d27',
    surfaceElevated: '#21263a',
    card: '#1e2235',
    border: '#2e3354',
    borderSubtle: '#252940',
    text: '#f1f3f9',
    textSecondary: '#8b90b3',
    textMuted: '#555c7c',
    icon: '#8b90b3',
    tabBar: '#13151f',
    statusBar: 'dark',
  },

  // ---- Light theme ----
  light: {
    background: '#f5f6fb',
    surface: '#ffffff',
    surfaceElevated: '#f0f2ff',
    card: '#ffffff',
    border: '#e2e5f0',
    borderSubtle: '#eceef8',
    text: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    icon: '#4b5563',
    tabBar: '#ffffff',
    statusBar: 'light',
  },
} as const;

export type ColorScheme = 'dark' | 'light';
