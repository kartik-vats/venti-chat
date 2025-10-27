import { type ReactNode, useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen">
      <button
        className="fixed right-4 top-4 z-50 rounded-full border px-3 py-1 text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur hover:opacity-90"
        onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      {children}
    </div>
  );
}
