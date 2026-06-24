import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addToastListener } from '../../utils/toast';
import styles from './ToastHost.styles';

const TOAST_DURATION = 4000;
const ANIMATION_DURATION = 200;

const ToastHost = () => {
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
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
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      hideTimeout.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
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

  if (Platform.OS === 'android' || !toast) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: Math.max(insets.top + 12, 24) }]}
    >
      <Animated.View
        style={[
          styles.toast,
          styles[toast.type],
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.toastText}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
};

export default ToastHost;
