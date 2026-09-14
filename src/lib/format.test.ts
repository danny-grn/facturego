import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateShort, formatDateTime, initials } from "./format";

describe("formatCurrency", () => {
  it("formats EUR amounts using fr-FR conventions", () => {
    const result = formatCurrency(1892);
    expect(result).toContain("892");
    expect(result).toContain("€");
  });
});

describe("date formatters", () => {
  it.each([formatDate, formatDateShort, formatDateTime])("returns an em dash for null/undefined/invalid input", (fn) => {
    expect(fn(null)).toBe("—");
    expect(fn(undefined)).toBe("—");
    expect(fn("not-a-date")).toBe("—");
  });

  it("formats a valid ISO date", () => {
    expect(formatDate("2026-08-14")).toContain("2026");
    expect(formatDateShort("2026-08-14")).toContain("2026");
  });
});

describe("initials", () => {
  it("returns two letters for a single word", () => {
    expect(initials("Studio")).toBe("ST");
  });

  it("returns first and last initials for multiple words", () => {
    expect(initials("Jeanne Dupont")).toBe("JD");
  });

  it("returns a placeholder for an empty string", () => {
    expect(initials("")).toBe("?");
  });
});
