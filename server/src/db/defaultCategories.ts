// Seeded into every new user's categories table on first sign-in.
// Mirrors constants/seedData.ts DEFAULT_CATEGORIES on the frontend, minus the
// stable string ids (the DB assigns its own uuids per user).
export const DEFAULT_CATEGORIES = [
  { name: "Groceries", type: "expense" as const, icon: "ShoppingCart",    isDefault: true },
  { name: "Food",      type: "expense" as const, icon: "Coffee",          isDefault: true },
  { name: "Transport", type: "expense" as const, icon: "Car",             isDefault: true },
  { name: "Shopping",  type: "expense" as const, icon: "ShoppingBag",     isDefault: true },
  { name: "Bills",     type: "expense" as const, icon: "Smartphone",      isDefault: true },
  { name: "Health",    type: "expense" as const, icon: "HeartPulse",      isDefault: true },
  { name: "Salary",    type: "income"  as const, icon: "CircleArrowDown", isDefault: true },
  { name: "Freelance", type: "income"  as const, icon: "Laptop",          isDefault: true },
];
