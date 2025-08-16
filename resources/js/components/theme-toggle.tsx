import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="h-4 w-4" />;
    }
    return <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === 'dark') {
      return 'Dark mode';
    } else if (theme === 'light') {
      return 'Light mode';
    }
    return 'System theme';
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2"
      title={`Current: ${getLabel()}. Click to toggle.`}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </Button>
  );
}