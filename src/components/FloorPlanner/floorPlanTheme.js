import useFloorPlannerStore from '../../store/floorPlannerStore';

export const getFloorTheme = (isDark) => isDark ? {
  /* ── Page chrome ─────────────────────────────────────────── */
  bg:             '#080f1a',
  panel:          '#0d1829',
  panelHeader:    '#0a1120',
  panelSecond:    '#0a1120',
  panelTertiary:  '#060d18',
  border:         '#1e3050',
  borderSubtle:   '#0f1f35',
  hover:          '#0f1f35',
  hoverStrong:    '#162236',
  /* ── Text ────────────────────────────────────────────────── */
  text:           '#e2e8f0',
  textSub:        '#94a3b8',
  textMuted:      '#64748b',
  textDimmer:     '#475569',
  /* ── Inputs ──────────────────────────────────────────────── */
  inputBg:        '#0d1829',
  inputBorder:    '#1e3050',
  inputText:      '#e2e8f0',
  /* ── Semantic (unchanged between modes) ──────────────────── */
  accent:         '#0EA5E9',
  accentDark:     '#0284C7',
  accentBg:       'rgba(14,165,233,0.15)',
  danger:         '#EF4444',
  dangerBg:       'rgba(239,68,68,0.12)',
  success:        '#22C55E',
  warning:        '#F59E0B',
  navy:           '#0D1B2E',
  /* ── Canvas drawing tokens ───────────────────────────────── */
  canvasBg:       '#1a2332',
  grid1:          'rgba(255,255,255,0.04)',
  grid2:          'rgba(255,255,255,0.07)',
  grid3:          'rgba(255,255,255,0.13)',
  gridAxis:       'rgba(255,255,255,0.18)',
  scaleBg:        'rgba(15,23,42,0.85)',
  scaleStroke:    '#475569',
  scaleText:      '#94a3b8',
  roomLabel:      'rgba(255,255,255,0.75)',
  compassBg:      'rgba(15,23,42,0.85)',
  compassBorder:  'rgba(255,255,255,0.15)',
  furnSymbol:     'rgba(255,255,255,0.3)',
  isDark: true,
} : {
  /* ── Page chrome ─────────────────────────────────────────── */
  bg:             '#EEF2F7',
  panel:          '#FFFFFF',
  panelHeader:    '#F8FAFC',
  panelSecond:    '#FAFBFC',
  panelTertiary:  '#F4F6FA',
  border:         '#E2E8F0',
  borderSubtle:   '#F1F5F9',
  hover:          '#F8FAFC',
  hoverStrong:    '#F1F5F9',
  /* ── Text ────────────────────────────────────────────────── */
  text:           '#1E293B',
  textSub:        '#64748B',
  textMuted:      '#94A3B8',
  textDimmer:     '#CBD5E1',
  /* ── Inputs ──────────────────────────────────────────────── */
  inputBg:        '#FFFFFF',
  inputBorder:    '#E2E8F0',
  inputText:      '#1E293B',
  /* ── Semantic (unchanged between modes) ──────────────────── */
  accent:         '#0EA5E9',
  accentDark:     '#0284C7',
  accentBg:       'rgba(14,165,233,0.15)',
  danger:         '#EF4444',
  dangerBg:       'rgba(239,68,68,0.1)',
  success:        '#22C55E',
  warning:        '#F59E0B',
  navy:           '#0D1B2E',
  /* ── Canvas drawing tokens ───────────────────────────────── */
  canvasBg:       '#DCDCDC',
  grid1:          'rgba(0,0,0,0.055)',
  grid2:          'rgba(0,0,0,0.10)',
  grid3:          'rgba(0,0,0,0.18)',
  gridAxis:       'rgba(0,0,0,0.22)',
  scaleBg:        'rgba(255,255,255,0.82)',
  scaleStroke:    '#555',
  scaleText:      '#333',
  roomLabel:      'rgba(0,0,0,0.45)',
  compassBg:      'rgba(255,255,255,0.85)',
  compassBorder:  'rgba(0,0,0,0.18)',
  furnSymbol:     'rgba(0,0,0,0.25)',
  isDark: false,
};

export const useFloorTheme = () => {
  const isDark = useFloorPlannerStore((s) => s.isDark);
  return getFloorTheme(isDark);
};
