import {DefaultTheme} from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8B5CF6', // Purple primary from ClarityLog
    accent: '#EC4899', // Pink accent
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937',
    disabled: '#9CA3AF',
    placeholder: '#6B7280',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: '#374151',
    notification: '#10B981',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
  roundness: 12,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
  },
};

export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    onSurface: '#E5E7EB',
    disabled: '#6B7280',
    placeholder: '#9CA3AF',
  },
};