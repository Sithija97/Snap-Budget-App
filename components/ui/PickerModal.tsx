import { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { UIText } from './UIText';
import { useThemeColors } from '@/context/ThemeContext';
import { BRAND_BLUE } from '@/constants/colors';
import { AnimatedPressable } from './AnimatedPressable';

interface PickerModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
}

// Shared bottom-sheet-style shell for DateField/TimeField's custom pickers —
// both are fully custom-drawn (no native OS dialog involved at all), so this
// is what keeps their surrounding chrome (backdrop, card, header, Done
// button) visually identical and themeable with the app's own tokens instead
// of whatever a native dialog happens to render.
export function PickerModal({ visible, title, onClose, onConfirm, children }: PickerModalProps) {
  const { card: cardBg, border: borderColor, foreground: titleColor } = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 8,
              paddingBottom: 24,
              paddingHorizontal: 20,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: borderColor }} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                marginTop: 4,
              }}
            >
              <UIText size="lg" variant="unstyled" className="font-semibold" style={{ color: titleColor }}>
                {title}
              </UIText>
              <AnimatedPressable onPress={onConfirm} pressScale={0.95} contentStyle={{ paddingVertical: 6, paddingHorizontal: 4 }}>
                <UIText size="sm" variant="unstyled" className="font-semibold" style={{ color: BRAND_BLUE }}>
                  Done
                </UIText>
              </AnimatedPressable>
            </View>
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
