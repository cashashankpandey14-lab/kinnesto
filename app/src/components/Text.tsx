import { forwardRef } from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps, type TextStyle } from 'react-native';
import { fonts } from '@/lib/theme';

// Custom fonts need a family per weight, so map fontWeight to the right file.
// 900 is the display face (Bricolage Grotesque); everything else is Plus Jakarta Sans.
function withFont(style: TextProps['style']) {
  const s = (StyleSheet.flatten(style) || {}) as TextStyle;
  if (s.fontFamily) return style;
  const w = String(s.fontWeight ?? '400');
  const fontFamily = w === '900' ? fonts.display : w === '800' ? fonts.extrabold : w === '700' || w === 'bold' ? fonts.bold : w === '600' ? fonts.semibold : w === '500' ? fonts.medium : fonts.regular;
  return [style, { fontFamily, fontWeight: 'normal' as const }];
}

export const Text = forwardRef<RNText, TextProps>(function Text(props, ref) {
  return <RNText ref={ref} {...props} style={withFont(props.style)} />;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(props, ref) {
  return <RNTextInput ref={ref} {...props} style={withFont(props.style)} />;
});
