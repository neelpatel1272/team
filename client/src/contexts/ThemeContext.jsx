import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const WALLPAPER_PRESETS = [
  {
    id: 'default',
    name: 'Default Clean',
    category: 'Minimal',
    preview: 'var(--color-bg)',
    style: 'transparent',
  },
  {
    id: 'subtle-dots',
    name: 'Soft Polka Dots',
    category: 'Pattern',
    preview: 'radial-gradient(circle, #6366f1 1.5px, #f1f5f9 1.5px)',
    style: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 1.5px, transparent 1.5px) 0 0 / 22px 22px',
  },
  {
    id: 'geometric-grid',
    name: 'Blueprint Grid',
    category: 'Pattern',
    preview: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, #f8fafc 1px)',
    style: 'linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px) 0 0 / 24px 24px',
  },
  {
    id: 'teams-purple',
    name: 'Teams Lavender',
    category: 'Gradient',
    preview: 'linear-gradient(135deg, #6366f1, #a855f7)',
    style: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.16))',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Teal',
    category: 'Gradient',
    preview: 'linear-gradient(135deg, #0284c7, #14b8a6)',
    style: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(20, 184, 166, 0.15))',
  },
  {
    id: 'sunset-amber',
    name: 'Warm Sunset',
    category: 'Gradient',
    preview: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
    style: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(245, 158, 11, 0.15))',
  },
  {
    id: 'emerald-mint',
    name: 'Emerald Mint',
    category: 'Gradient',
    preview: 'linear-gradient(135deg, #059669, #10b981)',
    style: 'linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(16, 185, 129, 0.15))',
  },
  {
    id: 'midnight-nebula',
    name: 'Dark Nebula',
    category: 'Dark',
    preview: 'linear-gradient(135deg, #1e1b4b, #3b0764)',
    style: 'linear-gradient(135deg, rgba(30, 27, 75, 0.38), rgba(59, 7, 100, 0.42))',
  },
  {
    id: 'cyber-dark',
    name: 'Cyber Horizon',
    category: 'Dark',
    preview: 'linear-gradient(135deg, #0f172a, #0369a1)',
    style: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4), rgba(3, 105, 161, 0.25))',
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('workwave_theme') || 'system');
  const [chatBackground, setChatBackground] = useState(() => localStorage.getItem('workwave_chat_bg') || 'default');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('workwave_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const preset = WALLPAPER_PRESETS.find((p) => p.id === chatBackground);
    let appliedStyle = 'transparent';

    if (preset) {
      appliedStyle = preset.style;
    } else if (chatBackground && chatBackground !== 'default') {
      if (chatBackground.startsWith('http') || chatBackground.startsWith('data:')) {
        appliedStyle = `url("${chatBackground}") no-repeat center center / cover`;
      } else {
        appliedStyle = chatBackground;
      }
    }

    root.style.setProperty('--chat-background-style', appliedStyle);
    localStorage.setItem('workwave_chat_bg', chatBackground);
  }, [chatBackground]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'dark';
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemDark ? 'light' : 'dark';
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        chatBackground,
        setChatBackground,
        wallpaperPresets: WALLPAPER_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
