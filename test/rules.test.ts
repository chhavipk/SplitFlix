import { describe, expect, it } from "vitest";
import { canAssign, daysLeft, discountPct, expiryFrom, slotsLeft, refundAllowedAfterDelivery } from "@/lib/rules";

describe("business rules", () => {
  it("does not offer refunds after credentials are provided", () => expect(refundAllowedAfterDelivery(true)).toBe(false));
  it("never shows negative slots", () => expect(slotsLeft(4, 6)).toBe(0));
  it("blocks assigning to a full account", () => {
    expect(canAssign(4, 4)).toBe(false);
    expect(canAssign(4, 3)).toBe(true);
  });
  it("3 month plan expires 3 months later", () =>
    expect(expiryFrom(new Date("2026-01-15T00:00:00Z"), 3).toISOString()).toBe("2026-04-15T00:00:00.000Z"));
  it("counts days left", () =>
    expect(daysLeft("2026-01-11T00:00:00Z", new Date("2026-01-01T00:00:00Z"))).toBe(10));
  it("computes discount", () => expect(discountPct(199, 649)).toBe(69));
});
