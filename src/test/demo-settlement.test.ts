import { describe, expect, it } from "vitest";
import { createDemoBackend } from "@/lib/demo/backend";
import type { Page, Settlement } from "@/lib/api/types";
import { estimateNet, INTRO_FEE_CENTAVOS, REGULAR_FEE_CENTAVOS } from "@/lib/money";

describe("fleet settlement routing (sample/display only, not backend enforcement)", () => {
  it("returns fleet management wallet recipients rather than fleet drivers", async () => {
    const demo = createDemoBackend();
    const result = await demo.handle("settlement.list") as Page<Settlement>;
    expect(result.items).toHaveLength(2);
    for (const settlement of result.items) {
      expect(settlement.settlementRecipient).toEqual({ kind: "fleet_management_wallet", fleetId: demo.state.identity.fleet.id });
    }
  });

  it("allocates the sample platform fees to ALiN Move revenue", async () => {
    const result = await createDemoBackend().handle("settlement.list") as Page<Settlement>;
    expect(result.items.map((s) => s.platformFeeRecipient)).toEqual(["alin_move_revenue", "alin_move_revenue"]);
  });

  it("displays a single ₱399 intro deduction on ₱10,000 gross", () => {
    const settlement = createDemoBackend().state.settlements[0];
    expect(INTRO_FEE_CENTAVOS).toBe(39_900);
    expect(settlement?.feeCentavos).toBe(39_900);
    expect(settlement?.netPayableCentavos).toBe(960_100);
    expect(estimateNet(1_000_000, INTRO_FEE_CENTAVOS)).toBe(960_100);
  });

  it("displays a single ₱1,000 regular deduction on ₱10,000 gross", () => {
    expect(REGULAR_FEE_CENTAVOS).toBe(100_000);
    expect(estimateNet(1_000_000, REGULAR_FEE_CENTAVOS)).toBe(900_000);
  });

  it("does not credit wallets or drivers when viewing sample settlements", async () => {
    const demo = createDemoBackend();
    const before = structuredClone(demo.state);
    await demo.handle("settlement.list");
    expect(demo.state).toEqual(before);
  });

  it("keeps unapproved payout commands blocked without changing sample records", async () => {
    const demo = createDemoBackend();
    const before = structuredClone(demo.state);
    await expect(demo.handle("settlement.payoutRequest", { id: "stl-1" })).rejects.toMatchObject({ code: "POLICY_UNRESOLVED" });
    expect(demo.state).toEqual(before);
  });
});