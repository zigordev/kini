import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  NativeModules,
  Platform,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addToastListener } from '../../utils/toast';
import styles from './ToastHost.styles';

const TOAST_DURATION = 4000;
const ANIMATION_DURATION = 200;
type ToastType = 'error' | 'info' | 'success' | 'warning';

const toastIcons: Record<ToastType, ComponentProps<typeof Ionicons>['name']> = {
  error: 'alert-circle',
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'warning',
};

const toastColors: Record<ToastType, string> = {
  error: '#B42318',
  info: '#0A70B5',
  success: '#157F3B',
  warning: '#A96A00',
};

const ToastHost = () => {
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: ToastType;
  } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'android') {
      return undefined;
    }

    const unsubscribe = addToastListener((nextMessage, type = 'info') => {
      const toastType =
        type === 'error' || type === 'success' || type === 'warning'
          ? type
          : 'info';

      if (Platform.OS === 'ios') {
        NativeModules.KiniNativeToast?.show(nextMessage, toastType);
        return;
      }

      setToast({ id: Date.now(), message: nextMessage, type: toastType });

      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }

      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(0);
      translateY.setValue(-20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      hideTimeout.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start(({ finished }) => {
          if (finished) {
            setToast(null);
          }
        });
      }, TOAST_DURATION);
    });

    return () => {
      unsubscribe?.();
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    };
  }, [opacity, translateY]);

  if (Platform.OS === 'android' || Platform.OS === 'ios' || !toast) {
    return null;
  }

  const accentStyle = {
    error: styles.errorAccent,
    info: styles.infoAccent,
    success: styles.successAccent,
    warning: styles.warningAccent,
  }[toast.type];
  const iconShellStyle = {
    error: styles.errorIconShell,
    info: styles.infoIconShell,
    success: styles.successIconShell,
    warning: styles.warningIconShell,
  }[toast.type];

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: Math.max(insets.top + 12, 24) }]}
    >
      <Animated.View
        style={[
          styles.toast,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.accent, accentStyle]} />
        <View style={[styles.iconShell, iconShellStyle]}>
          <Ionicons
            name={toastIcons[toast.type]}
            size={18}
            color={toastColors[toast.type]}
          />
        </View>
        <Text style={styles.toastText}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
};

export default ToastHost;
