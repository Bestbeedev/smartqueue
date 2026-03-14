import { useThemeColors } from './useThemeColors';

/**
 * Hook utilitaire pour créer des styles dynamiques basés sur le thème
 * Permet de créer facilement des styles qui changent selon le mode dark/light
 * 
 * @example
 * const { styles, colors } = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *     padding: 16,
 *   },
 *   text: {
 *     color: colors.textPrimary,
 *   },
 * }));
 */
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (colors: ReturnType<typeof useThemeColors>) => T
) => {
  const colors = useThemeColors();
  const styles = styleFactory(colors);
  
  return { styles, colors };
};

/**
 * Hook pour obtenir les styles de carte dynamiques
 */
export const useCardStyles = () => {
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;
  
  return {
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: isDark ? 4 : 2,
    },
    cardElevated: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: isDark ? 6 : 4,
    },
  };
};

/**
 * Hook pour obtenir les styles de texte dynamiques
 */
export const useTextStyles = () => {
  const colors = useThemeColors();
  
  return {
    title: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      color: colors.textPrimary,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: colors.textTertiary,
    },
    button: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.primary,
    },
  };
};

/**
 * Hook pour obtenir les couleurs de gradient dynamiques selon le thème
 */
export const useGradientColors = () => {
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;
  
  return {
    primary: isDark 
      ? ['#1E3A5F', '#2563EB', '#3B82F6'] 
      : ['#3B82F6', '#2563EB', '#1D4ED8'],
    header: isDark
      ? ['#0F172A', '#1E3A5F', '#1E40AF']
      : ['#1E40AF', '#3B82F6', '#60A5FA'],
    success: ['#10B981', '#059669', '#047857'],
    danger: ['#EF4444', '#DC2626', '#B91C1C'],
    warning: ['#F59E0B', '#D97706', '#B45309'],
  };
};

export default useThemedStyles;
