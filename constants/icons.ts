import {
  ShoppingCart,
  Car,
  CircleArrowDown,
  Smartphone,
  ShoppingBag,
  Coffee,
  Laptop,
  HeartPulse,
} from "lucide-react-native";

export const TX_ICONS: Record<string, any> = {
  ShoppingCart,
  Car,
  CircleArrowDown,
  Smartphone,
  ShoppingBag,
  Coffee,
  Laptop,
  HeartPulse,
};

export const CAT_ICONS: Record<string, any> = {
  Groceries: ShoppingCart,
  Food:      Coffee,
  Transport: Car,
  Shopping:  ShoppingBag,
  Bills:     Smartphone,
  Health:    HeartPulse,
};
