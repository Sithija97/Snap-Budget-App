import { View } from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BRAND_BLUE } from '@/constants/colors';
import { UIText } from './UIText';
import { AnimatedPressable } from './AnimatedPressable';
import { PickerModal } from './PickerModal';

interface ImageSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

function SourceOption({
  icon,
  label,
  description,
  onPress,
  borderColor,
  textColor,
  mutedColor,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      pressScale={0.98}
      contentStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor,
      }}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{ backgroundColor: `${BRAND_BLUE}1a` }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <UIText size="sm" variant="unstyled" className="font-semibold" style={{ color: textColor }}>
          {label}
        </UIText>
        <UIText size="xs" variant="unstyled" style={{ color: mutedColor, marginTop: 1 }}>
          {description}
        </UIText>
      </View>
    </AnimatedPressable>
  );
}

// Source-picker sheet shown when the user taps "Add receipt" — lets a
// payment-confirmation screenshot (already sitting in the gallery) go
// through the same Gemini Vision pipeline as a fresh camera photo, instead
// of only supporting live capture.
export function ImageSourceModal({ visible, onClose, onSelectCamera, onSelectGallery }: ImageSourceModalProps) {
  const { border: borderColor, foreground: textColor, mutedFg: mutedColor } = useThemeColors();

  return (
    <PickerModal visible={visible} title="Add receipt" onClose={onClose} onConfirm={onClose}>
      <View style={{ gap: 10 }}>
        <SourceOption
          icon={<Camera size={20} color={BRAND_BLUE} strokeWidth={2} />}
          label="Take Photo"
          description="Scan a receipt with your camera"
          onPress={onSelectCamera}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
        />
        <SourceOption
          icon={<ImageIcon size={20} color={BRAND_BLUE} strokeWidth={2} />}
          label="Choose from Gallery"
          description="Pick a receipt or payment screenshot"
          onPress={onSelectGallery}
          borderColor={borderColor}
          textColor={textColor}
          mutedColor={mutedColor}
        />
      </View>
    </PickerModal>
  );
}
