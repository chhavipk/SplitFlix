import { describe, it, expect } from "vitest";
import { cartTotal, matchesCatalog, whatsappUrl } from "@/lib/marketplace";
describe("marketplace rules", () => {
  it("adds existing subscription prices without a bundle discount", () =>
    expect(
      cartTotal(
        [
          { id: "netflix", price: 199 },
          { id: "prime", price: 99 },
        ],
        ["netflix", "prime"],
      ),
    ).toBe(298));
  it("does not charge twice for the same selected plan", () =>
    expect(cartTotal([{ id: "netflix", price: 199 }], ["netflix", "netflix"])).toBe(199));
  it("limits search results to the selected category", () => {
    expect(
      matchesCatalog({ name: "Spotify", tagline: "Music", category: "Music" }, "SPOT", "Music"),
    ).toBe(true);
    expect(
      matchesCatalog({ name: "Spotify", tagline: "Music", category: "Music" }, "SPOT", "OTT"),
    ).toBe(false);
  });
  it("does not open WhatsApp when no support number is configured", () =>
    expect(whatsappUrl("", "Help")).toBe(null));
});
