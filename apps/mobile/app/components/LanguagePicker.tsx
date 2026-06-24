import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { updateLanguage } from '../services/users.service';

const LANGS = [
  {
    code: 'en',
    labelKey: 'language.english',
    flag: '🇬🇧',
    flagType: 'emoji' as const,
  },
  {
    code: 'es',
    labelKey: 'language.spanish',
    flag: '🇪🇸',
    flagType: 'emoji' as const,
  },
];

const LanguagePicker = () => {
  const { i18n, t } = useTranslation();

  const current = i18n.language?.slice(0, 2) || 'en';

  const onSelect = useCallback(
    async (code: string) => {
      try {
        await i18n.changeLanguage(code);
        if (Platform.OS !== 'web') {
          // Persist manually for native; web is handled by detector localStorage
          try {
            // AsyncStorage may not be available; avoid importing if not installed
            // Use localStorage on web already; noop here.
          } catch {}
        }
        await updateLanguage(code as 'en' | 'es');
      } catch (e) {
        console.warn('Failed to change language', e);
      }
    },
    [i18n],
  );

  const items = useMemo(
    () => LANGS.map((l) => ({ ...l, label: t(l.labelKey) })),
    [t],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.settingLabel}>{t('language.title')}</Text>
      </View>
      {Platform.OS === 'ios' || Platform.OS === 'android' ? (
        <View style={styles.selectContainer}>
          <Picker
            selectedValue={current}
            onValueChange={(value) => onSelect(String(value))}
            dropdownIconColor="#4A1A7A"
            mode="dropdown"
            style={styles.picker}
          >
            {items.map(({ code, label, flag }) => (
              <Picker.Item
                key={code}
                label={`${flag}  ${label}`}
                value={code}
              />
            ))}
          </Picker>
        </View>
      ) : (
        <View style={styles.selectContainer}>
          {React.createElement(
            'select',
            {
              value: current,
              onChange: (e: any) => onSelect(String(e.target?.value ?? 'en')),
              style: {
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid #C7D0EA',
                background: '#ffffff',
                color: '#2C3E50',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              },
            },
            items.map(({ code, label, flag }) =>
              React.createElement(
                'option',
                { key: code, value: code },
                `${flag}  ${label}`,
              ),
            ),
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A1A7A',
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: '#C7D0EA',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: '#2C3E50',
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D0EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  optionButtonActive: {
    borderColor: '#2d6cdf',
    backgroundColor: '#E7F0FF',
  },
  flagEmoji: {
    fontSize: 14,
  },
  flagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#2d6cdf',
  },
  flagBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  optionLabel: {
    color: '#2C3E50',
    fontSize: 14,
  },
  optionLabelActive: {
    color: '#2d6cdf',
    fontWeight: '600',
  },
});

export default LanguagePicker;
