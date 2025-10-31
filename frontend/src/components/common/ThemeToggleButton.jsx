
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="btn btn-outline-secondary" onClick={toggleTheme}>
      {theme === 'light' ? (
        <i className="bi bi-moon-stars-fill"></i>
      ) : (
        <i className="bi bi-sun-fill"></i>
      )}
    </button>
  );
};

export default ThemeToggleButton;
