export const reviewTheme = {
  surface: '#F7F4EE',
  surfaceAlt: '#EFEAE1',
  surfaceCard: '#FFFFFF',
  ink: '#1F1E1B',
  inkMute: '#605C54',
  inkSoft: '#8A857A',
  accent: '#D97757',
  accentSoft: '#F5D9C9',
  accentDeep: '#B25A3D',
  modifiedColor: '#8A6B2E',
  keptColor: '#5A7A5A',
  newColor: '#D97757',
  danger: '#C9483B',
  border: 'rgba(31,30,27,0.12)',
  borderStrong: 'rgba(31,30,27,0.24)',
  shadow: '0 6px 24px rgba(31,30,27,0.10)',
  shadowSm: '0 2px 8px rgba(31,30,27,0.06)',
  radius: 12,
  radiusSm: 8,
  fontMono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
  fontSans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
};

export const changeTypeColor = (t: 'NEW' | 'MODIFIED' | 'KEPT') => {
  switch (t) {
    case 'NEW': return reviewTheme.newColor;
    case 'MODIFIED': return reviewTheme.modifiedColor;
    case 'KEPT': return reviewTheme.keptColor;
  }
};

export const changeTypeLabel = (t: 'NEW' | 'MODIFIED' | 'KEPT') => {
  switch (t) {
    case 'NEW': return '新增';
    case 'MODIFIED': return '修改';
    case 'KEPT': return '保留';
  }
};
