import { useState, useCallback } from 'react';
import { CustomAlert, AlertType } from '../components/ui/CustomAlert';
import React from 'react';

interface AlertOptions {
  type: AlertType;
  title: string;
  message: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  onClose?: () => void;
}

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  onClose?: () => void;
}

export const useCustomAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    const primaryButton = options.primaryButtonText
      ? {
          text: options.primaryButtonText,
          onPress: () => {
            hideAlert();
            options.onPrimaryPress?.();
          },
        }
      : undefined;

    const secondaryButton = options.secondaryButtonText
      ? {
          text: options.secondaryButtonText,
          onPress: () => {
            hideAlert();
            options.onSecondaryPress?.();
          },
        }
      : undefined;

    setAlert({
      visible: true,
      type: options.type,
      title: options.title,
      message: options.message,
      primaryButton,
      secondaryButton,
      onClose: () => {
        hideAlert();
        options.onClose?.();
      },
    });
  }, [hideAlert]);

  const showSuccess = useCallback(
    (title: string, message: string, buttonText = 'OK', onPress?: () => void) => {
      showAlert({
        type: 'success',
        title,
        message,
        primaryButtonText: buttonText,
        onPrimaryPress: onPress,
      });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title: string, message: string, buttonText = 'OK', onPress?: () => void) => {
      showAlert({
        type: 'error',
        title,
        message,
        primaryButtonText: buttonText,
        onPrimaryPress: onPress,
      });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (
      title: string,
      message: string,
      primaryText = 'OK',
      onPrimaryPress?: () => void,
      secondaryText?: string,
      onSecondaryPress?: () => void
    ) => {
      showAlert({
        type: 'warning',
        title,
        message,
        primaryButtonText: primaryText,
        onPrimaryPress,
        secondaryButtonText: secondaryText,
        onSecondaryPress,
      });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (title: string, message: string, buttonText = 'OK', onPress?: () => void) => {
      showAlert({
        type: 'info',
        title,
        message,
        primaryButtonText: buttonText,
        onPrimaryPress: onPress,
      });
    },
    [showAlert]
  );

  const AlertComponent = React.createElement(CustomAlert, {
    visible: alert.visible,
    type: alert.type,
    title: alert.title,
    message: alert.message,
    primaryButton: alert.primaryButton,
    secondaryButton: alert.secondaryButton,
    onClose: alert.onClose,
  });

  return {
    AlertComponent,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
  };
};

export default useCustomAlert;
