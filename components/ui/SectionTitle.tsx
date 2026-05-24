import { View, Text } from "react-native";

interface Props {
  title: string;
}

export default function SectionTitle({ title }: Props) {
  return (
    <Text className="text-brand-muted text-[11px] font-medium uppercase tracking-widest mb-2 mt-0.5">
      {title}
    </Text>
  );
}
