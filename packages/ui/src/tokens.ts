export const colors = {
  // Brand
  ink:        '#0C1B33',
  inkHover:   '#162847',
  teal:       '#00C8A0',
  tealLight:  '#E8F8F4',
  tealDark:   '#009E7E',

  // Surfaces
  white:      '#FFFFFF',
  warmWhite:  '#FFFCF7',
  bg:         '#F7F8FA',
  surface:    '#FFFFFF',

  // Borders
  border:      '#E5E7EB',
  borderLight: '#F3F4F6',

  // Text
  textPrimary:   '#111827',
  textSecondary: '#4B5563',
  textMuted:     '#9CA3AF',

  // Semantic
  success:   '#059669',
  successBg: '#ECFDF5',
  danger:    '#DC2626',
  dangerBg:  '#FEF2F2',
  warning:   '#D97706',
  warningBg: '#FFFBEB',
  info:      '#2563EB',
  infoBg:    '#EFF6FF',

  // Legacy aliases for backward compat
  primary:    '#0C1B33',
  primaryDark:'#162847',
  tableHeader:'#F9FAFB',
} as const

export const radius = { sm: 6, md: 10, lg: 16 } as const
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const
