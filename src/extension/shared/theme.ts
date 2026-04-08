export type Theme = 'light' | 'dark' | 'system';

const THEME_VARS: Record<'light' | 'dark', Record<string, string>> = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f3f4f6',
    '--bg-tertiary': '#e5e7eb',
    '--text-primary': '#111827',
    '--text-secondary': '#4b5563',
    '--text-muted': '#9ca3af',
    '--border': '#d1d5db',
    '--accent': '#ADA587',
    '--accent-hover': '#9A9475',
    '--accent-text': '#ffffff',
    '--error': '#ef4444',
    '--warning': '#f59e0b',
    '--success': '#10b981',
    '--badge-poor': '#ef4444',
    '--badge-acceptable': '#f59e0b',
    '--badge-good': '#10b981',
    '--badge-excellent': '#ADA587',
  },
  dark: {
    '--bg-primary': '#1f2937',
    '--bg-secondary': '#111827',
    '--bg-tertiary': '#374151',
    '--text-primary': '#f9fafb',
    '--text-secondary': '#d1d5db',
    '--text-muted': '#6b7280',
    '--border': '#4b5563',
    '--accent': '#C2BB9E',
    '--accent-hover': '#ADA587',
    '--accent-text': '#1f2937',
    '--error': '#f87171',
    '--warning': '#fbbf24',
    '--success': '#34d399',
    '--badge-poor': '#f87171',
    '--badge-acceptable': '#fbbf24',
    '--badge-good': '#34d399',
    '--badge-excellent': '#C2BB9E',
  },
};

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyTheme(theme: Theme): void {
  const resolved = getResolvedTheme(theme);
  const vars = THEME_VARS[resolved];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', resolved);
}

export function watchSystemTheme(callback: (isDark: boolean) => void): void {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', (e) => callback(e.matches));
}
