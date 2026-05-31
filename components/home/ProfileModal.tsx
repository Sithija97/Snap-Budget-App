import { memo } from "react";
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { LogOut } from "lucide-react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";

interface Props {
  visible:  boolean;
  name:     string;
  email:    string;
  onClose:  () => void;
}

function ProfileModal({ visible, name, email, onClose }: Props) {
  const initial = name.charAt(0).toUpperCase();

  const handleSignOut = () => {
    onClose();
    router.replace("/login");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/45 justify-end">
          <TouchableWithoutFeedback onPress={() => {}}>
            <View className="bg-brand-card rounded-t-[26px] px-6 pt-3 pb-10">
              {/* Handle */}
              <View className="w-10 h-1 rounded-full bg-brand-border self-center mb-[22px]" />

              {/* User info */}
              <View className="flex-row items-center gap-[14px] mb-7">
                <View
                  className="w-[54px] h-[54px] rounded-full bg-brand-green items-center justify-center"
                  style={{
                    shadowColor: Colors.green,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="text-[22px] font-bold text-white">{initial}</Text>
                </View>
                <View>
                  <Text className="text-[17px] font-bold text-brand-black">{name}</Text>
                  <Text className="text-[13px] text-brand-muted mt-0.5">{email}</Text>
                </View>
              </View>

              {/* Sign out */}
              <TouchableOpacity
                className="flex-row items-center gap-3 p-[15px] bg-brand-redBg rounded-[14px]"
                activeOpacity={0.8}
                onPress={handleSignOut}
              >
                <LogOut size={18} color={Colors.red} strokeWidth={2} />
                <Text className="text-[14px] font-semibold text-brand-red">Sign out</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default memo(ProfileModal);
