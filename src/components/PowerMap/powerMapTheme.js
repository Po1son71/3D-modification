import usePowerMapStore from '../../store/powerMapStore';

export const getTheme = (isDark) => isDark ? {
  /* ── Backgrounds ──────────────────────────────────────────── */
  canvasBg:         '#080f1a',
  paletteBg:        'linear-gradient(180deg,#0d1829 0%,#0a1120 100%)',
  propsBg:          'linear-gradient(180deg,#0a1120 0%,#080f1a 100%)',
  cardBg:           'linear-gradient(160deg,#141e30 0%,#0d1421 100%)',
  minimapBg:        '#0d1829',
  panelFloatBg:     'rgba(8,15,26,0.85)',
  headerBg:         'rgba(0,0,0,0.3)',
  subBg:            'rgba(0,0,0,0.2)',
  iconAreaBg:       'rgba(0,0,0,0.15)',
  nameBg:           'rgba(0,0,0,0.2)',
  paletteItemBg:    'rgba(30,48,80,0.5)',
  paletteItemHover: 'rgba(30,58,110,0.7)',
  /* ── Borders ──────────────────────────────────────────────── */
  border:           '#1e3050',
  borderSubtle:     '#0f1f35',
  divider:          '#334155',
  nameBorder:       'rgba(255,255,255,0.05)',
  regionBorder:     'rgba(148,163,184,0.3)',
  regionBg:         'rgba(15,23,42,0.4)',
  regionLabelBg:    '#0f1923',
  /* ── Text ─────────────────────────────────────────────────── */
  textPrimary:      '#e2e8f0',
  textSecondary:    '#94a3b8',
  textMuted:        '#64748b',
  textDimmer:       '#475569',
  sectionColor:     '#334155',
  nameColor:        '#cbd5e1',
  nameColorActive:  '#d1fae5',
  statusOffColor:   '#334155',
  /* ── Inputs ───────────────────────────────────────────────── */
  inputBg:          '#0d1829',
  inputBorder:      '#1e3050',
  inputColor:       '#cbd5e1',
  /* ── Handles ─────────────────────────────────────────────── */
  handleBg:         '#0f172a',
  handleBorder:     '#334155',
  /* ── Canvas dots ─────────────────────────────────────────── */
  dotColor:         '#1a2744',
  isDark: true,
} : {
  /* ── Backgrounds ──────────────────────────────────────────── */
  canvasBg:         '#f1f5f9',
  paletteBg:        'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
  propsBg:          'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
  cardBg:           'linear-gradient(160deg,#ffffff 0%,#f8fafc 100%)',
  minimapBg:        '#ffffff',
  panelFloatBg:     'rgba(241,245,249,0.92)',
  headerBg:         'rgba(0,0,0,0.04)',
  subBg:            'rgba(0,0,0,0.02)',
  iconAreaBg:       'rgba(0,0,0,0.03)',
  nameBg:           'rgba(0,0,0,0.03)',
  paletteItemBg:    'rgba(241,245,249,0.9)',
  paletteItemHover: 'rgba(226,232,240,1)',
  /* ── Borders ──────────────────────────────────────────────── */
  border:           '#cbd5e1',
  borderSubtle:     '#e2e8f0',
  divider:          '#e2e8f0',
  nameBorder:       'rgba(0,0,0,0.06)',
  regionBorder:     'rgba(71,85,105,0.25)',
  regionBg:         'rgba(241,245,249,0.6)',
  regionLabelBg:    '#f1f5f9',
  /* ── Text ─────────────────────────────────────────────────── */
  textPrimary:      '#1e293b',
  textSecondary:    '#475569',
  textMuted:        '#64748b',
  textDimmer:       '#94a3b8',
  sectionColor:     '#94a3b8',
  nameColor:        '#1e293b',
  nameColorActive:  '#166534',
  statusOffColor:   '#cbd5e1',
  /* ── Inputs ───────────────────────────────────────────────── */
  inputBg:          '#f8fafc',
  inputBorder:      '#cbd5e1',
  inputColor:       '#1e293b',
  /* ── Handles ─────────────────────────────────────────────── */
  handleBg:         '#e2e8f0',
  handleBorder:     '#94a3b8',
  /* ── Canvas dots ─────────────────────────────────────────── */
  dotColor:         '#c8d5e8',
  isDark: false,
};

export const useTheme = () => {
  const isDark = usePowerMapStore((s) => s.isDark);
  return getTheme(isDark);
};
