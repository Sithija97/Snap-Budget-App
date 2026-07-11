import { describe, it, expect } from "vitest";
import { fmt, parseAmount } from "./format";

describe("fmt", () => {
  it("formats with the Rs prefix and thousands separators", () => {
    expect(fmt(1250)).toBe("Rs 1,250");
    expect(fmt(0)).toBe("Rs 0");
  });
});

describe("parseAmount", () => {
  it("strips currency formatting back to a number", () => {
    expect(parseAmount("Rs 1,250.50")).toBe(1250.5);
    expect(parseAmount("2340")).toBe(2340);
  });

  it("returns 0 for empty or non-numeric input", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("Rs ")).toBe(0);
  });
});
