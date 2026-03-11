import { useMemo } from 'react';
import { useSettings } from '../store/settingsStore';
import { Theme, Colors } from '../theme';

export const useThemeColors = () => {
  const { isDarkMode } = useSettings();

  const colors = useMemo(() => {
    if (!isDarkMode) {
      return Colors;
    }

    // Merge light colors with dark overrides
    return {
      ...Colors,
      ...Colors.dark,
    };
  }, [isDarkMode]);

  return colors;
};

export default useThemeColors;
