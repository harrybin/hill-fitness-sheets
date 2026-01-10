import { describe, it, expect } from "vitest";
import { toISODate, formatDateDE } from "../utils";

describe("toISODate", () => {
  it("converts DD.MM.YYYY to YYYY-MM-DD", () => {
    expect(toISODate("09.01.2026")).toBe("2026-01-09");
  });
  it("passes through ISO YYYY-MM-DD unchanged", () => {
    expect(toISODate("2026-01-09")).toBe("2026-01-09");
  });
  it("trims interpolation marker and whitespace", () => {
    expect(toISODate(" 2026-01-09 ? ")).toBe("2026-01-09");
  });
  it("handles invalid input gracefully", () => {
    expect(toISODate("")).toBe("");
    expect(toISODate("n/a")).toBe("n/a");
  });
});

describe("formatDateDE", () => {
  it("formats ISO to DD.MM.YYYY", () => {
    expect(formatDateDE("2026-01-09")).toBe("09.01.2026");
  });
  it("formats legacy DD.MM.YYYY input to itself", () => {
    expect(formatDateDE("09.01.2026")).toBe("09.01.2026");
  });
});
