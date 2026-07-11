export const fmt = (n: number) => `Rs ${n.toLocaleString()}`;

// Inverse of fmt — strips everything non-numeric so "Rs 1,250.50" -> 1250.5
export const parseAmount = (input: string): number => {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
