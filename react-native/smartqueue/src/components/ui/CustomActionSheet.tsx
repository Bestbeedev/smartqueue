import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';

const { width } = Dimensions.get('window');

export interface Option {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface CustomActionSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  options: Option[];
  selectedValue?: string | number;
  onSelect: (value: string | number) => void;
  onClose: () => void;
  type?: 'info' | 'warning' | 'success';
}

const config = {
  info: {
    icon: 'options' as const,
    iconBgColor: '#3B82F6',
    headerBgColor: '#93C5FD',
  },
  warning: {
    icon: 'notifications' as const,
    iconBgColor: '#F97316',
    headerBgColor: '#FDBA74',
  },
  success: {
    icon: 'checkmark-circle' as const,
    iconBgColor: '#22C55E',
    headerBgColor: '#86EFAC',
  },
};

export const CustomActionSheet: React.FC<CustomActionSheetProps> = ({
  visible,
  title,
  message,
  options,
  selectedValue,
  onSelect,
  onClose,
  type = 'info',
}) => {
  const colors = useThemeColors();
  const isDark = !!colors.dark?.background;
  const theme = config[type];

  const handleSelect = (value: string | number) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header with Icon */}
          <View style={[styles.header, { backgroundColor: theme.headerBgColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.iconBgColor }]}>
              <Ionicons name={theme.icon} size={28} color="#FFFFFF" />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}

            {/* Options List */}
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((option, index) => {
                const isSelected = selectedValue === option.value;
                const isLast = index === options.length - 1;

                return (
                  <TouchableOpacity
                    key={`${index}-${String(option.value)}`}
                    style={[
                      styles.optionButton,
                      { backgroundColor: colors.inputBackground },
                      isSelected && { backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary },
                      !isLast && { borderColor: colors.primary },
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      {option.icon && (
                        <Ionicons
                          name={option.icon}
                          size={22}
                          color={isSelected ? colors.primary : colors.textSecondary}
                          style={styles.optionIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          { color: isSelected ? colors.primary : colors.textPrimary },
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    height: 70,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  optionsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  optionButtonBorder: {
    borderColor: '#3B82F6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomActionSheet;
