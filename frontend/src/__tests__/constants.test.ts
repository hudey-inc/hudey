/**
 * Constants tests — verify static data integrity.
 */

import { describe, it, expect } from "vitest";
import { INDUSTRY_OPTIONS } from "@/lib/constants";

describe("INDUSTRY_OPTIONS", () => {
  it("has 12 options", () => {
    expect(INDUSTRY_OPTIONS).toHaveLength(12);
  });

  it("includes common industries", () => {
    expect(INDUSTRY_OPTIONS).toContain("Technology");
    expect(INDUSTRY_OPTIONS).toContain("Fashion & Apparel");
    expect(INDUSTRY_OPTIONS).toContain("Beauty & Skincare");
  });

  it("ends with Other", () => {
    expect(INDUSTRY_OPTIONS[INDUSTRY_OPTIONS.length - 1]).toBe("Other");
  });

  it("has no duplicates", () => {
    const unique = new Set(INDUSTRY_OPTIONS);
    expect(unique.size).toBe(INDUSTRY_OPTIONS.length);
  });
});
