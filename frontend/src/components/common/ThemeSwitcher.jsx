import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <label className="theme-switcher me-3">
      <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
      <span className="slider"></span>
    </label>
  );
};

export default ThemeSwitcher;
